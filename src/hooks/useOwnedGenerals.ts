"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "s2-guide-owned-generals";
const CHANNEL_NAME = "s2-guide-owned-generals";

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    }
  } catch {
    // 파싱 오류 무시
  }
  return [];
}

/**
 * 보유 장수 선택을 브라우저(localStorage)에 저장하고,
 * 같은 브라우저의 다른 탭/오버레이와 BroadcastChannel로 동기화합니다.
 */
export function useOwnedGenerals() {
  // SSR/CSR 하이드레이션 불일치를 피하기 위해 빈 집합으로 시작하고,
  // 마운트 후 localStorage 값으로 채웁니다.
  const [owned, setOwned] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  // 최초 마운트 시 localStorage에서 로드 (외부 시스템과 동기화)
  useEffect(() => {
    const stored = readStored();
    if (stored.length > 0) {
      setOwned(new Set(stored));
    }
    setHydrated(true);
  }, []);

  // 탭 간 동기화
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        const data: string[] = event.data;
        if (Array.isArray(data)) {
          setOwned(new Set(data));
        }
      };
    } catch {
      // BroadcastChannel 미지원 환경 무시
    }
    return () => channel?.close();
  }, []);

  const persist = useCallback((next: Set<string>) => {
    const arr = Array.from(next).sort();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // 저장 실패 무시
    }
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(arr);
      channel.close();
    } catch {
      // BroadcastChannel 미지원 환경 무시
    }
  }, []);

  const toggle = useCallback(
    (general: string) => {
      setOwned((prev) => {
        const next = new Set(prev);
        if (next.has(general)) {
          next.delete(general);
        } else {
          next.add(general);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setMany = useCallback(
    (generals: string[], value: boolean) => {
      setOwned((prev) => {
        const next = new Set(prev);
        for (const g of generals) {
          if (value) next.add(g);
          else next.delete(g);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clear = useCallback(() => {
    setOwned(new Set());
    persist(new Set());
  }, [persist]);

  return { owned, hydrated, toggle, setMany, clear };
}
