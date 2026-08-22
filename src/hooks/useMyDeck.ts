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

export function useMyDeck() {
  const [settings, setSettings] = useState<MyDeckSettings>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readStored());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: MyDeckSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // 특정 군(0=1군 ... ARMY_COUNT-1=마지막군) 설정. deck=null 이면 비활성.
  const setArmy = useCallback((index: number, deck: MyDeck | null) => {
    setSettings((prev) => {
      const decks = padDecks(prev.decks);
      decks[index] = deck;
      const next = { decks };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { settings, hydrated, setArmy, persist };
}
