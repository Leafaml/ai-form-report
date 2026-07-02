"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getResults, getToken, deleteForm } from "@/lib/api-client";
import ExportButton from "@/app/components/ExportButton";
import { Spinner } from "@/app/components/States";
import { Trash2, Loader2 } from "lucide-react";
import type { FormResults, FormField } from "@/lib/api-client";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<FormResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    getResults(id)
      .then(setData)
      .catch((err) => {
        if (err.message?.includes("无权") || err.message?.includes("403")) {
          setForbidden(true);
        } else {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteForm(id);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) return <main className="flex-1 flex items-center justify-center"><Spinner /></main>;

  if (!getToken() || forbidden) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>无权访问</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>这不是你的表单，或表单不存在。</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{error || "加载失败"}</p>
        </div>
      </main>
    );
  }

  const { form, totalSubmissions, submissions, fieldStats } = data;
  const fields = form.fields || [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{form.title}</h1>
            <span className="text-sm px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
              {totalSubmissions} 条回复
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>查看所有提交记录</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/form/${id}`}
            className="text-sm px-4 py-2 rounded-lg font-medium border transition-all hover:bg-muted"
            style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>去填写</Link>
          <ExportButton formId={id} disabled={totalSubmissions === 0} />
          <Link href={`/form/${id}/report`}
            className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)", boxShadow: "0 2px 8px rgba(33,96,249,.25)" }}>
            🤖 AI 分析
          </Link>
          <button onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg font-medium border transition-all hover:bg-destructive/10"
            style={{ color: "var(--destructive)", borderColor: "var(--destructive)" }}>
            <Trash2 className="size-4" /> 删除
          </button>
          <Link href="/dashboard"
            className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{ color: "var(--foreground)" }}>&larr; 返回</Link>
        </div>
      </div>

      {totalSubmissions === 0 ? (
        <div className="rounded-2xl border border-dashed py-20 text-center bg-card" style={{ borderColor: "var(--border)" }}>
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg mb-4" style={{ color: "var(--muted-foreground)" }}>还没有提交记录</p>
          <Link href={`/form/${id}`} className="font-medium hover:underline text-primary">分享表单链接收集回复</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-10">
            {fieldStats.filter(f => f.fieldType === "radio" || f.fieldType === "checkbox").map((field) => (
              <div key={field.fieldId} className="rounded-xl border p-5 bg-card" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-medium mb-3" style={{ color: "var(--foreground)" }}>{field.label}</h3>
                <div className="space-y-2.5">
                  {Object.entries(field.choiceCounts).map(([opt, cnt]) => (
                    <div key={opt} className="flex items-center gap-3">
                      <span className="text-sm w-36 truncate" style={{ color: "var(--foreground)" }}>{opt}</span>
                      <div className="flex-1 h-6 rounded-full overflow-hidden bg-muted">
                        <div className="h-full rounded-full transition-all bg-primary"
                          style={{ width: `${(cnt / totalSubmissions) * 100}%` }} />
                      </div>
                      <span className="text-sm w-20 text-right tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                        {cnt} <span className="text-xs opacity-60">({Math.round((cnt / totalSubmissions) * 100)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border overflow-hidden bg-card" style={{ borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="text-left p-3 font-medium w-10 text-muted-foreground">#</th>
                    {fields.map((f: FormField) => <th key={f.id} className="text-left p-3 font-medium text-muted-foreground">{f.label}</th>)}
                    <th className="text-left p-3 font-medium w-40 text-muted-foreground">提交时间</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <tr key={sub.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      {fields.map((f: FormField) => {
                        const val = sub.data[f.id];
                        const display = Array.isArray(val) ? val.join("、") : val || "-";
                        return <td key={f.id} className="p-3 max-w-xs truncate" style={{ color: "var(--foreground)" }}>{display}</td>;
                      })}
                      <td className="p-3 text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleString("zh-CN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ 删除确认弹窗 ═══ */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 mx-4 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">确认删除</h3>
                <p className="text-sm text-muted-foreground">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              删除「{form.title}」后，其所有提交记录和 AI 分析结果将被永久删除。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteOpen(false)} disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
                style={{ color: "var(--foreground)" }}>
                取消
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ background: "var(--destructive)", color: "#ffffff" }}>
                {deleting ? (
                  <><Loader2 className="size-4 animate-spin" /> 删除中...</>
                ) : (
                  <><Trash2 className="size-4" /> 确认删除</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
