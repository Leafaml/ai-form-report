"use client";

import { createContext, useContext, useEffect, useState, createElement, useCallback } from "react";
import { getToken, setToken, clearToken, getProfile } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  deepseekApiKey: string | null;
}

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => void;
  setAuth: (token: string, user: AuthUser) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: () => {},
  setAuth: () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.userId, email: payload.email, nickname: null, avatar: null, deepseekApiKey: null };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始加载
  useEffect(() => {
    const token = getToken();
    if (token) {
      const base = parseJwt(token);
      if (base) {
        setUser(base);
        // 异步拉取完整 profile
        getProfile()
          .then(p => setUser({ id: p.id, email: p.email, nickname: p.nickname, avatar: p.avatar, deepseekApiKey: p.deepseekApiKey }))
          .catch(() => { /* token 过期，不处理 */ });
      } else {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const p = await getProfile();
      setUser({ id: p.id, email: p.email, nickname: p.nickname, avatar: p.avatar, deepseekApiKey: p.deepseekApiKey });
    } catch { /* ignore */ }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const setAuth = useCallback((token: string, u: AuthUser) => {
    setToken(token);
    setUser(u);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, signOut, setAuth, refreshUser } },
    children
  );
}
