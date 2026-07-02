# PRD · AI 智能表单 V1.1 — 生产加固 + 求职亮点

> 状态：MVP 完成 → 下一迭代
> 填表人：阿航 + 方块C
> 日期：2026-07-01

---

## 1. 一句话说清楚

把当前"本地能跑的 MVP"升级为**可公网访问、数据安全、面试官能在线试用的作品级项目**，同时嵌入 **RAG 增强分析**和**结构化 Prompt 工程**两个求职高频技术点。

---

## 2. 为什么要做（背景）

**当前硬伤**：
- 注册后要手动在 Supabase 后台确认 → 面试官没法自己注册试用
- 猜对表单 ID 就能看别人数据 → 安全隐患，面试官一眼就能看出来
- `as any` 还在代码里 → TypeScript 项目不 TypeSafe，扣分
- 本地 localhost → 面试官没法在线体验

**岗位对齐**（提取自 8 份 JD）：

| 岗位高频要求 | 本项目对应 | 当前状态 |
|-------------|-----------|---------|
| RAG 技术 | AI 分析报告可升级为 RAG 增强 | ❌ 未实现 |
| Prompt Engineering | DeepSeek 调用已有，但 prompt 未结构化 | ⚠️ 简单拼接 |
| Agent/LangChain | 可加入分析链概念 | ❌ 未实现 |
| Docker 部署 | 容器化 | ❌ 未实现 |
| 全栈能力 | Next.js + Supabase 已是全栈 | ✅ 基本覆盖 |
| TypeScript | 类型系统未严格使用 | ⚠️ 有 as any |

---

## 3. 功能范围

### ✅ 本迭代包含（V1.1）

- [ ] **P0** 注册流程修复 — Supabase 自动确认邮箱 + 注册后自动登录
- [ ] **P0** 多用户数据隔离 — 表单所有权校验（结果页/报告页/填写页鉴权）
- [ ] **P0** TypeScript 严格化 — 消除所有 `as any`，补充完整类型定义
- [ ] **P1** RAG 增强 AI 分析 — 分析报告引入知识库检索增强（求职亮点）
- [ ] **P1** 结构化 Prompt 工程 — 抽出 prompt 模板层，可展示设计思路（求职亮点）
- [ ] **P1** 数据导出 — 支持导出 Excel/CSV
- [ ] **P1** Vercel 部署 — 公网可访问
- [ ] **P2** Docker 容器化 — Dockerfile + docker-compose

### ❌ 本迭代不包含

- [ ] 表单模板市场（延后 V1.2）
- [ ] 批量对比分析（延后 V1.2）
- [ ] 定时报告/邮件推送（延后 V1.2）
- [ ] LangChain/LangGraph Agent 系统（延后 V1.2，需后端重构）

---

## 4. 用户故事

| # | 故事 | 优先级 | 对应岗位技术点 |
|---|------|--------|--------------|
| 1 | 作为新用户，我想注册后直接进入仪表盘，不需要管理员手动确认 | P0 | 基础体验 |
| 2 | 作为表单创建者，我的表单数据只有我自己能看 | P0 | 数据安全/后端鉴权 |
| 3 | 作为面试官，我看到一个 TypeScript 严格、类型完整的项目 | P0 | TypeScript |
| 4 | 作为表单创建者，AI 分析不仅基于我的答卷，还能结合我上传的背景资料给出更精准的建议 | P1 | **RAG** |
| 5 | 作为面试官，我能看到项目的 Prompt 设计思路和工程化结构 | P1 | **Prompt Engineering** |
| 6 | 作为表单创建者，我想导出答卷数据为 Excel | P1 | 数据导出 |
| 7 | 作为面试官，我可以直接打开公网链接体验产品 | P1 | 部署/Docker |
| 8 | 作为开发者，项目可以一键 Docker 启动 | P2 | **Docker** |

---

## 5. 交互流程

### 5.1 注册流程（修复后）

