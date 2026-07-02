import { Router, Request, Response, NextFunction } from "express";
import * as submissionService from "../services/submission.service";

const router = Router();

// POST /api/submissions — 提交答卷（公开）
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submission = await submissionService.submit(req.body);
    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
});

export default router;
