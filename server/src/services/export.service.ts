import prisma from "../lib/prisma";
import { AppError } from "../middleware/error-handler";

function csvEscape(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface ExportResult {
  csv: string;
  filename: string;
}

export async function exportCsv(formId: string, userId: string): Promise<ExportResult> {
  // 所有权校验
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!form) throw new AppError(404, "表单不存在");
  if (form.userId !== userId) throw new AppError(403, "无权导出此表单的数据");

  // 获取提交数据
  const submissions = await prisma.submission.findMany({
    where: { formId },
    orderBy: { createdAt: "asc" },
  });
  if (submissions.length === 0) {
    throw new AppError(400, "没有可导出的数据");
  }

  // 构建 CSV
  const headers = ["序号", ...form.fields.map((f) => f.label), "提交时间"];
  const rows: string[][] = [headers];

  submissions.forEach((sub, i) => {
    const d = sub.data as Record<string, string | string[]>;
    const row: string[] = [
      String(i + 1),
      ...form.fields.map((f) => {
        const val = d[f.id];
        return Array.isArray(val) ? val.join("、") : String(val ?? "");
      }),
      new Date(sub.createdAt).toLocaleString("zh-CN"),
    ];
    rows.push(row);
  });

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const filename = `${form.title}_导出数据.csv`;

  return { csv, filename };
}
