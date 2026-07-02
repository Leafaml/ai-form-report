// 全站统一的加载/错误/空态组件

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-h1)" }}>出了点问题</p>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>{message}</p>
        {onRetry && (
          <button onClick={onRetry}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            重试
          </button>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg animate-pulse" style={{ background: "var(--muted)", height: i === 0 ? 32 : 20, width: i === 0 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}
