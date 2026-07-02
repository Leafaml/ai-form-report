"use client";

import { useState } from "react";
import { analyzeForm } from "@/lib/api-client";
import { useErrorDismiss } from "@/hooks/useErrorDismiss";

interface AnalyzeData {
  formTitle: string;
  count: number;
  analysis: {
    summary: string;
    keywords: string[];
    sentiment: "正面" | "中性" | "负面";
    sentimentReason: string;
    themes: { theme: string; count: number; detail: string; source?: string }[];
    suggestion: string;
    raw?: string;
  };
  cached: boolean;
  hasContext: boolean;
}

export default function ReportClient({ formId }: { formId: string }) {
  const [contextText, setContextText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useErrorDismiss();
  const [data, setData] = useState<AnalyzeData | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const result = await analyzeForm(formId, contextText.trim() || undefined);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  // ── 空闲态 ──
  if (!data && !loading) {
    return (
      <div>
        <div
          className="rounded-2xl border p-5 mb-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            📄 背景知识（可选 · RAG 增强）
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
            粘贴与表单主题相关的背景资料，AI 将结合这些信息给出更有针对性的分析。
          </p>
          <textarea
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            placeholder="例如：这是一份面向大学生群体的在线教育产品满意度调查..."
            rows={3}
            className="w-full px-4 py-3 text-sm rounded-xl border outline-none resize-none transition-all focus:ring-2"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-body)" }}
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl mb-4 text-sm text-center"
            style={{ background: "var(--red-soft)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <div className="text-center">
          <button onClick={runAnalysis}
            className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-2xl font-semibold text-base hover:scale-[1.02] active:scale-[0.99] transition-all"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "0 4px 16px rgba(99,102,241,.3)" }}>
            🤖 开始 AI 分析
          </button>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>分析预计需要 10-15 秒</p>
        </div>
      </div>
    );
  }

  // ── 加载态 ──
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: "var(--accent-surface)" }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>AI 正在分析你的数据...</span>
        </div>
      </div>
    );
  }

  // ── 错误态 ──
  if (error && !data) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-sm mb-4" style={{ color: "var(--foreground)" }}>{error}</p>
        <button onClick={runAnalysis}
          className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "var(--primary)" }}>重新分析</button>
      </div>
    );
  }

  if (!data?.analysis) return null;
  const { analysis, count } = data;

  // ── 结果展示 ──
  return (
    <div>
      {/* 概览网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="rounded-2xl border p-4 text-center" style={{ background: "var(--accent-surface)", borderColor: "var(--accent-soft)" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{count}</div>
          <div className="text-xs mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>回复总数</div>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ background: "var(--amber-surface)", borderColor: "var(--amber-soft)" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--amber)" }}>{analysis.keywords.length}</div>
          <div className="text-xs mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>关键主题</div>
        </div>
        <div className="rounded-2xl border p-4 text-center"
          style={{ background: analysis.sentiment === "正面" ? "var(--green-soft)" : analysis.sentiment === "负面" ? "var(--red-soft)" : "var(--accent-surface)", borderColor: "transparent" }}>
          <div className="text-2xl font-bold"
            style={{ color: analysis.sentiment === "正面" ? "var(--green)" : analysis.sentiment === "负面" ? "var(--red)" : "var(--accent)" }}>
            {analysis.sentiment}
          </div>
          <div className="text-xs mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>整体情绪</div>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--text-h1)" }}>{analysis.themes.length}</div>
          <div className="text-xs mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>讨论主题</div>
        </div>
      </div>

      {/* 核心洞察 */}
      <div className="relative rounded-2xl p-6 mb-8 overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--amber)))", boxShadow: "0 4px 20px rgba(91,95,227,.25)" }}>
        <div className="relative z-10">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-white/70">
            📊 AI 核心洞察
            {data.hasContext && <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">RAG 增强</span>}
            {data.cached && <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">缓存</span>}
          </div>
          <p className="text-xl font-bold leading-relaxed text-white">{analysis.summary}</p>
          {analysis.sentimentReason && <p className="text-sm mt-3 text-white/75">{analysis.sentimentReason}</p>}
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>🔑 关键词</div>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: "var(--amber-surface)", color: "var(--amber)", border: "1px solid var(--amber-soft)" }}>{kw}</span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>💡 行动建议</div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>{analysis.suggestion || "暂无建议"}</p>
        </div>
      </div>

      {analysis.themes.length > 0 && (
        <div className="rounded-2xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--muted-foreground)" }}>📈 主题分析</div>
          <div className="space-y-4">
            {analysis.themes.map((t, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--text-h1)" }}>
                    {t.theme}
                    {t.source && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs"
                        style={{ background: t.source === "knowledge" ? "var(--accent-soft)" : "var(--bg-hover)", color: t.source === "knowledge" ? "var(--accent)" : "var(--text-muted)" }}>
                        {t.source === "knowledge" ? "背景" : "数据"}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{t.count} 人提及</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ background: "var(--accent)", width: `${Math.min(100, (t.count / count) * 100)}%`, opacity: 0.3 + i * 0.15 }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--muted-foreground)" }}>{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => { setData(null); setError(""); }}
          className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}>
          🔄 重新分析（可更换背景知识）
        </button>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>AI 分析基于 {count} 条真实回复生成 · 仅供参考</p>
      </div>
    </div>
  );
}
