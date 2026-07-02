import prisma from "../lib/prisma";
import { AppError } from "../middleware/error-handler";

interface SubmitInput {
  formId: string;
  data: Record<string, string | string[]>;
}

/** 公开提交答卷 */
export async function submit(input: SubmitInput) {
  if (!input.formId) {
    throw new AppError(400, "缺少表单 ID");
  }
  if (!input.data || Object.keys(input.data).length === 0) {
    throw new AppError(400, "提交内容不能为空");
  }

  // 确认表单存在
  const form = await prisma.form.findUnique({ where: { id: input.formId } });
  if (!form) {
    throw new AppError(404, "表单不存在");
  }

  return prisma.submission.create({
    data: {
      formId: input.formId,
      data: input.data,
    },
  });
}

/** 获取表单结果（仅所有者） */
export async function getResults(formId: string, userId: string) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!form) {
    throw new AppError(404, "表单不存在");
  }
  if (form.userId !== userId) {
    throw new AppError(403, "无权查看此表单的结果");
  }

  const submissions = await prisma.submission.findMany({
    where: { formId },
    orderBy: { createdAt: "desc" },
  });

  // 字段级统计
  const fieldStats = form.fields.map((field) => {
    const answers = submissions.map((s) => {
      const d = s.data as Record<string, string | string[]>;
      return d[field.label] ?? null;
    });

    // 选择题统计
    const choiceCounts: Record<string, number> = {};
    if (field.fieldType === "radio" || field.fieldType === "checkbox") {
      for (const a of answers) {
        if (!a) continue;
        if (Array.isArray(a)) {
          for (const item of a) {
            choiceCounts[item] = (choiceCounts[item] || 0) + 1;
          }
        } else {
          choiceCounts[a as string] = (choiceCounts[a as string] || 0) + 1;
        }
      }
    }

    return {
      fieldId: field.id,
      label: field.label,
      fieldType: field.fieldType,
      answerCount: answers.filter(Boolean).length,
      choiceCounts,
    };
  });

  return {
    form: {
      id: form.id,
      title: form.title,
      fields: form.fields,
    },
    totalSubmissions: submissions.length,
    submissions,
    fieldStats,
  };
}
