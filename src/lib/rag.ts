/**
 * 轻量级 RAG（检索增强生成）— 第 1 版
 *
 * ## 设计取舍
 * - **不上向量数据库**：用关键词匹配替代 embedding 检索，降低部署复杂度。
 *   面试场景下，重点是展示 RAG 链路（分块 → 检索 → 注入 prompt），
 *   而非向量检索本身。
 * - **文本输入而非文件上传**：降低 UI 复杂度，用户直接粘贴背景资料即可。
 * - **段落级分块**：以双换行为边界，2-5 段组成一个 chunk，相邻 chunk 有重叠，
 *   保证跨段落语境不丢失。
 *
 * ## 升级路径（V1.2）
 * - 替换关键词匹配 → embedding + pgvector / LanceDB
 * - 支持 PDF / Markdown 文件上传
 * - chunk 大小动态调整（基于语义边界而非固定段落数）
 */

/** 一个文本块 */
export interface Chunk {
  index: number;
  text: string;
  /** 从块中提取的关键词（用于匹配） */
  keywords: string[];
}

/**
 * 中文分词简化版 —— 按常见标点和空格分割
 *
 * 注意：这不是真正的分词器（如 jieba），但对于关键词匹配 RAG 够用。
 * V1.2 可接入 jieba-wasm 或调用 AI 分词。
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，。.！!？?：:；;、（）()【】\[\]《》""''""]+/)
    .filter((w) => w.length >= 2); // 过滤单字和空串
}

/**
 * 计算两个词集合的 Jaccard 相似度
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 将文本按段落切分成多个 chunk
 *
 * 策略：以双换行分隔段落，每 2-5 段组成一个 chunk，
 * 相邻 chunk 之间重叠 1 个段落。
 */
export function chunkText(text: string): Chunk[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10); // 过滤过短的段落（标题/空行）

  if (paragraphs.length === 0) return [];

  const chunks: Chunk[] = [];
  const CHUNK_MIN = 2; // 每块至少 2 段
  const CHUNK_MAX = 5; // 每块最多 5 段
  const OVERLAP = 1;   // 重叠段数

  let i = 0;
  let idx = 0;

  while (i < paragraphs.length) {
    // 动态块大小：尽量接近 CHUNK_MAX，但不超过剩余段落数
    const size = Math.min(CHUNK_MAX, paragraphs.length - i, CHUNK_MAX);
    const chunkParas = paragraphs.slice(i, i + size);

    if (chunkParas.length === 0) break;

    const text = chunkParas.join("\n\n");
    const keywords = tokenize(text);
    // 去重并取前 20 个高频词
    const uniqueKw = [...new Set(keywords)].slice(0, 20);

    chunks.push({ index: idx, text, keywords: uniqueKw });

    idx++;
    i += size - OVERLAP; // 减去重叠，保证下一块覆盖部分相同内容
    if (i <= chunks[chunks.length - 1]?.index) i = chunks.length * (size - OVERLAP); // 防止死循环
  }

  // 简化：如果段落数很少，直接每段一个 chunk
  if (chunks.length === 0 && paragraphs.length > 0) {
    return paragraphs.map((text, i) => ({
      index: i,
      text,
      keywords: tokenize(text).slice(0, 20),
    }));
  }

  return chunks;
}

/**
 * 基于关键词匹配检索最相关的 chunk
 *
 * @param query     检索查询（基于用户提交的文本内容）
 * @param chunks    文本块列表
 * @param topK      返回最相关的 topK 个块（默认 3）
 * @returns         按相似度降序排列的 chunk 文本
 */
export function retrieveChunks(
  query: string,
  chunks: Chunk[],
  topK: number = 3
): string[] {
  if (chunks.length === 0) return [];

  const queryTokens = new Set(tokenize(query));

  // 计算每个 chunk 与 query 的相似度
  const scored = chunks.map((chunk) => {
    const chunkTokens = new Set(chunk.keywords);
    return {
      text: chunk.text,
      score: jaccardSimilarity(queryTokens, chunkTokens),
    };
  });

  // 按相似度降序，取 topK
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s) => s.score > 0) // 排除完全不相关的
    .map((s) => s.text);
}
