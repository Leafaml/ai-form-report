import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-28">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 text-white text-xl font-bold"
          style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)", boxShadow: "0 8px 30px rgba(33,96,249,.35)" }}>
          AI
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-h1)" }}>AI 智能表单</h1>
        <p className="text-lg mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          创建表单，收集数据，AI 自动生成分析报告。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)", boxShadow: "0 2px 12px rgba(33,96,249,.3)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            创建表单
          </Link>
          <Link href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-sm rounded-lg border transition-all hover:scale-[1.02]"
            style={{ background: "var(--bg-card)", color: "var(--text-body)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
            我的表单
          </Link>
        </div>

        {/* 底部标签 */}
        <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
          <span>✨</span>
          <span>AI 驱动 · 数据分析 · 报告生成</span>
        </div>
      </div>
    </main>
  );
}
