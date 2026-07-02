<p align="center">
  <img src="https://img.shields.io/github/stars/Leafaml/ai-form-report?style=social" alt="stars">
  <img src="https://img.shields.io/github/license/Leafaml/ai-form-report" alt="license">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

<h1 align="center">AI Form Report</h1>

<p align="center">
  Open-source form builder with AI-powered analytics<br/>
  <sub>Create → Collect → Analyze — fully automated</sub>
</p>

<p align="center">
  <a href="#-live-demo"><b>Live Demo</b></a> &nbsp;·&nbsp;
  <a href="#-features"><b>Features</b></a> &nbsp;·&nbsp;
  <a href="#-architecture"><b>Architecture</b></a> &nbsp;·&nbsp;
  <a href="#-quick-start"><b>Quick Start</b></a> &nbsp;·&nbsp;
  <a href="#-api-reference"><b>API</b></a>
</p>

---

## 🚀 Live Demo

| Component | URL |
|-----------|-----|
| Frontend | [ai-form-report.vercel.app](https://ai-form-report.vercel.app) |
| Backend API | [ai-form-server-s4xq.onrender.com](https://ai-form-server-s4xq.onrender.com/api/health) |

> **Note**: The backend runs on Render's free tier and may spin down after 15 minutes of inactivity. First request may take ~30s to wake up.

---

## ✨ Features

### Form Builder
- **4 question types**: Short text, Paragraph, Single choice, Multiple choice
- **Drag-and-drop** field ordering
- **Shareable links** — respondents don't need accounts
- **Results dashboard** with auto-generated charts (bar + percentage for choice questions)
- **CSV export** with UTF-8 BOM for Excel compatibility
- **Soft delete** with trash recovery (30-day window)

### AI Capabilities
- **Analysis Report**: Summary, keyword extraction, sentiment analysis, topic distribution, actionable recommendations
- **Chat Assistant**: Streaming SSE chat for form design advice and data interpretation
- **RAG-enhanced analysis**: Upload background context for domain-aware insights
- **Smart caching**: Reuses results when submission data hasn't changed
- **Rate limiting**: 10 requests/hour per user

### User System
- Email registration + verification
- JWT authentication (access + refresh)
- Avatar upload + DiceBear auto-generation
- Custom nickname
- Per-user AI API key configuration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend (Next.js 16)              │
│  React 19 · TypeScript · Tailwind CSS 4      │
│  framer-motion · lucide-react · DiceBear     │
│  Deployed on ▲ Vercel                        │
├─────────────────────────────────────────────┤
│           Backend (Express API)              │
│  TypeScript · Prisma ORM · JWT · bcrypt      │
│  Multer (uploads) · SSE (streaming)          │
│  Deployed on ⧟ Render (Docker)              │
├─────────────────────────────────────────────┤
│        Database (Neon PostgreSQL)            │
│  Serverless · Autoscaling · Free tier        │
│  users · forms · questions                  │
│  submissions · answers · verification_codes  │
├─────────────────────────────────────────────┤
│          AI (DeepSeek API)                   │
│  Anthropic-compatible endpoint               │
│  Streaming · Structured analysis · RAG       │
└─────────────────────────────────────────────┘
```

### Design Decisions

| Decision | Why |
|----------|-----|
| **Express over Next.js API routes** | Separate backend demonstrates full-stack capability; independent scaling |
| **Neon PostgreSQL over Docker MySQL** | Zero-ops serverless DB; no Docker maintenance for production |
| **Prisma ORM** | Type-safe queries, schema-as-documentation, auto-generated migrations |
| **Per-user AI key** | Each user configures their own DeepSeek key in Settings; no global API cost risk |
| **SSE over WebSocket** | Simpler infrastructure, no need for persistent connections |
| **JWT + bcrypt** | Demonstrates authentication fundamentals; no third-party auth dependency |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Neon PostgreSQL database ([free tier](https://neon.tech))
- DeepSeek API key ([get one here](https://platform.deepseek.com))

### 1. Clone & Install

```bash
git clone https://github.com/Leafaml/ai-form-report.git
cd ai-form-report

# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend (server/.env)
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secret-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
```

### 3. Database Setup

```bash
cd server
npx prisma migrate deploy
npx prisma generate
cd ..
```

### 4. Run

```bash
# Terminal 1: Backend
cd server && npm run dev    # → http://localhost:3001

# Terminal 2: Frontend
npm run dev                 # → http://localhost:3000
```

### Docker (Optional)

```bash
# Build and run both services
docker compose up -d
```

---

## 📡 API Reference

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register (sends verification code) |
| `POST` | `/api/auth/verify` | — | Verify email |
| `POST` | `/api/auth/resend` | — | Resend verification code |
| `POST` | `/api/auth/login` | — | Login |
| `GET` | `/api/auth/me` | JWT | Get current user profile |
| `PUT` | `/api/auth/profile` | JWT | Update nickname / avatar / API key |
| `PUT` | `/api/auth/password` | JWT | Change password |

### Forms

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/forms` | JWT | List user's forms |
| `POST` | `/api/forms` | JWT | Create form |
| `GET` | `/api/forms/:id` | — | Get form details (for filling) |
| `DELETE` | `/api/forms/:id` | JWT | Soft delete → trash |

### Trash

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/forms/trash/list` | JWT | List trashed forms |
| `POST` | `/api/forms/:id/restore` | JWT | Restore from trash |
| `DELETE` | `/api/forms/:id/permanent` | JWT | Permanent delete |

### Submissions & Analysis

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/submissions` | — | Submit form response |
| `GET` | `/api/forms/:id/results` | JWT | Get results with field stats |
| `POST` | `/api/forms/:id/analyze` | JWT | AI analysis (requires user's API key) |
| `GET` | `/api/forms/:id/export` | JWT | Export CSV |

### AI Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/ai/chat` | JWT | Streaming SSE chat with conversation history |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Ensure `npm run build` passes
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Bug reports and feature requests: [GitHub Issues](https://github.com/Leafaml/ai-form-report/issues)

---

## 📄 License

MIT License — see [LICENSE](https://opensource.org/licenses/MIT) for details.

---

## 🙏 Acknowledgments

- [DeepSeek](https://www.deepseek.com/) — AI model API
- [Neon](https://neon.tech) — Serverless PostgreSQL
- [lucide](https://lucide.dev/) — Icon library
- [DiceBear](https://www.dicebear.com/) — Avatar generation
- [framer-motion](https://www.framer.com/motion/) — Animation library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
