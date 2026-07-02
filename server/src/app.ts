import express from "express";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/error-handler";
import authRouter from "./routes/auth";
import formsRouter from "./routes/forms";
import submissionsRouter from "./routes/submissions";
import analyzeRouter from "./routes/analyze";
import exportRouter from "./routes/export";
import chatRouter from "./routes/chat";
import uploadRouter from "./routes/upload";

const app = express();

app.use(cors());
app.use(express.json());

// 静态文件 — 头像
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 路由
app.use("/api/auth", authRouter);
app.use("/api/forms", formsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/forms", analyzeRouter);
app.use("/api/forms", exportRouter);
app.use("/api/ai", chatRouter);
app.use("/api/upload", uploadRouter);

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.2.0" });
});

// 全局错误处理（必须在路由之后）
app.use(errorHandler);

export default app;
