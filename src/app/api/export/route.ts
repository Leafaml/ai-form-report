import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 将值转为 CSV 安全格式（处理逗号、引号、换行）
 */
function csvEscape(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 将提交数据转为 CSV 字符串
 */
function buildCsv(
  fields: { id: string; label: string }[],
  submissions: { id: string; data: Record<string, unknown>; created_at: string }[]
): string {
  // 表头：序号 + 字段名 + 提交时间
  const headers = ["序号", ...fields.map((f) => f.label), "提交时间"];
  const rows: string[][] = [headers];

  submissions.forEach((sub, i) => {
    const row: string[] = [
      String(i + 1),
      ...fields.map((f) => {
        const val = sub.data[f.id];
        return Array.isArray(val) ? val.join("、") : String(val ?? "");
      }),
      new Date(sub.created_at).toLocaleString("zh-CN"),
    ];
    rows.push(row);
  });

  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const format = searchParams.get("format") || "csv";

    if (!formId) {
      return NextResponse.json({ error: "缺少 formId" }, { status: 400 });
    }

    // ── 鉴权 ──
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    // ── 所有权校验 ──
    const { data: form } = await supabase
      .from("forms")
      .select("title, user_id")
      .eq("id", formId)
      .single();

    if (!form) {
      return NextResponse.json({ error: "表单不存在" }, { status: 404 });
    }
    if (form.user_id !== user.id) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    // ── 获取数据 ──
    const { data: fields } = await supabase
      .from("form_fields")
      .select("id, label")
      .eq("form_id", formId)
      .order("sort_order");

    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, data, created_at")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: "没有可导出的数据" }, { status: 400 });
    }

    // ── 生成文件 ──
    if (format === "csv") {
      const csv = buildCsv(fields || [], submissions);
      // UTF-8 BOM 确保 Excel 正确识别中文
      const bom = "﻿";
      const content = bom + csv;

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(form.title)}_导出数据.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "不支持的格式，目前仅支持 csv" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
