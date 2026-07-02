"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, verifyEmail, resendCode } from "@/lib/api-client";
import { useAuth } from "@/app/components/AuthProvider";
import { useErrorDismiss } from "@/hooks/useErrorDismiss";
import { Sparkles, Mail, ArrowLeft } from "lucide-react";

type Step = "form" | "verify";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useErrorDismiss();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState("");

  const inputClass = "w-full px-4 py-2.5 text-sm rounded-lg border bg-background outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15";

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await register(email, password); setStep("verify"); }
    catch (err) { setError(err instanceof Error ? err.message : "注册失败"); }
    finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { setError("请输入 6 位验证码"); return; }
    setError(""); setLoading(true);
    try {
      const res = await verifyEmail(email, code);
      setAuth(res.token, { ...res.user, nickname: null, avatar: null, deepseekApiKey: null });
      router.push("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "验证失败"); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    setResending(true); setResentMsg(""); setError("");
    try { const r = await resendCode(email); setResentMsg(r.message); }
    catch (err) { setError(err instanceof Error ? err.message : "重发失败"); }
    finally { setResending(false); }
  }

  if (step === "verify") {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white mb-4 shadow-lg shadow-primary/25">
              <Mail className="size-6" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>验证邮箱</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              验证码已发送至 <strong style={{ color: "var(--foreground)" }}>{email}</strong>
            </p>
          </div>

          {error && <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-destructive/10 text-destructive border border-destructive/20">{error}</div>}
          {resentMsg && <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-emerald-50 text-emerald-600 border border-emerald-200">{resentMsg}</div>}

          <form onSubmit={handleVerify} className="space-y-4">
            <input type="text" maxLength={6} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="输入 6 位验证码"
              className={`${inputClass} text-center tracking-[0.5em] text-lg`}
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
            <button type="submit" disabled={loading || code.length !== 6}
              className="w-full py-3 text-sm font-semibold rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/25"
              style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}>
              {loading ? "验证中..." : "确认验证"}
            </button>
          </form>

          <div className="text-center mt-4 space-y-2">
            <button onClick={handleResend} disabled={resending}
              className="text-sm font-medium hover:underline disabled:opacity-50 text-primary">
              {resending ? "重发中..." : "重新发送验证码"}
            </button>
            <br />
            <button onClick={() => setStep("form")}
              className="text-sm inline-flex items-center gap-1 hover:underline"
              style={{ color: "var(--muted-foreground)" }}>
              <ArrowLeft className="size-3" /> 更换邮箱
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white mb-4 shadow-lg shadow-primary/25">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>创建账号</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>注册后需验证邮箱</p>
        </div>

        {error && <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-destructive/10 text-destructive border border-destructive/20">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>邮箱</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className={inputClass} style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>密码</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 位" className={inputClass} style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 text-sm font-semibold rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/25"
            style={{ background: "linear-gradient(135deg, #2160f9, #4f46e5)" }}>
            {loading ? "发送验证码..." : "注册"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--muted-foreground)" }}>
          已有账号？ <Link href="/auth/login" className="font-medium hover:underline text-primary">登录</Link>
        </p>
      </div>
    </main>
  );
}
