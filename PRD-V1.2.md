# PRD · AI 智能表单 V1.2 — Express + MySQL 自建后端

> 状态：V1.1 完成 → V1.2 架构升级
> 分支：`v2-express`（main 保留 Supabase 版）
> 填表人：阿航 + 方块C
> 日期：2026-07-02

---

## 1. 一句话说清楚

把 BaaS 托管架构（Supabase）替换为 **Express + MySQL 自建后端**，将项目从"前端为主的全栈"升级为**真正的前后端分离全栈**，覆盖 8 份 JD 中最高频的后端技术点。

---

## 2. 为什么要做

**岗位对齐**（8 份 JD 统计）：

| 技术点 | JD 出现次数 | 当前状态 | V1.2 后 |
|--------|-----------|---------|---------|
| MySQL | 6/8 | ❌ (PostgreSQL via Supabase) | ✅ |
| 后端框架 (Express/Spring) | 5/8 | ❌ (BaaS, 无自有后端) | ✅ Express |
| JWT / 认证自建 | 4/8 | ❌ (Supabase Auth) | ✅ |
| ORM (Prisma/TypeORM) | 3/8 | ❌ (手写 fetch SQL) | ✅ Prisma |
| RESTful API 设计 | 5/8 | ⚠️ (Supabase REST) | ✅ 自建 |

**面试话术**：*"V1 用 Supabase 快速验证产品，V2 替换为 Express + MySQL 自建后端——因为业务需要更细粒度的权限控制和数据查询优化，BaaS 不够灵活。"*

---

## 3. 功能范围

### ✅ 本迭代包含

**后端（Express API Server）**：
- [ ] 项目骨架：Express + TypeScript + Prisma + MySQL
- [ ] 用户系统：注册（bcrypt 加密）、登录（JWT 签发）、鉴权中间件
- [ ] 表单 CRUD：创建/列表/详情/删除（所有权校验）
- [ ] 提交 API：公开填写 + 结果查询（字段级统计）
- [ ] AI 分析 API：转发 DeepSeek（保留 V1.1 的 RAG 链路）
- [ ] 数据导出 API：CSV 导出

**前端适配**：
- [ ] 创建 API 客户端层（`src/lib/api-client.ts`）替代 Supabase 直连
- [ ] 登录/注册页对接自建 API
- [ ] 仪表盘/创建/结果/报告页全链路切换到新后端
- [ ] AuthProvider 改为自建 JWT 管理

**工程化**：
- [ ] Prisma schema 定义 + 迁移脚本
- [ ] API 路由文档（README 表格）
- [ ] docker-compose 加入 MySQL 服务

### 🆕 V1.2.1 新增（对标参考项目）

- [ ] **AI 对话助手**：流式聊天界面，DeepSeek API 流式输出，建议快捷入口
- [ ] **回收站**：软删除（deleted_at 字段），恢复/彻底删除，30 天自动清理
- [ ] 创建页问题文字必填标识强化（placeholder + 红框提示）

### ❌ 本迭代不包含

- [ ] 表单模板市场（延后）
- [ ] 定时报告/邮件推送（延后）
- [ ] Redis 缓存（延后）
- [ ] 单元测试（延后 V1.3）
- [ ] 文件上传（延后）

---

## 4. 技术架构

### 4.1 前后对比

```
V1.1 (Supabase)                    V1.2 (Express + MySQL)
                    
┌──────────┐                       ┌──────────┐
│ Next.js   │──► Supabase REST     │ Next.js   │──► Express API
│ (前端)    │──► Supabase Auth     │ (前端)    │──► JWT Auth
└──────────┘                       └──────────┘
      │                                  │
      ▼                                  ▼
┌──────────┐                       ┌──────────┐
│ Supabase  │                      │  MySQL   │
│(PostgreSQL)│                     │(Prisma)  │
└──────────┘                       └──────────┘
```

### 4.2 项目结构

```
ai-form-report/
├── server/                        ← 新增：Express 后端
│   ├── src/
│   │   ├── index.ts              ← Express 入口（app.listen）
│   │   ├── app.ts                ← Express app 配置（中间件/路由挂载）
│   │   ├── middleware/
│   │   │   ├── auth.ts           ← JWT 鉴权中间件
│   │   │   └── error-handler.ts  ← 全局错误处理
│   │   ├── routes/
│   │   │   ├── auth.ts           ← POST /register, /login
│   │   │   ├── forms.ts          ← CRUD /forms
│   │   │   ├── submissions.ts    ← POST /submit, GET /results
│   │   │   ├── analyze.ts        ← POST /analyze (AI)
│   │   │   └── export.ts         ← GET /export
│   │   ├── services/             ← 业务逻辑层
│   │   │   ├── auth.service.ts
│   │   │   ├── form.service.ts
│   │   │   ├── submission.service.ts
│   │   │   └── ai.service.ts     ← 保留 V1.1 的 RAG 链路
│   │   └── lib/
│   │       ├── prisma.ts         ← Prisma Client 单例
│   │       └── jwt.ts            ← JWT 签发/验证
│   ├── prisma/
│   │   ├── schema.prisma         ← 数据模型定义
│   │   └── migrations/           ← 迁移文件
│   ├── package.json
│   └── tsconfig.json
├── src/                           ← Next.js 前端（现有）
│   ├── lib/
│   │   └── api-client.ts         ← 新增：统一 API 调用层
│   └── app/
│       └── components/
│           └── AuthProvider.tsx   ← 改为自建 JWT 管理
├── docker-compose.yml             ← 加入 MySQL 服务
└── .env.example                   ← 更新环境变量
```

