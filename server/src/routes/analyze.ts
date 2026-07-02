import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import * as aiService from "../services/ai.service";

const router = Router();

// POST /api/forms/:id/analyze — AI 分析（仅所有者）
router.post("/:id/analyze", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { context } = req.body; // RAG 背景知识（可选）
    const result = await aiService.analyzeForm(String(req.params.id), String(req.userId!), context);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
