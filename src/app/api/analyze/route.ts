import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeSubmissions, analyzeSubmissionsWithContext } from "@/lib/ai";
import { chunkText, retrieveChunks } from "@/lib/rag";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { formId, contextText } = await req.json();

    if (!formId) {
      return NextResponse.json({ error: "缺少 formId" }, { status: 400 });
    }

    // ── 鉴权：验证 token 并获取当前用户 ──
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
      return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
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
      return NextResponse.json({ error: "无权访问该表单" }, { status: 403 });
    }

    // ── 获取数据并分析 ──
    const { data: fields } = await supabase
      .from("form_fields")
      .select("label, field_type")
      .eq("form_id", formId)
      .order("sort_order", { ascending: true });

    const { data: submissions } = await supabase
      .from("submissions")
      .select("data, created_at")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: "还没有提交记录" }, { status: 400 });
    }

    // ── 分析：有背景文本走 RAG，无则基础分析 ──
    let analysis;
    if (contextText && contextText.trim().length > 0) {
      // RAG 管线：分块 → 检索 → 增强分析
      const allText = submissions
        .map((s) => Object.values(s.data).join(" "))
        .join(" ");
      const chunks = chunkText(contextText);
      const relevantChunks = retrieveChunks(allText, chunks);

      const context = relevantChunks.length > 0
        ? relevantChunks.join("\n\n---\n\n")
        : contextText.trim(); // 如果没检索到任何块，直接用全文

      analysis = await analyzeSubmissionsWithContext(
        { formTitle: form.title, fields: fields || [], submissions },
        context
      );
    } else {
      analysis = await analyzeSubmissions({
        formTitle: form.title,
        fields: fields || [],
        submissions,
      });
    }

    return NextResponse.json({
      formTitle: form.title,
      analysis,
      count: submissions.length,
      hasContext: !!contextText?.trim(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
