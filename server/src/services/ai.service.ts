import crypto from "crypto";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/error-handler";

// ── 类型定义 ──

interface ThemeItem {
  theme: string;
  count: number;
  detail: string;
  source?: "data" | "knowledge";
}

interface AnalysisResult {
  summary: string;
  keywords: string[];
  sentiment: "正面" | "中性" | "负面";
  sentimentReason: string;
  themes: ThemeItem[];
  suggestion: string;
  raw?: string;
}

interface AnalyzeInput {
  formTitle: string;
  fields: { label: string; fieldType: string }[];
  submissions: { data: Record<string, string | string[]>; createdAt: string }[];
}

// ── Prompt 模板 ──

const SYSTEM_PROMPT = `你是一个专业的数据分析师，擅长从用户反馈中提取洞察。
你的分析必须：客观、简洁、可操作；使用中文输出；严格遵循指定的 JSON 格式。`;

const RAG_SYSTEM_PROMPT = `你是一个专业的数据分析师，擅长结合用户提供的背景资料分析表单数据。
你的分析必须：客观、简洁、可操作；使用中文输出；严格遵循指定的 JSON 格式。
如果背景资料与答卷数据有矛盾，以答卷实际数据为准，并在分析中注明差异。`;

function buildAnalyzePrompt(input: AnalyzeInput): string {
  const { formTitle, fields, submissions } = input;

  const dataText = submissions
    .map((sub, i) => {
      const answers = fields
        .map((f) => {
          const raw = sub.data[f.label] || "（未填写）";
          const display = Array.isArray(raw) ? raw.join("、") : raw;
          return `  ${f.label}: ${display}`;
        })
        .join("\n");
      return `回复 #${i + 1}（${new Date(sub.createdAt).toLocaleString("zh-CN")}）:\n${answers}`;
    })
    .join("\n\n");

  const fieldList = fields
    .map((f) => {
      const typeLabel = f.fieldType === "text" || f.fieldType === "textarea" ? "文本" : "选择";
      return `- ${f.label}（${typeLabel}）`;
    })
    .join("\n");

  return `你是一个数据分析师。以下是一个名为"${formTitle}"的表单的 ${submissions.length} 条回复数据。

表单字段：
${fieldList}

全部回复：
${dataText}

请分析这些数据，用以下 JSON 格式返回（务必严格 JSON，不要额外文本）：

{
  "summary": "一句话总结所有回复的核心内容（40字以内）",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "sentiment": "正面" | "中性" | "负面",
  "sentimentReason": "一句话解释情感倾向判断的依据",
  "themes": [
    {"theme": "主题名", "count": 提及人数, "detail": "一句话描述"}
  ],
  "suggestion": "基于数据给表单创建者的一条行动建议（30字以内）"
}`;
}

function buildRagPrompt(input: AnalyzeInput, context: string): string {
  const { formTitle, fields, submissions } = input;

  const dataText = submissions
    .map((sub, i) => {
      const answers = fields
        .map((f) => {
          const raw = sub.data[f.label] || "（未填写）";
          const display = Array.isArray(raw) ? raw.join("、") : raw;
          return `  ${f.label}: ${display}`;
        })
        .join("\n");
      return `回复 #${i + 1}（${new Date(sub.createdAt).toLocaleString("zh-CN")}）:\n${answers}`;
    })
    .join("\n\n");

  const fieldList = fields
    .map((f) => {
      const typeLabel = f.fieldType === "text" || f.fieldType === "textarea" ? "文本" : "选择";
      return `- ${f.label}（${typeLabel}）`;
    })
    .join("\n");

  return `## 参考背景知识
以下内容来自表单创建者提供的相关资料，请在分析时作为参考依据：
${context}

## 表单数据
表单名称："${formTitle}"
回复数：${submissions.length}

表单字段：
${fieldList}

全部回复：
${dataText}

## 分析要求
请结合上述"参考背景知识"和"表单数据"，用以下 JSON 格式返回分析结果（务必严格 JSON，不要额外文本）：

{
  "summary": "结合背景知识，一句话总结所有回复的核心发现（60字以内）",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"],
  "sentiment": "正面" | "中性" | "负面",
  "sentimentReason": "一句话解释情感倾向判断的依据",
  "themes": [
    {
      "theme": "主题名",
      "count": 提及人数,
      "detail": "一句话描述该主题",
      "source": "data" | "knowledge"
    }
  ],
  "suggestion": "结合背景知识，给表单创建者一条具体的行动建议（50字以内）"
}`;
}

