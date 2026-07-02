"use client";

import { useState } from "react";
import { submitForm } from "@/lib/api-client";
import { useErrorDismiss } from "@/hooks/useErrorDismiss";
import { inputStyle, btnPrimary } from "@/app/components/ui";

interface Field {
  id: string;
  label: string;
  fieldType?: string;
  field_type?: string;
  options: string[] | null;
}

export default function FillForm({ formId, fields }: { formId: string; fields: Field[] }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useErrorDismiss();
  const [submitting, setSubmitting] = useState(false);

  function setAnswer(fieldId: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  }
  function toggleCheckbox(fieldId: string, option: string) {
    setAnswers(prev => {
      const current = (prev[fieldId] as string[]) || [];
      return { ...prev, [fieldId]: current.includes(option) ? current.filter(o => o !== option) : [...current, option] };
    });
  }

  async function handleSubmit() {
    setError(""); setSubmitting(true);
    try {
      await submitForm(formId, answers);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-h1)" }}>提交成功</h2>
        <p style={{ color: "var(--foreground)" }}>感谢你的填写！</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{error}</div>}

      <div className="space-y-6">
        {fields.map((field, i) => {
          const fieldType = field.fieldType || field.field_type || "text";
          return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
              {i + 1}. {field.label}
            </label>

            {fieldType === "text" && (
              <input type="text" value={(answers[field.id] as string) || ""} onChange={e => setAnswer(field.id, e.target.value)}
                placeholder="输入你的回答" className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2"
                style={inputStyle} />
            )}
            {fieldType === "textarea" && (
              <textarea value={(answers[field.id] as string) || ""} onChange={e => setAnswer(field.id, e.target.value)}
                placeholder="输入你的回答" rows={4} className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2 resize-none"
                style={inputStyle} />
            )}
            {fieldType === "radio" && (field.options || []).map((opt, oi) => (
              <label key={oi} className="flex items-center gap-3 py-1.5 cursor-pointer">
                <input type="radio" name={field.id} value={opt}
                  checked={(answers[field.id] as string) === opt}
                  onChange={e => setAnswer(field.id, e.target.value)} className="w-4 h-4" style={{ accentColor: "var(--accent)" }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{opt}</span>
              </label>
            ))}
            {fieldType === "checkbox" && (field.options || []).map((opt, oi) => (
              <label key={oi} className="flex items-center gap-3 py-1.5 cursor-pointer">
                <input type="checkbox" value={opt}
                  checked={((answers[field.id] as string[]) || []).includes(opt)}
                  onChange={() => toggleCheckbox(field.id, opt)} className="w-4 h-4 rounded" style={{ accentColor: "var(--primary)" }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{opt}</span>
              </label>
            ))}
          </div>
        )})}
      </div>

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full mt-8 py-3.5 font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
        style={btnPrimary}>{submitting ? "提交中..." : "提交"}</button>
    </div>
  );
}
