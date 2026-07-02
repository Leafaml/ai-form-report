/**
 * Prompt 构建器 — 统一组装 System Prompt 和 User Prompt
 *
 * ## 设计思路
 * - **关注点分离**：System Prompt 定义角色和基调，User Prompt 携带本次分析的具体数据。
 *   两者独立管理，方便后续升级（如替换 System Prompt 为更专业的角色设定，或叠加 RAG 上下文）。
 * - **格式清理**：LLM 经常在 JSON 外包 markdown 代码块（```json ... ```），
 *   提取和清理逻辑放在这里统一处理，避免散落在各处。
 * - **降级兜底**：如果 AI 返回的不是合法 JSON（罕见但可能），降级为纯文本返回，
 *   保证用户不会看到空白页面。
 *
 * ## 扩展点
 * - 如需 RAG 增强：在 `userContent` 拼接时注入 `context` 参数即可。
 * - 如需多轮对话：将历史消息作为 `messages` 数组的额外项传入。
 */

import type { AnalysisResult } from "@/types/ai";

/** 单个消息块 */
interface PromptMessage {
  role: "system" | "user";
  content: string;
}

/**
 * 组装发送给 LLM 的消息数组
 *
 * @param systemPrompt  角色设定（来自各 prompt 模板的 SYSTEM_PROMPT）
 * @param userContent   本次分析的具体请求（来自 buildXxxPrompt 的返回值）
 * @param context       可选：RAG 检索到的背景知识片段
 */
export function buildMessages(
  systemPrompt: string,
  userContent: string,
  context?: string
): PromptMessage[] {
  const messages: PromptMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  if (context) {
    messages.push({
      role: "user",
      content: `【参考背景知识】\n${context}`,
    });
  }

  messages.push({ role: "user", content: userContent });
  return messages;
}

/**
 * 清理 AI 返回的原始文本，提取 JSON
 *
 * 处理两种常见情况：
 * 1. LLM 把 JSON 包在 ```json ... ``` 代码块里
 * 2. 返回格式正确但带有多余的空白/换行
 */
export function extractJson(content: string): string {
  // 去除可能的 markdown 代码块标记
  let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // 如果内容以 { 开头，尝试截取到最后一个 }
  if (cleaned.startsWith("{")) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace > 0) {
      cleaned = cleaned.slice(0, lastBrace + 1);
    }
  }

  return cleaned;
}

/**
 * 解析 AI 返回内容为 AnalysisResult
 *
 * @returns 解析成功返回 AnalysisResult；失败返回降级结果（raw 字段存放原始文本）
 */
export function parseAnalysis(content: string): AnalysisResult {
  try {
    const jsonStr = extractJson(content);
    return JSON.parse(jsonStr) as AnalysisResult;
  } catch {
    // 降级：AI 未按 JSON 格式返回时，保留原始文本
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
