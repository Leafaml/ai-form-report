import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const SYSTEM_PROMPT = `你是 AI 智能表单助手，帮助用户设计表单、分析数据、优化填写体验。
你可以：建议表单结构、分析数据问题、提供优化建议、解答表单相关疑问。
回答用中文，简洁专业，每次回复控制在 200 字以内。`;

// POST /api/ai/chat — SSE 流式聊天
router.post("/chat", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { message } = req.body;
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
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
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
