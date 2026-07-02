"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, getToken, setToken } from "@/lib/api-client";
import { useAuth } from "@/app/components/AuthProvider";
import { useErrorDismiss } from "@/hooks/useErrorDismiss";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useErrorDismiss();
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
    else setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await login(email, password);
      setToken(res.token);
      setAuth(res.token, { ...res.user, nickname: null, avatar: null, deepseekApiKey: null });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally { setLoading(false); }
  }

  const inputClass = "w-full px-4 py-2.5 text-sm rounded-lg border bg-background outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white mb-4 shadow-lg shadow-primary/25">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>欢迎回来</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>登录以管理你的表单</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-destructive/10 text-destructive border border-destructive/20">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>邮箱</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className={inputClass} style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>密码</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="输入密码" className={inputClass} style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 text-sm font-semibold rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/25"
            style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--muted-foreground)" }}>
          还没有账号？ <Link href="/auth/signup" className="font-medium hover:underline text-primary">注册</Link>
        </p>
      </div>
    </main>
  );
}
