"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Plus, Sparkles, MessageCircle, Trash2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "表单中心", icon: LayoutDashboard },
  { path: "/create", label: "创建表单", icon: Plus },
  { path: "/ai-assistant", label: "AI 助手", icon: MessageCircle },
  { path: "/trash", label: "回收站", icon: Trash2 },
  { path: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 border-r h-full"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 shrink-0">
        <div
          className="size-7 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}
        >
          <Sparkles className="size-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
            AI Form
          </div>
          <div className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>
            智能表单系统
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                background: isActive
                  ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                  : "transparent",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
