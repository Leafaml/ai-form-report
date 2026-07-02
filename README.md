<p align="center">
  <img src="https://img.shields.io/github/stars/Leafaml/ai-form-report?style=social" alt="stars">
  <img src="https://img.shields.io/github/license/Leafaml/ai-form-report" alt="license">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

<p align="center">
  <a href="README.md">简体中文</a> &nbsp;|&nbsp;
  <a href="#english">English</a>
</p>

<h1 align="center">AI 智能表单</h1>

<p align="center">
  开源问卷表单系统 · AI 驱动 · 前后端分离<br/>
  <sub>创建 → 收集 → AI 自动分析，全流程打通</sub>
</p>

<p align="center">
  <a href="#-在线体验"><b>在线体验</b></a> &nbsp;·&nbsp;
  <a href="#-快速开始"><b>快速开始</b></a> &nbsp;·&nbsp;
  <a href="#-技术架构"><b>技术架构</b></a> &nbsp;·&nbsp;
  <a href="#-贡献指南"><b>贡献指南</b></a>
</p>

<p align="center">
  如果觉得项目有帮助，请点击右上角 <b>Star 🌟</b> 给予鼓励
</p>

---

## 📖 关于本项目

AI 智能表单是一款开源问卷表单系统，支持创建表单、分享收集、AI 自动生成分析报告。

**核心特色**：无需编写任何分析代码，AI 自动完成文本摘要、关键词提取、情感分析、主题归纳，并给出可执行的行动建议。

- 🎯 **前后端分离架构**：Next.js 前端 + Express 后端，独立部署
- 🤖 **AI 深度整合**：流式对话助手、RAG 增强分析、智能缓存限流
- 🔐 **完整认证体系**：JWT + bcrypt + 邮箱验证码
- 🎨 **双主题设计**：亮色 / 暗色模式，跟随系统偏好

---

## 🚀 在线体验

> 部署后在此处放置在线体验链接

| 环境 | 地址 |
|------|------|
| 前端演示 | *即将上线* |
| API 文档 | *即将上线* |

测试账号：`demo@example.com` / 密码：`demo123`

---

## ✨ 功能概览

### 表单管理
- 📝 **创建表单**：短文本、多行文本、单选、多选四种题型，拖拽式添加
- 🔗 **分享收集**：生成独立链接，填写者无需登录，PC/移动端自动适配
- 📊 **数据统计**：选择题自动柱状图 + 百分比，表格展示全部文本回复
- 📥 **CSV 导出**：UTF-8 BOM 确保 Excel 中文兼容
- 🗑️ **回收站**：软删除机制，30 天内可恢复

### AI 能力
- 🤖 **AI 分析报告**：摘要总结、关键词提取、情感分析、主题分布、行动建议
- 💬 **AI 对话助手**：流式聊天 (SSE)，自然语言描述需求即可获得表单建议
- 📚 **RAG 增强**：结合上传的背景资料进行上下文感知分析
- ⚡ **智能缓存**：提交数据未变时自动复用分析结果，节省 API 调用
- 🛡️ **频率限制**：每小时 10 次，防止滥用

### 用户系统
- 👤 邮箱注册 + 验证码激活
- 🔑 JWT 登录认证
- 🖼️ 头像上传 + DiceBear 生成
- ✏️ 昵称自定义
- 🔒 密码修改

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────┐
│                 前端 (Next.js 16)         │
│  React 19 + TypeScript + Tailwind CSS    │
│  framer-motion · lucide-react · DiceBear │
├──────────────────────────────────────────┤
│              后端 (Express API)           │
│  TypeScript · Prisma ORM · JWT · bcrypt  │
│  Multer (上传) · SSE (流式)              │
├──────────────────────────────────────────┤
│              数据库 (MySQL 8.0)           │
│  users · forms · form_fields             │
│  submissions · analysis_cache            │
│  verification_codes                      │
├──────────────────────────────────────────┤
│            AI (DeepSeek API)             │
│  流式生成 · 结构分析 · RAG 增强          │
└──────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 前置要求

- Node.js 22+
- Docker Desktop（运行 MySQL）
- DeepSeek API Key（[申请地址](https://platform.deepseek.com)）

### Docker 一键启动（推荐）

```bash
git clone https://github.com/Leafaml/ai-form-report.git
cd ai-form-report

# 配置环境变量
cp .env.example .env.local
cp server/.env.example server/.env
# 编辑 server/.env 填入 DEEPSEEK_API_KEY

# 启动全部服务
docker compose up -d

# 浏览器打开
# http://localhost:3000  → 前端
# http://localhost:3001/api/health → 后端健康检查
```

### 本地开发

```bash
# 终端 1：MySQL
docker run -d --name ai-form-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root123456 \
  -e MYSQL_DATABASE=ai_form mysql:8.4

# 终端 2：Express 后端
cd server
cp .env.example .env  # 编辑填入 DATABASE_URL / JWT_SECRET / DEEPSEEK_API_KEY
npm install
npx prisma migrate deploy
npm run dev   # → http://localhost:3001

# 终端 3：Next.js 前端
cd ..
npm install
npm run dev   # → http://localhost:3000
```

---

## 📡 API 参考

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | — | 注册（发送验证码） |
| POST | `/api/auth/verify` | — | 验证邮箱 |
| POST | `/api/auth/login` | — | 登录 |
| GET | `/api/auth/me` | JWT | 用户信息 |
| PUT | `/api/auth/profile` | JWT | 更新昵称/头像 |
| PUT | `/api/auth/password` | JWT | 修改密码 |
| GET | `/api/forms` | JWT | 表单列表 |
| POST | `/api/forms` | JWT | 创建表单 |
| GET | `/api/forms/:id` | — | 表单详情 |
| DELETE | `/api/forms/:id` | JWT | 删除（移入回收站） |
| GET | `/api/forms/trash/list` | JWT | 回收站 |
| POST | `/api/forms/:id/restore` | JWT | 恢复 |
| DELETE | `/api/forms/:id/permanent` | JWT | 彻底删除 |
| POST | `/api/submissions` | — | 提交答卷 |
| GET | `/api/forms/:id/results` | JWT | 结果统计 |
| POST | `/api/forms/:id/analyze` | JWT | AI 分析 |
| GET | `/api/forms/:id/export` | JWT | CSV 导出 |
| POST | `/api/ai/chat` | JWT | AI 流式对话 |
| POST | `/api/upload/avatar` | JWT | 上传头像 |

---

## 🤝 贡献指南

欢迎贡献代码！请确保：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 确保 `npm run build` 无错误
5. 推送到分支 (`git push origin feature/amazing-feature`)
6. 提交 Pull Request

Bug 报告和功能建议请提交 [GitHub Issue](https://github.com/Leafaml/ai-form-report/issues)。

---

## 📄 许可证

本项目采用 [MIT License](https://opensource.org/licenses/MIT)。

Copyright © 2024 AI Form Report Contributors

---

## 🙏 致谢

- [DeepSeek](https://www.deepseek.com/) — AI 模型服务
- [shadcn/ui](https://ui.shadcn.com/) — 设计参考
- [lucide](https://lucide.dev/) — 图标库
- [DiceBear](https://www.dicebear.com/) — 头像生成
- [framer-motion](https://www.framer.com/motion/) — 动画库
