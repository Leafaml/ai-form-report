import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import * as exportService from "../services/export.service";

const router = Router();

// GET /api/forms/:id/export — 导出 CSV（仅所有者）
router.get("/:id/export", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { csv, filename } = await exportService.exportCsv(String(req.params.id), String(req.userId!));
    // UTF-8 BOM 确保 Excel 正确识别中文
    const bom = "﻿";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(bom + csv);
  } catch (err) {
    next(err);
  }
});

export default router;
