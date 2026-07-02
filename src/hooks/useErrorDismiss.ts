"use client";

import { useState, useEffect } from "react";

/**
 * 错误状态 hook —— 错误信息 5 秒后自动清除
 */
export function useErrorDismiss(duration = 5000) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), duration);
    return () => clearTimeout(timer);
  }, [error, duration]);

  return [error, setError] as const;
}
