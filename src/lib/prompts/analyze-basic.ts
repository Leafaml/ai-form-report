/**
 * 基础分析 Prompt 模板
 *
 * ## 设计思路
 * - **角色锚定**：通过"数据分析师"角色设定，引导模型产出结构化、客观的分析而非闲聊。
 * - **字段告知**：明确列出表单结构，帮助模型理解每列数据的语义（文本 vs 选择）。
 * - **输出约束前置**：在 prompt 末尾用 JSON 格式强约束输出，配合 `prompt-builder`
 *   的清理逻辑（去除 markdown 代码块标记），降低解析失败概率。
 * - **字数和数量限制**：summary 40 字 / suggestion 30 字 / keywords 3 个，
 *   防止模型过度发散，保持报告可读性。
 *
 * ## 已知局限
 * - 不区分字段权重——所有字段平等对待。如需重点分析某字段，应加入字段级指令。
 * - 情感分析基于整体判断，不提供逐回复的情绪分布。RAG 增强版会改进这一点。
 */

import type { AnalyzeInput } from "@/lib/ai";

/** System Prompt — 角色与行为约束 */
export const SYSTEM_PROMPT = `你是一个专业的数据分析师，擅长从用户反馈中提取洞察。
你的分析必须：客观、简洁、可操作；使用中文输出；严格遵循指定的 JSON 格式。`;

/**
 * 构建 User Prompt —— 将表单数据转化为自然语言分析请求
 *
 * @param input  表单标题、字段定义、提交记录
 * @returns       可直接发送给 LLM 的完整 prompt
 */
export function buildAnalyzePrompt(input: AnalyzeInput): string {
  const { formTitle, fields, submissions } = input;

  // ── 1. 构建每条回复的可读文本 ──
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

  // ── 2. 字段清单 ──
  const fieldList = fields
    .map((f) => {
      const typeLabel =
        f.field_type === "text" || f.field_type === "textarea"
          ? "文本"
          : "选择";
      return `- ${f.label}（${typeLabel}）`;
    })
    .join("\n");

  // ── 3. 拼接完整 prompt ──
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
