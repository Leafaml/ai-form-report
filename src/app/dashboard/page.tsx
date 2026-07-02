"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { listForms, getToken, deleteForm } from "@/lib/api-client";
import { useErrorDismiss } from "@/hooks/useErrorDismiss";
import { Spinner, ErrorState } from "@/app/components/States";
import {
  FileText, Plus, Sparkles, TrendingUp, Wand2, Trash2, ArrowUpRight, Loader2,
} from "lucide-react";
import type { FormData } from "@/lib/api-client";

// ── 数字递增 ──
function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string;
}) {
  const display = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-2.5 rounded-lg inline-flex" style={{ background: bg, color }}>
        <Icon className="size-5" />
      </div>
      <div className="mt-4">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className="text-2xl font-bold tracking-tight mt-0.5 text-foreground tabular-nums">
          {display.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useErrorDismiss();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    if (!getToken()) { router.replace("/auth/login"); return; }
    setError("");
    try { setForms(await listForms()); }
    catch (err) { setError(err instanceof Error ? err.message : "请求失败"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  async function handleDelete(formId: string) {
    setDeletingId(formId);
    try {
      await deleteForm(formId);
      setForms(forms.filter(f => f.id !== formId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (error) return <div className="py-20"><ErrorState message={error} onRetry={() => { setLoading(true); fetchForms(); }} /></div>;

  const latestFormId = forms[0]?.id;
  const monthCount = forms.filter(f => {
    const d = new Date(f.createdAt), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const todayCount = forms.filter(f => {
    const d = new Date(f.createdAt);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* ═══ Banner ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-blue-500 text-white shadow-lg"
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-8 md:p-10">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium">
              <Sparkles className="size-3.5" /> AI 智能助手已就绪
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              创建你的智能表单
              <br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                让数据收集更高效
              </span>
            </h1>
            <p className="text-sm text-white/80 max-w-lg leading-relaxed">
              创建表单、分享链接、收集数据、AI 自动分析——全流程打通。
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/create"
                className="inline-flex items-center gap-2 bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-white/90 shadow-lg transition-all">
                <Plus className="size-4" /> 创建表单
              </Link>
              {latestFormId && (
                <Link href={`/form/${latestFormId}/results`}
                  className="inline-flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 font-medium text-sm px-5 py-2.5 rounded-lg transition-all">
                  查看数据 <ArrowUpRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
          <div className="shrink-0 hidden md:block">
            <div className="size-36 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
              <FileText className="size-16 text-white/50" />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ 真实统计 ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="表单总数" value={forms.length} icon={FileText} color="#2160f9" bg="#eef3ff" />
        <StatCard label="本月新建" value={monthCount} icon={TrendingUp} color="#16a34a" bg="#f0fdf4" />
        <StatCard label="今日新建" value={todayCount} icon={Plus} color="#f59e0b" bg="#fff7ed" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-lg inline-flex" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
            <Wand2 className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium mt-4">AI 分析</div>
            <Link href={latestFormId ? `/form/${latestFormId}/report` : "/create"}
              className="inline-flex items-center gap-1 text-sm font-semibold mt-1 hover:underline"
              style={{ color: "var(--primary)" }}>
              {latestFormId ? "查看报告" : "创建表单"} <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ═══ 表单列表 ═══ */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">
            {forms.length > 0 ? `共 ${forms.length} 个表单` : "我的表单"}
          </h2>
          <Link href="/create"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity">
            <Plus className="size-4" /> 新建表单
          </Link>
        </div>

        {forms.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 flex justify-center">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="size-7 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-foreground mb-1">还没有表单</p>
            <p className="text-sm text-muted-foreground mb-4">创建第一个表单，开始收集数据</p>
            <Link href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}>
              <Plus className="size-4" /> 创建表单
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {forms.map((form, i) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group flex items-center gap-3 px-5 py-3.5"
              >
                <div className="shrink-0 size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-foreground truncate block">{form.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {form.description || "无描述"} · {new Date(form.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/form/${form.id}`}
                    className="text-xs px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
                    style={{ color: "var(--muted-foreground)" }}>填写</Link>
                  <Link href={`/form/${form.id}/results`}
                    className="text-xs px-2.5 py-1.5 rounded-md font-medium hover:bg-primary/10 transition-colors"
                    style={{ color: "var(--primary)" }}>结果</Link>
                  <Link href={`/form/${form.id}/report`}
                    className="text-xs px-2.5 py-1.5 rounded-md font-medium hover:bg-primary/10 transition-colors"
                    style={{ color: "var(--primary)" }}>分析</Link>
                  <button
                    onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(form.id); }}
                    className="text-xs px-2 py-1.5 rounded-md font-medium hover:bg-destructive/10 transition-colors"
                    style={{ color: "var(--destructive)" }}>
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 删除确认弹窗 ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(null)}>
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
              删除后，该表单的所有数据（包括提交记录和 AI 分析结果）将被永久删除。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground">
                取消
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deletingId === showDeleteConfirm}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ background: "var(--destructive)", color: "#fff" }}>
                {deletingId === showDeleteConfirm ? (
                  <><Loader2 className="size-4 animate-spin" /> 删除中...</>
                ) : (
                  <><Trash2 className="size-4" /> 确认删除</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
