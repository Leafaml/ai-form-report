import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

interface FormOwnership {
  id: string;
  title: string;
  user_id: string;
}

/**
 * 校验当前用户是否拥有该表单的所有权。
 * - 未登录 → 跳转登录页
 * - 表单不存在 → 返回 null（页面自行处理 404）
 * - 无权限 → 返回 null（页面自行处理 403）
 *
 * 返回 form 对象表示鉴权通过。
 */
export async function requireFormOwnership(
  formId: string
): Promise<{ form: FormOwnership; userId: string } | null> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: form } = await supabase
    .from("forms")
    .select("id, title, user_id")
    .eq("id", formId)
    .single();

  if (!form) return null; // 表单不存在 — 调用方处理 404

  if (form.user_id !== user.id) return null; // 不是你的表单 — 调用方处理 403

  return { form, userId: user.id };
}
