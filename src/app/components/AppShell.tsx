"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // 不需要后台布局的页面
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/form/");

  // 公开页 / 未登录：简洁顶栏
  if (isPublicPage || !user) {
    return (
      <div className="flex flex-col min-h-full">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // 登录后的后台页：侧边栏 + 顶栏
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
