/**
 * API 客户端 —— 统一对接 Express 后端
 *
 * 替代 V1.1 的 Supabase 直连，所有数据操作通过自建 API。
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Token 管理 ──

const TOKEN_KEY = "ai-form-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── 基础请求 ──

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 401：仅当携带了 token 才视为"过期"跳转，否则是正常的认证失败
  if (res.status === 401) {
    if (token) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      throw new Error("登录已过期，请重新登录");
    }
    const body = await res.json().catch(() => ({ error: "邮箱或密码错误" }));
    throw new Error(body.error || "邮箱或密码错误");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(body.error || `请求失败: ${res.status}`);
  }

  // CSV 导出返回文本
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}

// ── Auth ──

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; createdAt: string; nickname: null; avatar: null };
}

export function register(email: string, password: string) {
  return request<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function verifyEmail(email: string, code: string) {
  return request<AuthResponse>("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resendCode(email: string) {
  return request<{ message: string }>("/api/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function changePassword(oldPassword: string, newPassword: string) {
  return request<{ message: string }>("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  deepseekApiKey: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export function getProfile() {
  return request<UserProfile>("/api/auth/me");
}

export function updateProfile(data: { nickname?: string; avatar?: string; deepseekApiKey?: string }) {
  return request<UserProfile>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadAvatar(file: File): Promise<{ avatar: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_BASE}/api/upload/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "上传失败" }));
    throw new Error(body.error || `上传失败: ${res.status}`);
  }

  return res.json();
}

// ── Forms ──

export interface FormField {
  id: string;
  formId: string;
  label: string;
  fieldType: "text" | "textarea" | "radio" | "checkbox";
  options: string[] | null;
  sortOrder: number;
}

export interface FormData {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  createdAt: string;
  fields?: FormField[];
}

export interface CreateFormInput {
  title: string;
  description?: string;
  fields: {
    label: string;
    fieldType: string;
    options?: string[] | null;
    sortOrder?: number;
  }[];
}

export function listForms() {
  return request<FormData[]>("/api/forms");
}

export function createForm(input: CreateFormInput) {
  return request<FormData>("/api/forms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getForm(id: string) {
  return request<FormData>(`/api/forms/${id}`);
}

export function deleteForm(id: string) {
  return request<{ success: boolean }>(`/api/forms/${id}`, {
    method: "DELETE",
  });
}

// ── 回收站 ──

export function listTrash() {
  return request<FormData[]>("/api/forms/trash/list");
}

export function restoreForm(id: string) {
  return request<{ success: boolean }>(`/api/forms/${id}/restore`, {
    method: "POST",
  });
}

export function permanentDelete(id: string) {
  return request<{ success: boolean }>(`/api/forms/${id}/permanent`, {
    method: "DELETE",
  });
}

// ── Submissions ──

export interface SubmissionData {
  id: string;
  formId: string;
  data: Record<string, string | string[]>;
  createdAt: string;
}

export function submitForm(formId: string, data: Record<string, string | string[]>) {
  return request<SubmissionData>("/api/submissions", {
    method: "POST",
    body: JSON.stringify({ formId, data }),
  });
}

// ── Results ──

export interface FieldStat {
  fieldId: string;
  label: string;
  fieldType: string;
  answerCount: number;
  choiceCounts: Record<string, number>;
}

export interface FormResults {
  form: { id: string; title: string; fields: FormField[] };
  totalSubmissions: number;
  submissions: SubmissionData[];
  fieldStats: FieldStat[];
}

export function getResults(formId: string) {
  return request<FormResults>(`/api/forms/${formId}/results`);
}

// ── AI Analysis ──

export interface AnalyzeResult {
  formTitle: string;
  count: number;
  analysis: {
    summary: string;
    keywords: string[];
    sentiment: "正面" | "中性" | "负面";
    sentimentReason: string;
    themes: { theme: string; count: number; detail: string; source?: string }[];
    suggestion: string;
    raw?: string;
  };
  cached: boolean;
  hasContext: boolean;
}

export function analyzeForm(formId: string, context?: string) {
  return request<AnalyzeResult>(`/api/forms/${formId}/analyze`, {
    method: "POST",
    body: JSON.stringify({ context }),
  });
}

// ── Export ──

export function exportCsv(formId: string) {
  return request<string>(`/api/forms/${formId}/export`);
}
