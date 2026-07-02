import { Router, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const UPLOAD_DIR = path.join(__dirname, "../../uploads/avatars");

// 确保目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req: AuthRequest, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `avatar-${req.userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 JPG/PNG/GIF/WebP 格式"));
    }
  },
});

const router = Router();

// POST /api/upload/avatar — 上传头像
router.post(
  "/avatar",
  requireAuth,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "文件大小不能超过 2MB" });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "请选择文件" });
        return;
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // 更新用户头像
      await prisma.user.update({
        where: { id: String(req.userId!) },
        data: { avatar: avatarUrl },
      });

      // 删除旧头像（跳过默认的 DiceBear URL）
      // 旧文件清理可延后实现

      res.json({ avatar: avatarUrl });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
