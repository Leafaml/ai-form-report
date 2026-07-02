import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const SYSTEM_PROMPT = `你是 AI 智能表单助手，是一个专业的表单设计与数据分析专家。

## 你的能力
1. **表单设计**：根据用户需求设计问卷结构、题目类型（短文本/多行文本/单选/多选）、选项设计
2. **数据分析建议**：指导用户如何分析收集到的数据，发现趋势和洞察
3. **填写率优化**：提供提升表单完成率的策略（题目顺序、文案优化、长度控制）
4. **行业知识**：了解用户调研、NPS、满意度调查、报名表等常见场景的最佳实践
5. **题目撰写**：帮用户把模糊的想法转化为清晰、无偏见的题目

## 回答规范
- 用中文，专业但不生硬，像一位有经验的产品经理在给你建议
- 给出具体可执行的方案，而不是泛泛而谈
- 如果用户需求不明确，主动追问细节
- 涉及到表单结构时，用清晰的格式列出题目示例
- 适度使用 emoji 让对话更友好，但不要过度

## 限制
- 不回答与表单、问卷、数据收集无关的问题
- 如果用户问的是具体某个表单的数据，提醒他们当前你无法直接访问表单数据`;

// POST /api/ai/chat — SSE 流式聊天
router.post("/chat", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { message, history } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ error: "消息不能为空" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const { getApiKey } = await import("../services/auth.service");
  const apiKey = await getApiKey(String(req.userId!)).catch(() => {
    res.write(`data: ${JSON.stringify({ error: "请先在设置中配置 DeepSeek API Key" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return null;
  });
  if (!apiKey) return;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

  // 构建消息列表：历史记录 + 当前消息
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role === "user" || h.role === "assistant") {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }
  messages.push({ role: "user", content: message });

  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: "AI 服务请求失败" })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "无法读取流" })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          // DeepSeek 流式格式：{ type: "content_block_delta", delta: { type: "text_delta", text: "..." } }
          // 或 Anthropic 格式：{ type: "content_block_delta", delta: { text: "..." } }
          const text =
            json.delta?.text_delta
            || json.delta?.text
            || json.content_block?.text
            || "";
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "AI 服务连接失败" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

export default router;