### 4.3 数据库设计（MySQL）

```sql
-- users
CREATE TABLE users (
  id         VARCHAR(36) PRIMARY KEY,  -- UUID
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,     -- bcrypt hash
  created_at DATETIME DEFAULT NOW()
);

-- forms
CREATE TABLE forms (
  id          VARCHAR(36) PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  user_id     VARCHAR(36) NOT NULL REFERENCES users(id),
  created_at  DATETIME DEFAULT NOW()
);

-- form_fields
CREATE TABLE form_fields (
  id         VARCHAR(36) PRIMARY KEY,
  form_id    VARCHAR(36) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  label      VARCHAR(255) NOT NULL,
  field_type ENUM('text','textarea','radio','checkbox') NOT NULL,
  options    JSON NULL,
  sort_order INT DEFAULT 0
);

-- submissions
CREATE TABLE submissions (
  id         VARCHAR(36) PRIMARY KEY,
  form_id    VARCHAR(36) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data       JSON NOT NULL,
  created_at DATETIME DEFAULT NOW()
);

-- analysis_cache（AI 分析结果缓存 + 频率限制）
CREATE TABLE analysis_cache (
  id          VARCHAR(36) PRIMARY KEY,
  form_id     VARCHAR(36) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id     VARCHAR(36) NOT NULL REFERENCES users(id),
  result      JSON NOT NULL,           -- 缓存的 AnalysisResult
  submissions_hash VARCHAR(64) NOT NULL, -- 提交数据哈希，判断缓存是否有效
  created_at  DATETIME DEFAULT NOW()
);
```

### 4.4 API 设计

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 无 | 注册，返回 JWT |
| POST | `/api/auth/login` | 无 | 登录，返回 JWT |
| GET | `/api/forms` | JWT | 我的表单列表 |
| POST | `/api/forms` | JWT | 创建表单 |
| GET | `/api/forms/:id` | 无 | 表单详情（公开填写） |
| DELETE | `/api/forms/:id` | JWT | 删除表单 |
| POST | `/api/submissions` | 无 | 提交答卷（公开） |
| GET | `/api/forms/:id/results` | JWT | 查看结果（仅所有者） |
| POST | `/api/forms/:id/analyze` | JWT | AI 分析（仅所有者） |
| GET | `/api/forms/:id/export` | JWT | 导出 CSV（仅所有者） |

---

## 5. 用户故事

| # | 故事 | 对应技术点 |
|---|------|----------|
| 1 | 作为新用户，用邮箱+密码注册后直接获得 JWT 令牌并登录 | bcrypt + JWT |
| 2 | 作为表单创建者，我的所有操作（CRUD/分析/导出）都需要 JWT 鉴权 | 鉴权中间件 |
| 3 | 作为匿名填写者，我仍可以无需登录填写公开表单 | 公开路由 |
| 4 | 作为面试官，我能看到清晰的 RESTful API 设计 | API 设计 |
| 5 | 作为面试官，我能看到 Prisma Schema 即文档的数据库设计 | Prisma |
| 6 | 作为开发者，`docker compose up` 一键启动 MySQL + Express + Next.js | Docker |

---

## 6. 技术要点与风险

| 要点 | 说明 |
|------|------|
| **MySQL 安装** | 本地开发用 Docker MySQL 容器，生产用 Railway/Render 免费层 |
| **JWT 过期** | access_token 7 天有效期，前端 401 时跳转登录页 |
| **密码安全** | bcrypt salt rounds=12，不在日志中打印密码 |
| **JSON 字段** | MySQL 5.7+ 支持 JSON 类型，Prisma 映射为 `Json` |
| **UUID 生成** | 服务端 `crypto.randomUUID()`，不依赖数据库自增 |
| **CORS** | Express 配置允许 Next.js 前端域名 |
| **前端适配量** | 约 8 个文件需改 API 调用路径和鉴权方式 |

### 6.1 AI 调用成本控制

| 策略 | 实现 |
|------|------|
| **结果缓存** | 同一表单 + 提交数据未变 → 5 分钟内返回缓存结果，不发 API 请求 |
| **频率限制** | 同一用户对同一表单，每小时最多 10 次分析请求，超限返回 429 |
| **缓存键** | 对 `submissions` 的 id 列表 + `updated_at` 做 SHA256 哈希，任何一条提交变化则缓存失效 |
| **面试可讲** | "通过缓存哈希 + 滑动窗口限流，在保证分析时效性的同时控制第三方 API 成本" |

### 6.2 缓存判定流程

