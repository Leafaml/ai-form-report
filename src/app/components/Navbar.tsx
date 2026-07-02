"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Sparkles, LogOut, Menu, X, LayoutDashboard, Plus, MessageCircle, Trash2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "表单中心", icon: LayoutDashboard },
  { path: "/create", label: "创建表单", icon: Plus },
  { path: "/ai-assistant", label: "AI 助手", icon: MessageCircle },
  { path: "/trash", label: "回收站", icon: Trash2 },
  { path: "/settings", label: "设置", icon: Settings },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = pathname.startsWith("/auth/");

  return (
    <>
    <header
      className="sticky top-0 z-40 h-14 border-b backdrop-blur-md flex items-center shrink-0"
      style={{
        background: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-between w-full px-4 md:px-6">
        {/* 左侧：汉堡 + Logo */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-muted transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm shrink-0"
            style={{ color: "var(--foreground)" }}
          >
            <div
              className="size-7 rounded-lg flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}
            >
              <Sparkles className="size-3.5" />
            </div>
            <span className="hidden sm:inline">AI 智能表单</span>
          </Link>
        </div>

        {/* 右侧：用户区 */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="size-7 rounded-full shrink-0" />
              ) : (
                <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}>
                  {(user.nickname || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block min-w-0 max-w-[120px]">
                <div className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>
                  {user.nickname || user.email.split("@")[0]}
                </div>
                <div className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>
                  {user.email}
                </div>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                style={{ color: "var(--muted-foreground)" }}
                title="退出登录"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : !isAuthPage ? (
            <Link
              href="/auth/login"
              className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #2160f9, #4f46e5)",
                boxShadow: "0 2px 8px rgba(33,96,249,.25)",
              }}
            >
              登录
            </Link>
          ) : null}
        </div>
      </div>
    </header>

    {/* 手机端下拉菜单 */}
    {user && menuOpen && (
      <div
        className="md:hidden fixed inset-x-0 top-14 z-30 border-b shadow-lg"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <nav className="p-2 space-y-0.5">
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
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors"
                style={{
                  color: isActive ? "var(--primary)" : "var(--foreground)",
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
      </div>
    )}
    </>
  );
}
