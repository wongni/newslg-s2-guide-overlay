"use client";

import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  nickname: string;
  server?: string;
  alliance?: string;
  role: "user" | "admin";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser(normalizeUser(data.user));
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: { nickname?: string; server?: string; alliance?: string }) => {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "프로필 업데이트에 실패했습니다.");
      }
      const updated = normalizeUser(result.user);
      setUser(updated);
      return updated;
    },
    []
  );

  return { user, loading, login, logout, updateProfile };
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    email: raw.email as string,
    nickname: raw.nickname as string,
    server: (raw.server as string) || undefined,
    alliance: (raw.alliance as string) || undefined,
    role: (raw.role as "user" | "admin") || "user",
  };
}