```
用户请求分析
  ↓
检查 submissions_hash：当前提交数据哈希 === 缓存中的哈希？
  ├─ YES + 5分钟内 → 直接返回缓存（不发 API）
  ├─ YES + 超过5分钟 → 检查频率计数器
  │   ├─ 未超限 → 重新分析 + 更新缓存
  │   └─ 超限 → 返回 429 "分析过于频繁，请稍后再试"
  └─ NO（有新提交）→ 重新分析 + 更新缓存
```

---

## 9. AI 对话助手（V1.2.1 新增）

### 9.1 功能概述

侧边栏入口「AI 助手」，打开对话式聊天界面。用户自然语言描述需求，AI 流式返回建议。

### 9.2 技术方案

| 要点 | 方案 |
|------|------|
| 流式输出 | Server-Sent Events (SSE)，Express `res.write()` + `text/event-stream` |
| API | DeepSeek 流式端点 `stream: true` |
| 前端 | Chat 组件，`EventSource` 或 `fetch` + `ReadableStream` 消费 SSE |
| 建议快捷入口 | 3 个预设提示词按钮（"帮我生成满意度调查"、"分析数据趋势"、"优化表单填写率"） |

### 9.3 接口设计

```
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

Request:  { "message": "帮我设计一个用户满意度调查问卷" }
Response: text/event-stream
  data: {"chunk": "好的，我建议..."}
  data: {"chunk": "包含以下字段..."}
  ...
  data: [DONE]
```

### 9.4 数据库变动

无需新表——对话记录暂存前端内存，不持久化。

---

## 10. 回收站（V1.2.1 新增）

### 10.1 功能概述

删除表单时软删除（标记 deletedAt），数据进入回收站。支持 30 天内恢复或彻底删除。

### 10.2 技术方案

| 要点 | 方案 |
|------|------|
| 软删除 | `forms` 表加 `deleted_at DATETIME NULL`，非 NULL 表示在回收站 |
| 恢复 | `UPDATE forms SET deleted_at = NULL WHERE id = ?` |
| 彻底删除 | 级联删除表单及关联数据（submissions/fields/analysis_cache） |
| 自动清理 | 定时任务（node-cron）每 24h 检查，删除 deleted_at 超过 30 天的记录 |
| 列表过滤 | `listForms` 默认过滤 `deleted_at IS NOT NULL`；回收站专用接口过滤 `deleted_at IS NOT NULL` |

### 10.3 接口设计

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/forms/trash` | JWT | 回收站列表 |
| POST | `/api/forms/:id/restore` | JWT | 恢复表单 |
| DELETE | `/api/forms/:id/permanent` | JWT | 彻底删除（替换原 DELETE 为软删除） |

### 10.4 原有删除接口改动

`DELETE /api/forms/:id` → 改为软删除（设置 deleted_at），不再物理删除。

---

## 7. 验收标准

### 后端
- [ ] `POST /api/auth/register` 成功注册并返回 JWT
- [ ] `POST /api/auth/login` 成功登录并返回 JWT
- [ ] 无 JWT 访问 `/api/forms` 返回 401
- [ ] 用户 A 访问用户 B 的表单结果返回 403
- [ ] CSV 导出中文正常显示
- [ ] AI 分析保留 RAG 增强能力
- [ ] 提交数据未变 + 5 分钟内重复分析 → 返回缓存结果（不发 DeepSeek API）
- [ ] 同一表单 1 小时内超过 10 次分析 → 返回 429
- [ ] 有新提交时缓存自动失效 → 触发重新分析

### 前端
- [ ] 注册/登录流程正常
- [ ] 创建表单 → 填写 → 查看结果 → AI 分析 全链路跑通
- [ ] token 过期后自动跳转登录页
- [ ] 刷新页面后登录状态保持（localStorage token）

### 工程
- [ ] `docker compose up` 一键启动全部服务
- [ ] Prisma migrate 可复现数据库结构
- [ ] `server/` 目录有独立 `npm run dev` 脚本

---

## 8. 里程碑

| 阶段 | 任务 | 预计 |
|------|------|------|
| **M1** | MySQL Docker + Prisma schema + 迁移 | 1h |
| **M2** | Express 骨架 + 中间件 + 错误处理 | 1h |
| **M3** | 用户注册/登录 API (bcrypt + JWT) | 2h |
| **M4** | 表单 CRUD API + 鉴权 | 2h |
| **M5** | 提交 + 结果 API | 1.5h |
| **M6** | AI 分析 API（含缓存 + 限流 + RAG） | 1.5h |
| **M7** | 导出 CSV API | 0.5h |
| **M8** | 前端适配（api-client + AuthProvider + 页面） | 2h |
| **M9** | Docker Compose 一键启动 + 全链路测试 | 1h |
| **M10** | AI 对话助手（流式聊天 + DeepSeek 流式 API） | 2h |
| **M11** | 回收站（软删除 + 恢复 + 彻底删除） | 1.5h |
| **M12** | 创建页必填标识强化 | 0.5h |

> 合计约 **3 天**（全职），业余时间约 **5 天**。
