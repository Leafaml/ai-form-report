"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Sparkles } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/auth/");

  return (
    <header
      className="sticky top-0 z-40 h-14 border-b backdrop-blur-md flex items-center shrink-0"
      style={{
        background: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-between w-full px-4 md:px-6">
        {/* 左侧：Logo */}
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

        {/* 右侧：用户区 */}
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={signOut}
              className="text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: "var(--muted-foreground)" }}>
              退出
            </button>
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
  );
}
