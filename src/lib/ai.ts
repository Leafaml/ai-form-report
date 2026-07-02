import type { AiApiResponse, AnalysisResult } from "@/types/ai";
import { SYSTEM_PROMPT, buildAnalyzePrompt } from "@/lib/prompts/analyze-basic";
import { RAG_SYSTEM_PROMPT, buildRagPrompt } from "@/lib/prompts/analyze-rag";
import { parseAnalysis } from "@/lib/prompts/prompt-builder";

export interface AnalyzeInput {
  formTitle: string;
  fields: {
    label: string;
    field_type: string;
  }[];
  submissions: {
    data: Record<string, string | string[]>;
    created_at: string;
  }[];
}

/**
 * 调用 DeepSeek API 分析表单提交数据
 *
 * 管线：
 * 1. buildAnalyzePrompt() 将结构化数据转为自然语言 prompt
 * 2. 系统提示词 + 用户 prompt 一同发送
 * 3. parseAnalysis() 清洗并解析 AI 返回的 JSON
 */
export async function analyzeSubmissions(
  input: AnalyzeInput
): Promise<AnalysisResult | null> {
  const { submissions } = input;

  if (submissions.length === 0) return null;

  // ── 构建 prompt（模板化，见 src/lib/prompts/）──
  const userPrompt = buildAnalyzePrompt(input);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: 1024,
      // Anthropic 格式：system 为顶级参数
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI 分析请求失败: ${res.status} ${errText}`);
  }

  const json: AiApiResponse = await res.json();
  // DeepSeek v4-pro 返回多个 content 块（thinking + text），需取 text 类型的
  const textBlock = json.content?.find((c) => c.type === "text");
  const content = textBlock?.text || "";

  return parseAnalysis(content);
}

/**
 * RAG 增强版分析 —— 结合背景知识分析提交数据
 *
 * 管线：
 * 1. buildRagPrompt() 将背景知识 + 表单数据转为 prompt
 * 2. 使用 RAG 专用 System Prompt
 * 3. parseAnalysis() 清洗并解析 AI 返回的 JSON
 *
 * @param input   表单数据
 * @param context 用户提供的背景资料文本（已拼接）
 */
export async function analyzeSubmissionsWithContext(
  input: AnalyzeInput,
  context: string
): Promise<AnalysisResult | null> {
  const { submissions } = input;

  if (submissions.length === 0) return null;

  const userPrompt = buildRagPrompt(input, context);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: 1536, // RAG 版返回更详细，需要更多 token
      system: RAG_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI 分析请求失败: ${res.status} ${errText}`);
  }

  const json: AiApiResponse = await res.json();
  // DeepSeek v4-pro 返回多个 content 块（thinking + text），需取 text 类型的
  const textBlock = json.content?.find((c) => c.type === "text");
  const content = textBlock?.text || "";

  return parseAnalysis(content);
}
