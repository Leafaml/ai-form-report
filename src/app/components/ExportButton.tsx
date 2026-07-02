"use client";

import { useState } from "react";
import { exportCsv } from "@/lib/api-client";

interface ExportButtonProps {
  formId: string;
  disabled?: boolean;
}

export default function ExportButton({ formId, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportCsv(formId);
      // 服务端已加 UTF-8 BOM，直接下载
      const blob = new Blob([csv], { type: "text/csv; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${formId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg font-medium transition-all hover:scale-[1.01] disabled:opacity-50 disabled:scale-100"
      style={{
        background: "var(--bg-card)",
        color: "var(--text-body)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {exporting ? "导出中..." : "📥 导出 CSV"}
    </button>
  );
}
