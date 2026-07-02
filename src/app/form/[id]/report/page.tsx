"use client";

import { use } from "react";
import Link from "next/link";
import ReportClient from "./ReportClient";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-h1)" }}>AI 分析报告</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>由 AI 自动生成的深度分析</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/form/${id}/results`}
            className="text-sm px-4 py-2 rounded-lg border font-medium transition-all hover:opacity-80"
            style={{ background: "var(--bg-card)", color: "var(--text-body)", borderColor: "var(--border)" }}>
            原始数据
          </Link>
          <Link href="/dashboard"
            className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}>
            &larr; 返回
          </Link>
        </div>
      </div>

      <ReportClient formId={id} />
    </main>
  );
}