```
用户填写邮箱+密码 → 点击注册
  ↓ 成功：Supabase 自动确认 → 自动登录 → 跳转仪表盘
  ↓ 失败：表单保留已填内容 + 显示具体错误（邮箱已注册/密码太短等）
```

### 5.2 RAG 增强分析（新增）

```
用户进入报告页 → 点击"AI 分析"
  ↓ 可选：上传背景资料（txt/md/pdf，如产品定位文档、用户画像）
  ↓ 系统检索相关资料片段 → 拼入 prompt 作为上下文
  ↓ AI 综合"答卷数据 + 知识库片段"生成分析报告
  ↓ 报告中标注："以下建议基于您提供的《XX文档》"
```

**状态覆盖**：
| 状态 | 处理 |
|------|------|
| 无背景资料 | 降级为基础 AI 分析（现有逻辑） |
| 资料过大（>2MB） | 提示"文件过大，请压缩后上传" |
| 资料格式不支持 | 提示"仅支持 txt/md/pdf" |
| AI 超时 | 重试 1 次，仍失败则降级为基础分析 |

### 5.3 数据导出（新增）

```
用户在结果页 → 点击"导出" → 选择格式（Excel / CSV）
  ↓ 服务端生成文件 → 浏览器下载
  ↓ 0 条数据：按钮置灰 + tooltip "暂无数据可导出"
```

---

## 6. 技术方案

### 6.1 注册修复

```
方案：Supabase Dashboard → Authentication → Settings →
      取消 "Confirm email" 选项（或设为 auto-confirm）
代码：signUp 后直接 signIn，不需要等确认
```

### 6.2 数据隔离

```
方案：在每个数据查询 API 和 Server Component 中校验 user_id
- /form/[id]/results → 校验 form.user_id === current_user.id
- /form/[id]/report → 同上
- /api/analyze → 同上
- 填写页 /form/[id] → 不需要鉴权（公开填写），但提交时校验 form 存在
实现：抽取 getFormWithAuth(formId, userId) 公共函数
```

### 6.3 TypeScript 严格化

```
范围：
- src/app/dashboard/page.tsx → 替换 any[] 为 Form[]
- src/lib/ai.ts → 替换 any 为 AnalyzeResponse 类型
- 补充 src/types/ 目录：form.ts, submission.ts, report.ts
- tsconfig.json 开启 "strict": true（确认已开启，检查所有泛型推断）
```

### 6.4 RAG 增强分析（求职亮点 🔥）

```
架构：
  用户上传资料 → 文本分块（chunk）→ 存储（Supabase 新表 knowledge_chunks）
  AI 分析时 → 基于答卷内容检索相关 chunk → 拼入 prompt → 生成报告

简化实现（第1版不做向量数据库）：
  1. 用户粘贴文本（不上传文件，降低复杂度）
  2. 按段落分块
  3. 关键词匹配检索（不用 embedding，用简单的文本相似度）
  4. 检索到的 chunk 注入 prompt 的 "参考背景" 部分

技术点可讲：
  - 文本分块策略（按段落 + 重叠窗口）
  - 检索增强生成（RAG）的基本链路
  - Prompt 模板工程化
```

### 6.5 结构化 Prompt 工程

```
方案：抽取 src/lib/prompts/ 目录
  - analyze-basic.ts      → 基础分析 prompt 模板
  - analyze-rag.ts        → RAG 增强 prompt 模板
  - prompt-builder.ts     → prompt 组装工厂函数

每个模板文件包含：
  1. System Prompt（角色设定）
  2. User Prompt 模板（带 {{变量}} 占位符）
  3. 输出格式约束（JSON Schema）
  4. 注释说明设计意图（面试官可读）

面试亮点：可以讲"我把 prompt 当代码管理——模板化、版本化、可测试"
```

### 6.6 数据导出

```
方案：API Route 生成 CSV/Excel
  - /api/export?formId=xxx&format=csv
  - /api/export?formId=xxx&format=xlsx
  - 使用轻量库：json2csv（CSV）、exceljs（Excel）
  - 服务端鉴权后生成，返回文件流
```

