import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeScript } from "./components/ThemeScript";
import { AppShell } from "./components/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 智能表单",
  description: "收集数据，AI 自动分析生成报告",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSansSC.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head><ThemeScript /></head>
      <body className="h-full" style={{ background: "var(--background)" }}>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <ThemeToggle />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
