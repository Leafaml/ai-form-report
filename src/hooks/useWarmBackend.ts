"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * 页面加载时预热后端（唤醒 Render 休眠实例）
 * 返回 warming 状态，为 true 时后端还没就绪
 */
export function useWarmBackend() {
  const [warming, setWarming] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function warm() {
      try {
        await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
      } catch {
        // 预热失败也继续，不阻塞用户操作
      }
      if (!cancelled) setWarming(false);
    }

    warm();
    return () => { cancelled = true; };
  }, []);

  return warming;
}
