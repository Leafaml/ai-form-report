import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import * as formService from "../services/form.service";
import * as submissionService from "../services/submission.service";

const router = Router();

// GET /api/forms — 我的表单列表
router.get("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const forms = await formService.listForms(req.userId!);
    res.json(forms);
  } catch (err) {
    next(err);
  }
});

// POST /api/forms — 创建表单
router.post("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const form = await formService.createForm(req.userId!, req.body);
    res.status(201).json(form);
  } catch (err) {
    next(err);
  }
});

// GET /api/forms/trash/list — 回收站（必须在 :id 之前）
router.get("/trash/list", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trash = await formService.listTrash(String(req.userId!));
    res.json(trash);
  } catch (err) {
    next(err);
  }
});

// GET /api/forms/:id/results — 查看结果（必须在 /:id 之前）
router.get("/:id/results", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await submissionService.getResults(String(req.params.id), String(req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/forms/:id — 表单详情（公开填写）
router.get("/:id", async (req, res: Response, next: NextFunction) => {
  try {
    const form = await formService.getFormById(String(req.params.id));
    res.json(form);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/forms/:id — 软删除（移入回收站）
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await formService.deleteForm(String(req.params.id), String(req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/forms/:id/restore — 恢复表单
router.post("/:id/restore", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await formService.restoreForm(String(req.params.id), String(req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/forms/:id/permanent — 彻底删除
router.delete("/:id/permanent", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await formService.permanentDelete(String(req.params.id), String(req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
