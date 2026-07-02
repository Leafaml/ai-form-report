import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import * as authService from "../services/auth.service";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify
router.post("/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyEmail(email, code);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend
router.post("/resend", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const result = await authService.resendCode(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — 获取当前用户
router.get("/me", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(String(req.userId!));
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile — 更新个人资料
router.put("/profile", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.updateProfile(String(req.userId!), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password — 修改密码
router.put("/password", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(String(req.userId!), oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