// ── JSON 解析 ──

function extractJson(content: string): string {
  let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  if (cleaned.startsWith("{")) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace > 0) {
      cleaned = cleaned.slice(0, lastBrace + 1);
    }
  }
  return cleaned;
}

function parseAnalysis(content: string): AnalysisResult {
  try {
    return JSON.parse(extractJson(content)) as AnalysisResult;
  } catch {
    return {
      summary: content.substring(0, 80),
      keywords: [],
      sentiment: "中性",
      sentimentReason: "",
      themes: [],
      suggestion: "",
      raw: content,
    };
  }
}

// ── 缓存与限流工具 ──

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟
const RATE_LIMIT = 10; // 每小时每表单每用户 10 次

function hashSubmissions(submissions: { id: string; createdAt: Date }[]): string {
  const raw = submissions
    .map((s) => `${s.id}:${s.createdAt.toISOString()}`)
    .sort()
    .join(",");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ── 核心分析函数 ──

export async function analyzeForm(
  formId: string,
  userId: string,
  context?: string
) {
  // 1. 权限校验
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!form) throw new AppError(404, "表单不存在");
  if (form.userId !== userId) throw new AppError(403, "无权分析此表单");

  // 2. 获取提交数据
  const submissions = await prisma.submission.findMany({
    where: { formId },
    orderBy: { createdAt: "asc" },
  });
  if (submissions.length === 0) {
    throw new AppError(400, "暂无提交数据，无法分析");
  }

  const currentHash = hashSubmissions(submissions);

  // 3. 检查缓存
  const cached = await prisma.analysisCache.findFirst({
    where: { formId, userId },
    orderBy: { createdAt: "desc" },
  });

  if (cached && cached.submissionsHash === currentHash) {
    const age = Date.now() - cached.createdAt.getTime();
    if (age < CACHE_TTL_MS) {
      // 命中缓存
      return {
        formTitle: form.title,
        count: submissions.length,
        analysis: cached.result as unknown as AnalysisResult,
        cached: true,
        hasContext: !!context,
      };
    }
  }

  // 4. 频率限制（1 小时内 10 次）
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.analysisCache.count({
    where: {
      formId,
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });
  if (recentCount >= RATE_LIMIT) {
    throw new AppError(429, "分析过于频繁，请稍后再试（每小时最多 10 次）");
  }

  // 5. 构建 prompt 输入
  const input: AnalyzeInput = {
    formTitle: form.title,
    fields: form.fields.map((f) => ({
      label: f.label,
      fieldType: f.fieldType,
    })),
    submissions: submissions.map((s) => ({
      data: s.data as Record<string, string | string[]>,
      createdAt: s.createdAt.toISOString(),
    })),
  };

  const systemPrompt = context ? RAG_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const userPrompt = context
    ? buildRagPrompt(input, context)
    : buildAnalyzePrompt(input);

  // 6. 调用 DeepSeek API（使用用户自己的 key）
  const { getApiKey } = await import("./auth.service");
  const apiKey = await getApiKey(userId);
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: context ? 1536 : 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI 分析请求失败: ${res.status} ${errText}`);
  }

  interface AiResponse {
    content?: Array<{ type: string; text?: string }>;
  }
  const json = (await res.json()) as AiResponse;
  // DeepSeek v4-pro 返回多个 content 块（thinking + text），需取 text 类型的
  const textBlock = json.content?.find((c) => c.type === "text");
  const content = textBlock?.text || "";
  const analysis = parseAnalysis(content);

  // 7. 写入缓存
  await prisma.analysisCache.create({
    data: {
      formId,
      userId,
      result: JSON.parse(JSON.stringify(analysis)),
      submissionsHash: currentHash,
    },
  });

  return {
    formTitle: form.title,
    count: submissions.length,
    analysis,
    cached: false,
    hasContext: !!context,
  };
}
