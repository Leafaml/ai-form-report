// 设计系统按钮/输入样式

export const btnPrimary = {
  background: "linear-gradient(135deg, var(--primary), #4f46e5)",
  color: "#ffffff",
  border: "none",
  boxShadow: "0 2px 12px rgba(33,96,249,.25), 0 1px 2px rgba(0,0,0,.06)",
  borderRadius: "var(--radius)",
  fontWeight: 600,
  transition: "all 0.2s ease",
} as const;

export const btnSecondary = {
  background: "var(--bg-card)",
  color: "var(--text-body)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-sm)",
  borderRadius: "var(--radius)",
  fontWeight: 600,
  transition: "all 0.2s ease",
} as const;

export const btnGhost = {
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid transparent",
  boxShadow: "none",
  borderRadius: "var(--radius-sm)",
  fontWeight: 500,
  transition: "all 0.2s ease",
} as const;

export const btnDanger = {
  background: "var(--destructive)",
  color: "#ffffff",
  border: "none",
  boxShadow: "0 2px 8px rgba(220,38,38,.25), inset 0 1px 0 rgba(255,255,255,.1)",
  borderRadius: "var(--radius)",
  fontWeight: 600,
  transition: "all 0.2s ease",
} as const;

export const btnOutline = {
  background: "transparent",
  color: "var(--primary)",
  border: "1px solid var(--primary)",
  boxShadow: "none",
  borderRadius: "var(--radius-sm)",
  fontWeight: 600,
  transition: "all 0.2s ease",
} as const;

// 输入框统一样式
export const inputStyle = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,.04)",
  transition: "border-color 0.2s, box-shadow 0.2s",
} as const;
