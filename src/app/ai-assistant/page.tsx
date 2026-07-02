"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "@/lib/api-client";
import { Sparkles, Send, Lightbulb, BarChart3, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { icon: Lightbulb, text: "帮我设计一份用户满意度调查问卷" },
  { icon: BarChart3, text: "如何提高表单的填写率？" },
  { icon: Lightbulb, text: "分析我的表单数据需要注意什么？" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AiAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const token = getToken();
    if (!token || !text.trim() || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      // 传递最近 20 条历史消息，让 AI 记住上下文
      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            if (json.error) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: json.error } : m
              ));
            } else if (json.text) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + json.text } : m
              ));
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "AI 服务暂不可用，请稍后重试" } : m
      ));
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-3xl mx-auto w-full">
      <div className="mb-4 shrink-0 px-4 pt-4">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Sparkles className="size-5" style={{ color: "var(--primary)" }} />
          AI 助手
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          你的智能表单助手，可以帮你设计表单、分析数据、优化填写体验
        </p>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
        <AnimatePresence>
          {empty && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="size-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
                <Sparkles className="size-7 text-white" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>你好，我是 AI 表单助手</h2>
              <p className="text-sm mt-2 text-center" style={{ color: "var(--muted-foreground)" }}>
                我可以帮你生成表单、分析数据、优化填写体验
              </p>
              <div className="w-full space-y-2 mt-6">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      whileHover={{ y: -2 }}
                      onClick={() => sendMessage(s.text)}
                      className="w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 hover:border-primary/30"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>{s.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ${
              msg.role === "user"
                ? ""
                : ""
            }`}
              style={{ background: msg.role === "user" ? "var(--muted-foreground)" : "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
              {msg.role === "user" ? "我" : <Sparkles className="size-3.5" />}
            </div>
            <div
              className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: msg.role === "user"
                  ? "color-mix(in srgb, var(--primary) 90%, #4f46e5)"
                  : "var(--card)",
                color: msg.role === "user" ? "#fff" : "var(--foreground)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
              }}
            >
              {msg.content || (
                <span className="inline-flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                  <Loader2 className="size-4 animate-spin" />
                  思考中...
                </span>
              )}
            </div>
          </motion.div>
        ))}
        {loading && messages[messages.length - 1]?.content && (
          <div className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            AI 正在生成...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* 输入框 */}
      <div className="shrink-0 p-4">
        <div className="rounded-2xl border p-2 shadow-lg" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex items-end gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入你的需求，AI 帮你搞定..."
              className="flex-1 px-3 py-2 text-sm border-0 outline-none bg-transparent"
              style={{ color: "var(--foreground)" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="size-10 rounded-xl shrink-0 flex items-center justify-center text-white transition-all disabled:opacity-30 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: "var(--muted-foreground)" }}>
          AI 生成内容仅供参考，请根据实际情况调整
        </p>
      </div>
    </div>
  );
}
