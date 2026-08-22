"use client";

import { useEffect, useState, useCallback } from "react";
import { ARMY_COUNT } from "@/data/enemy-decks";
import type { Reinforcement, TroopType } from "@/data/enemy-decks";

const STORAGE_KEY = "s2-scout-my-decks";

// 내 부대 구성 (1~5군). 소과금 유저는 1군만 채워도 됨.
export interface MyDeck {
  name: string; // 표준 덱 이름/별칭 또는 커스텀
  reinforcement: Reinforcement;
  troops?: (TroopType | null)[]; // 무장 3명 병종 (병종 상성 참고용, 선택)
}

export interface MyDeckSettings {
  decks: (MyDeck | null)[]; // 1군~5군 (길이 = ARMY_COUNT)
}

// 저장/기본 데이터를 항상 ARMY_COUNT 길이로 정규화
function padDecks(decks?: (MyDeck | null)[]): (MyDeck | null)[] {
  return Array.from({ length: ARMY_COUNT }, (_, i) => decks?.[i] ?? null);
}

const DEFAULT: MyDeckSettings = {
  // 초기값: 사용자 기본 (1군 조감초/명함)
  decks: padDecks([{ name: "조감초", reinforcement: "명함" }]),
};

function readStored(): MyDeckSettings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.decks)) {
        // 기존 3군 저장본도 5군으로 패딩해서 호환
        return { decks: padDecks(parsed.decks) };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT;
}

export function useMyDeck(userId?: string | null) {
  const [settings, setSettings] = useState<MyDeckSettings>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const loggedIn = Boolean(userId);

  // 마운트/로그인 상태 변화 시 로드
  useEffect(() => {
    let active = true;

    async function load() {
      if (loggedIn) {
        // 로그인: 백엔드 우선. 없으면 localStorage 값을 올려(마이그레이션) 저장.
        try {
          const res = await fetch("/api/scout/my-deck");
          if (res.ok) {
            const json = (await res.json()) as { settings: MyDeckSettings | null };
            if (!active) return;
            if (json.settings && Array.isArray(json.settings.decks)) {
              setSettings({ decks: padDecks(json.settings.decks) });
            } else {
              // 백엔드에 없음 → 로컬 저장본을 마이그레이션
              const local = readStored();
              setSettings(local);
              void fetch("/api/scout/my-deck", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(local),
              });
            }
          } else {
            // 인증 실패 등 → 로컬로 폴백
            if (active) setSettings(readStored());
          }
        } catch {
          if (active) setSettings(readStored());
        } finally {
          if (active) setHydrated(true);
        }
      } else {
        // 비로그인: localStorage
        if (active) {
          setSettings(readStored());
          setHydrated(true);
        }
      }
    }

    setHydrated(false);
    load();
    return () => {
      active = false;
    };
  }, [loggedIn]);

  // 저장: 로그인 시 백엔드 + 로컬, 비로그인 시 로컬만
  const saveSettings = useCallback(
    (next: MyDeckSettings) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (loggedIn) {
        void fetch("/api/scout/my-deck", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
      }
    },
    [loggedIn]
  );

  const persist = useCallback(
    (next: MyDeckSettings) => {
      setSettings(next);
      saveSettings(next);
    },
    [saveSettings]
  );

  // 특정 군(0=1군 ... ARMY_COUNT-1=마지막군) 설정. deck=null 이면 비활성.
  const setArmy = useCallback(
    (index: number, deck: MyDeck | null) => {
      setSettings((prev) => {
        const decks = padDecks(prev.decks);
        decks[index] = deck;
        const next = { decks };
        saveSettings(next);
        return next;
      });
    },
    [saveSettings]
  );

  return { settings, hydrated, setArmy, persist };
}
