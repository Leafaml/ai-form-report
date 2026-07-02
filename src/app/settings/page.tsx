"use client";

import { useState } from "react";
import { changePassword, updateProfile, uploadAvatar } from "@/lib/api-client";
import { useAuth } from "@/app/components/AuthProvider";
import { KeyRound, CheckCircle2, User, Camera, Upload, Loader2, Key } from "lucide-react";

// DiceBear 头像风格选项
const AVATAR_STYLES = [
  { key: "initials", label: "文字", bg: "#2160f9" },
  { key: "bottts", label: "机器人", bg: "#4f46e5" },
  { key: "rings", label: "圆环", bg: "#7c3aed" },
  { key: "shapes", label: "图形", bg: "#db2777" },
  { key: "thumbs", label: "卡通", bg: "#ea580c" },
];

function diceBearUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [avatarStyle, setAvatarStyle] = useState("initials");
  const [nicknameMsg, setNicknameMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [apiKey, setApiKey] = useState(user?.deepseekApiKey || "");
  const [apiKeyMsg, setApiKeyMsg] = useState("");

  // 密码
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const inputClass = "w-full px-4 py-2.5 text-sm rounded-lg border outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15";
  const avatarSeed = nickname.trim() || user?.email || "user";

  async function saveNickname() {
    if (!nickname.trim()) { setNicknameMsg("昵称不能为空"); return; }
    try {
      await updateProfile({ nickname: nickname.trim() });
      await refreshUser();
      setNicknameMsg("✅ 昵称已更新");
    } catch (err) {
      setNicknameMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  async function saveAvatar(style: string) {
    setAvatarStyle(style);
    const url = diceBearUrl(style, avatarSeed);
    try {
      await updateProfile({ avatar: url });
      await refreshUser();
      setAvatarMsg("✅ 头像已更新");
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setAvatarMsg("");
    try {
      const result = await uploadAvatar(file);
      await updateProfile({ avatar: `http://localhost:3001${result.avatar}` });
      await refreshUser();
      setAvatarMsg("✅ 头像已上传");
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "上传失败");
    } finally { setUploading(false); }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwLoading(true); setPwDone(false);
    try {
      await changePassword(oldPassword, newPassword);
      setPwDone(true); setOldPassword(""); setNewPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "修改失败");
    } finally { setPwLoading(false); }
  }

  const previewAvatar = user?.avatar || diceBearUrl(avatarStyle, avatarSeed);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>设置</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>管理你的个人资料和密码</p>
      </div>

      {/* 头像 */}
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Camera className="size-4" /> 头像
        </h2>
        <div className="flex items-center gap-5">
          <img src={previewAvatar} alt="头像预览" className="size-16 rounded-2xl ring-2 ring-border shadow-sm" />
          <div className="flex-1">
            <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>选择头像风格</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_STYLES.map(s => (
                <button key={s.key} onClick={() => saveAvatar(s.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: avatarStyle === s.key ? s.bg : "var(--card)",
                    color: avatarStyle === s.key ? "#fff" : "var(--foreground)",
                    borderColor: avatarStyle === s.key ? s.bg : "var(--border)",
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:opacity-80 border"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {uploading ? "上传中..." : "本地上传"}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>JPG/PNG/GIF · 最大 2MB</span>
            </div>
            {avatarMsg && <p className="text-xs mt-2 text-emerald-600">{avatarMsg}</p>}
          </div>
        </div>
      </div>

      {/* 昵称 */}
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <User className="size-4" /> 昵称
        </h2>
        <div className="flex gap-2">
          <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
            placeholder={user?.email?.split("@")[0] || "设置昵称"} maxLength={20}
            className={inputClass}
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--muted)" }} />
          <button onClick={saveNickname}
            className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
            保存
          </button>
        </div>
        {nicknameMsg && <p className="text-xs mt-2" style={{ color: nicknameMsg.startsWith("✅") ? "#16a34a" : "var(--muted-foreground)" }}>{nicknameMsg}</p>}
      </div>

      {/* 邮箱 */}
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>邮箱</h2>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
            {user?.email?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user?.email || "—"}</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已通过邮箱验证</div>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Key className="size-4" /> DeepSeek API Key
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
          配置后即可使用 AI 分析和 AI 助手功能。Key 仅保存在你的账户中。
          <a href="https://platform.deepseek.com/api_keys" target="_blank" className="text-primary hover:underline ml-1">获取 Key →</a>
        </p>
        <div className="flex gap-2">
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder={user?.deepseekApiKey || "sk-..."} className={inputClass}
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--muted)" }} />
          <button onClick={async () => {
            setApiKeyMsg("");
            try {
              await updateProfile({ deepseekApiKey: apiKey.trim() });
              await refreshUser();
              setApiKeyMsg("✅ Key 已保存");
            } catch (err) {
              setApiKeyMsg(err instanceof Error ? err.message : "保存失败");
            }
          }}
            className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
            保存
          </button>
        </div>
        {apiKeyMsg && <p className="text-xs mt-2" style={{ color: apiKeyMsg.startsWith("✅") ? "#16a34a" : "var(--muted-foreground)" }}>{apiKeyMsg}</p>}
      </div>

      {/* 修改密码 */}
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <KeyRound className="size-4" /> 修改密码
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>输入原密码和新密码</p>

        {pwError && <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-destructive/10 text-destructive border border-destructive/20">{pwError}</div>}
        {pwDone && <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-2"><CheckCircle2 className="size-4" /> 密码修改成功</div>}

        <form onSubmit={handlePassword} className="space-y-3">
          <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)}
            placeholder="原密码" className={inputClass}
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--muted)" }} />
          <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="新密码（至少 6 位）" className={inputClass}
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--muted)" }} />
          <button type="submit" disabled={pwLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
            <KeyRound className="size-4" />
            {pwLoading ? "修改中..." : "修改密码"}
          </button>
        </form>
      </div>
    </div>
  );
}