### 6.7 Vercel 部署 + Docker

```
Vercel：
  - 连接 GitHub 仓库
  - 配置环境变量（Supabase URL/Key, DeepSeek API Key）
  - 一键部署

Docker：
  - Dockerfile（多阶段构建：deps → build → runner）
  - docker-compose.yml（应用 + 可选 Supabase 本地替代）
  - .dockerignore
```

---

## 7. 数据库变更

```sql
-- 新增：知识库表（RAG 用）
CREATE TABLE knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  content TEXT,           -- 原始文本
  chunks JSONB,           -- [{index, text, keywords}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 修改：submissions 表补充 form_id 索引（查询性能）
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
```

---

## 8. 验收标准

### 注册修复
- [ ] 新用户注册后直接进入仪表盘，无需手动确认
- [ ] 注册失败时显示中文错误提示（不是英文 raw error）
- [ ] 已登录用户访问 /auth/login 自动跳转仪表盘

### 数据隔离
- [ ] 用户 A 无法通过 URL 访问用户 B 的表单结果页（返回 403）
- [ ] 用户 A 无法通过 API 调用分析用户 B 的表单（返回 403）
- [ ] 公开填写页不受影响（匿名用户仍可填写）

### TypeScript
- [ ] `git grep "as any"` 返回空
- [ ] `src/types/` 目录存在，至少包含 form.ts / submission.ts / report.ts
- [ ] `npm run build` 零类型错误

### RAG 增强分析
- [ ] 用户可以在报告页粘贴背景文本
- [ ] 有背景文本时，分析结果引用背景内容
- [ ] 无背景文本时，降级为基础分析（不报错）

### Prompt 工程
- [ ] `src/lib/prompts/` 目录存在
- [ ] 每个 prompt 模板有清晰的注释说明设计意图
- [ ] README 中有"Prompt 工程设计"章节（面试展示用）

### 数据导出
- [ ] CSV 导出中文不乱码（UTF-8 BOM）
- [ ] Excel 导出选择题有统计 sheet + 明细 sheet
- [ ] 空数据时导出按钮不可点击

### 部署
- [ ] Vercel 公网 URL 可访问
- [ ] 公网环境注册/登录/创建/填写/分析 全流程跑通
- [ ] Dockerfile 存在且 `docker build` 成功

---

## 9. 里程碑

| 阶段 | 任务 | 预计 |
|------|------|------|
| **M1** | 注册修复 + 数据隔离 | 半天 |
| **M2** | TypeScript 严格化 | 半天 |
| **M3** | 结构化 Prompt 工程 | 半天 |
| **M4** | RAG 增强分析（简化版） | 1 天 |
| **M5** | 数据导出 Excel/CSV | 半天 |
| **M6** | Vercel 部署 + 公网验证 | 2 小时 |
| **M7** | Docker 容器化 | 1 小时 |
| **M8** | README 更新 + Prompt 工程设计文档 | 1 小时 |

> 总计约 **3-4 天**（全职），业余时间约 **1 周**。

---

## 10. 求职话术储备（面试怎么讲）

> 不讲"我做了个表单工具"。
> 讲："我基于 Next.js 全栈框架，构建了一个集成 **RAG 增强分析**和**结构化 Prompt 工程**的智能表单系统。"

| 面试常见问 | 项目对应点 |
|-----------|-----------|
| "你用过 RAG 吗？" | RAG 增强分析：用户上传背景资料 → 文本分块 → 检索增强 → 分析报告 |
| "你怎么管理 Prompt？" | Prompt 模板化：`src/lib/prompts/` 目录，模板/变量/输出约束分离 |
| "怎么做数据安全？" | 多用户数据隔离：所有权校验 + API 鉴权 + RLS 策略 |
| "用过 Docker 吗？" | 多阶段 Dockerfile + docker-compose 一键启动 |
| "TypeScript 水平如何？" | strict 模式 + 零 as any + 完整类型定义体系 |
| "项目上线了吗？" | Vercel 公网部署，直接给面试官链接体验 |
