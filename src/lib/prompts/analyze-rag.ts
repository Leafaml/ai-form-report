/**
 * RAG 增强分析 Prompt 模板
 *
 * ## 与基础版的区别
 * - **增加"参考背景知识"章节**：将用户上传的资料中与答卷内容相关的片段
 *   注入 prompt，使 AI 能结合外部知识做出更有针对性的分析。
 * - **要求引用来源**：分析结果中需注明哪些结论来自于背景知识，
 *   便于用户验证 AI 的分析是否"有据可依"——这是 RAG 的核心价值。
 *
 * ## 设计思路
 * - 背景知识放在 prompt 开头（在数据之前），因为 LLM 倾向于更重视
 *   先出现的上下文。先让它"了解你的业务"，再看数据，产出更精准。
 * - 主题分布增加 `source` 字段，区分"来自数据"和"来自背景知识"。
 * - 保留 fallback：如果 context 为空，prompt-builder 可跳过此模板
 *   直接使用 analyze-basic。
 */

import type { AnalyzeInput } from "@/lib/ai";

/** System Prompt — RAG 增强版角色设定 */
export const RAG_SYSTEM_PROMPT = `你是一个专业的数据分析师，擅长结合用户提供的背景资料分析表单数据。
你的分析必须：客观、简洁、可操作；使用中文输出；严格遵循指定的 JSON 格式。
如果背景资料与答卷数据有矛盾，以答卷实际数据为准，并在分析中注明差异。`;

/**
 * 构建 RAG 增强的 User Prompt
 *
 * @param input   表单数据
 * @param context 从知识库检索到的背景文本片段（已拼接为单个字符串）
 */
export function buildRagPrompt(input: AnalyzeInput, context: string): string {
  const { formTitle, fields, submissions } = input;

  // ── 构建回复数据（与基础版相同格式）──
  const dataText = submissions
    .map((sub, i) => {
      const answers = fields
        .map((f) => {
          const raw = sub.data[f.label] || "（未填写）";
          const display = Array.isArray(raw) ? raw.join("、") : raw;
          return `  ${f.label}: ${display}`;
        })
        .join("\n");
      return `回复 #${i + 1}（${new Date(sub.created_at).toLocaleString("zh-CN")}）:\n${answers}`;
    })
    .join("\n\n");

  const fieldList = fields
    .map((f) => {
      const typeLabel =
        f.field_type === "text" || f.field_type === "textarea"
          ? "文本"
          : "选择";
      return `- ${f.label}（${typeLabel}）`;
    })
    .join("\n");

  // ── RAG 增强版 prompt ──
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
      "source": "data" | "knowledge"  // data=来自答卷，knowledge=来自背景知识
    }
  ],
  "suggestion": "结合背景知识，给表单创建者一条具体的行动建议（50字以内）"
}`;
}
