"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, createForm } from "@/lib/api-client";
import { useErrorDismiss } from "@/hooks/useErrorDismiss";
import { Spinner } from "@/app/components/States";

type FieldType = "text" | "textarea" | "radio" | "checkbox";
interface Field { label: string; field_type: FieldType; options: string[]; }

const TYPE_LABELS: Record<FieldType, string> = { text: "短文本", textarea: "多行文本", radio: "单选", checkbox: "多选" };

const baseInput = "w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2";

export default function CreateFormPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([{ label: "", field_type: "text", options: [] }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useErrorDismiss();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/auth/login");
    else setAuthChecked(true);
  }, [router]);

  if (!authChecked) return <Spinner />;

  function addField() { setFields([...fields, { label: "", field_type: "text", options: [] }]); }
  function removeField(i: number) { setFields(fields.filter((_, j) => j !== i)); }
  function updateField(i: number, u: Partial<Field>) { const n = [...fields]; n[i] = { ...n[i], ...u }; setFields(n); }
  function addOption(i: number) { const n = [...fields]; n[i] = { ...n[i], options: [...(n[i].options || []), ""] }; setFields(n); }
  function updateOption(i: number, oi: number, v: string) { const n = [...fields]; const o = [...(n[i].options || [])]; o[oi] = v; n[i] = { ...n[i], options: o }; setFields(n); }

  async function handleSave() {
    if (!title.trim()) { setError("请填写表单标题"); return; }
    setError(""); setSaving(true);

    try {
      const form = await createForm({
        title: title.trim(),
        description: description.trim() || undefined,
        fields: fields.map((f, i) => ({
          label: f.label.trim(),
          fieldType: f.field_type,
          options: f.field_type === "radio" || f.field_type === "checkbox" ? f.options.filter(o => o.trim()) : null,
          sortOrder: i,
        })),
      });

      router.push(`/form/${form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-h1)" }}>创建表单</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>设计你的问题，分享链接，收集回复。</p>

      {error && <div className="px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{error}</div>}

      {/* 标题卡片 */}
      <div className="rounded-xl border p-5 mb-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>表单标题 <span style={{color:"var(--destructive)"}}>*</span></label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：用户满意度调查"
          className={baseInput} style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        <label className="block text-sm font-medium mt-4 mb-2" style={{ color: "var(--foreground)" }}>
          描述 <span className="font-normal" style={{color:"var(--muted-foreground)"}}>（可选）</span>
        </label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="简单说明这个表单的用途" rows={2}
          className={`${baseInput} resize-none`} style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }} />
      </div>

      {/* 问题列表 */}
      <div className="space-y-4 mb-5">
        {fields.map((field, i) => (
          <div key={i} className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--foreground)" }}>问题 {i + 1} <span style={{color:"var(--destructive)"}}>*</span></span>
              {fields.length > 1 && <button onClick={() => removeField(i)} className="text-xs hover:opacity-70" style={{color:"var(--red)"}}>删除</button>}
            </div>
            <input type="text" value={field.label} onChange={e => updateField(i, { label: e.target.value })} placeholder="请输入问题，例如：您的性别？" className={`${baseInput} mb-3`}
              style={{ background: "var(--bg-input)", borderColor: error && !field.label.trim() ? "var(--destructive)" : "var(--border)", color: "var(--foreground)" }} />

            <div className="flex gap-2 flex-wrap">
              {(Object.entries(TYPE_LABELS) as [FieldType, string][]).map(([type, label]) => (
                <button key={type} onClick={() => updateField(i, { field_type: type })}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={field.field_type === type
                    ? { background: "var(--secondary)", color: "var(--primary)", border: "1px solid var(--primary)" }
                    : { background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >{label}</button>
              ))}
            </div>

            {(field.field_type === "radio" || field.field_type === "checkbox") && (
              <div className="mt-3 space-y-2 pl-2" style={{ borderLeft: "2px solid var(--accent-soft)" }}>
                {(field.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-xs w-12" style={{color:"var(--muted-foreground)"}}>{field.field_type === "radio" ? "○" : "☐"}</span>
                    <input type="text" value={opt} onChange={e => updateOption(i, oi, e.target.value)} placeholder={`选项 ${oi + 1}`}
                      className={`${baseInput} flex-1 text-sm py-2`} style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                ))}
                <button onClick={() => addOption(i)} className="text-sm font-medium ml-14 hover:opacity-70" style={{color:"var(--accent)"}}>+ 添加选项</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addField}
        className="w-full border-2 border-dashed rounded-xl py-4 text-sm font-medium mb-5 transition-all hover:opacity-80"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
        + 添加问题
      </button>

      <button onClick={handleSave} disabled={saving}
        className="w-full text-white rounded-xl py-3.5 font-medium text-sm transition-all hover:scale-[1.01] disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow)" }}>
        {saving ? "保存中..." : "保存并查看表单"}
      </button>
    </main>
  );
}
