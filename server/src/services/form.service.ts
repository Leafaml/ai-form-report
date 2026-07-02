import prisma from "../lib/prisma";
import { AppError } from "../middleware/error-handler";

interface CreateFieldInput {
  label: string;
  fieldType: "text" | "textarea" | "radio" | "checkbox";
  options?: string[] | null;
  sortOrder?: number;
}

interface CreateFormInput {
  title: string;
  description?: string;
  fields: CreateFieldInput[];
}

/** 我的表单列表（排除已删除） */
export async function listForms(userId: string) {
  return prisma.form.findMany({
    where: { userId, deletedAt: null },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

/** 创建表单（含字段） */
export async function createForm(userId: string, input: CreateFormInput) {
  if (!input.title?.trim()) {
    throw new AppError(400, "表单标题不能为空");
  }
  const validFields = input.fields?.filter(f => f.label?.trim()) || [];
  if (validFields.length === 0) {
    throw new AppError(400, "至少需要一个字段（每个字段的问题文字不能为空）");
  }

  return prisma.form.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      userId,
      fields: {
        create: validFields.map((f, i) => ({
          label: f.label,
          fieldType: f.fieldType,
          options: f.options ? JSON.parse(JSON.stringify(f.options)) : undefined,
          sortOrder: f.sortOrder ?? i,
        })),
      },
    },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
}

/** 表单详情（公开，排除已删除） */
export async function getFormById(formId: string) {
  const form = await prisma.form.findFirst({
    where: { id: formId, deletedAt: null },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!form) {
    throw new AppError(404, "表单不存在");
  }
  return form;
}

/** 软删除（仅所有者） */
export async function deleteForm(formId: string, userId: string) {
  const form = await prisma.form.findFirst({ where: { id: formId, deletedAt: null } });
  if (!form) throw new AppError(404, "表单不存在");
  if (form.userId !== userId) throw new AppError(403, "无权删除此表单");

  await prisma.form.update({
    where: { id: formId },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}

/** 回收站列表 */
export async function listTrash(userId: string) {
  return prisma.form.findMany({
    where: { userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
}

/** 恢复表单 */
export async function restoreForm(formId: string, userId: string) {
  const form = await prisma.form.findFirst({ where: { id: formId, deletedAt: { not: null } } });
  if (!form) throw new AppError(404, "表单不在回收站中");
  if (form.userId !== userId) throw new AppError(403, "无权操作此表单");

  await prisma.form.update({
    where: { id: formId },
    data: { deletedAt: null },
  });
  return { success: true };
}

/** 彻底删除 */
export async function permanentDelete(formId: string, userId: string) {
  const form = await prisma.form.findFirst({ where: { id: formId, deletedAt: { not: null } } });
  if (!form) throw new AppError(404, "表单不在回收站中");
  if (form.userId !== userId) throw new AppError(403, "无权操作此表单");

  await prisma.form.delete({ where: { id: formId } });
  return { success: true };
}
