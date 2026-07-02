"use client";

import { useState, useEffect, use } from "react";
import { getForm } from "@/lib/api-client";
import FillForm from "./FillForm";
import { Spinner } from "@/app/components/States";
import type { FormField } from "@/lib/api-client";

export default function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<{ title: string; description: string | null } | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getForm(id)
      .then((data) => {
        setForm(data);
        setFields(data.fields || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="flex-1 flex items-center justify-center"><Spinner /></main>;

  if (notFound || !form) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-h1)" }}>表单不存在</h1>
          <p style={{ color: "var(--foreground)" }}>该表单可能已被删除或链接无效。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-h1)" }}>{form.title}</h1>
        {form.description && <p className="mb-8" style={{ color: "var(--foreground)" }}>{form.description}</p>}
        <FillForm formId={id} fields={fields} />
      </div>
    </main>
  );
}
