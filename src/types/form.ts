/** 表单主记录 */
export interface Form {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

/** 表单字段（问题）定义 */
export interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: "text" | "textarea" | "radio" | "checkbox";
  options: string[] | null;
  sort_order: number;
}

/** 单条提交记录 */
export interface Submission {
  id: string;
  form_id: string;
  data: Record<string, string | string[]>;
  created_at: string;
}

/** 选择题统计（用于柱状图） */
export type ChoiceCounts = Record<string, number>;
