import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Prisma 常见错误
  if (err.constructor?.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as { code?: string; meta?: unknown };
    if (prismaErr.code === "P2025") {
      res.status(404).json({ error: "资源不存在" });
      return;
    }
    if (prismaErr.code === "P2002") {
      res.status(409).json({ error: "数据已存在，请检查唯一字段" });
      return;
    }
  }

  console.error("[unhandled]", err);
  res.status(500).json({ error: "服务器内部错误" });
}
