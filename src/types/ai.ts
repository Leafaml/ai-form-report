/** DeepSeek API 兼容 Anthropic 格式的响应体 */
export interface AiApiResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** 主题分析中的单个主题 */
export interface ThemeItem {
  theme: string;
  count: number;
  detail: string;
  /** RAG 增强版会标注来源：data=来自答卷，knowledge=来自背景知识 */
  source?: "data" | "knowledge";
}

/** AI 分析结果 —— 解析后的 JSON */
export interface AnalysisResult {
  summary: string;
  keywords: string[];
  sentiment: "正面" | "中性" | "负面";
  sentimentReason: string;
  themes: ThemeItem[];
  suggestion: string;
  /** 降级兜底：AI 未按 JSON 格式返回时的原始文本 */
  raw?: string;
}

/** POST /api/analyze 的请求体 */
export interface AnalyzeRequest {
  formId: string;
}

/** POST /api/analyze 的成功响应体 */
export interface AnalyzeResponse {
  formTitle: string;
  count: number;
  analysis: AnalysisResult;
  /** 是否使用了 RAG 增强（用户提供了背景知识） */
  hasContext?: boolean;
}
