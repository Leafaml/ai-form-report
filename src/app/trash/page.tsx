"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listTrash, restoreForm, permanentDelete, getToken } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/components/States";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import type { FormData } from "@/lib/api-client";

export default function TrashPage() {
  const router = useRouter();
  const [items, setItems] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    if (!getToken()) { router.replace("/auth/login"); return; }
    try { setItems(await listTrash()); }
    catch (err) { setError(err instanceof Error ? err.message : "加载失败"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  async function handleRestore(id: string) {
    try {
      await restoreForm(id);
      setItems(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "恢复失败");
    }
  }

  async function handlePermanentDelete(id: string) {
    try {
      await permanentDelete(id);
      setItems(prev => prev.filter(f => f.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>回收站</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          已删除的表单保留 30 天，可随时恢复
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center text-sm"
              style={{ color: "var(--muted-foreground)" }}>
              <Trash2 className="size-10 mx-auto mb-3 opacity-20" />
              回收站为空
            </motion.div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {items.map((form, i) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5">
                  <div className="shrink-0 size-9 rounded-lg flex items-center justify-center"
                    style={{ background: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
                    <Trash2 className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{form.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {form.description || "无描述"} · 删除于 {new Date(form.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleRestore(form.id)}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-muted"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                      <RotateCcw className="size-3" /> 恢复
                    </button>
                    <button onClick={() => setDeleteTarget(form.id)}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
                      style={{ background: "var(--destructive)", color: "#fff" }}>
                      彻底删除
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 彻底删除确认 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 mx-4 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">确认彻底删除</h3>
                <p className="text-sm text-muted-foreground">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              彻底删除后，表单及所有关联数据将被永久移除，无法恢复。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
                style={{ color: "var(--foreground)" }}>取消</button>
              <button onClick={() => handlePermanentDelete(deleteTarget)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "var(--destructive)" }}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
