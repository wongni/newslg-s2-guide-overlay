"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ScoutData,
  EnemyDeck,
  EnemyPlayer,
  EnemyArmy,
  ScoutVerdict,
} from "@/lib/repositories/types";

export interface NewDeckInput {
  name: string;
  generals: string[];
  isStandard: boolean;
  manualVerdict?: ScoutVerdict | null;
}

export interface NewPlayerInput {
  name: string;
  alliance?: string;
  armies: EnemyArmy[];
  note?: string;
}

export function useScoutData(authorized: boolean) {
  const [data, setData] = useState<ScoutData>({ decks: [], players: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scout/data");
      if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
      const json = (await res.json()) as ScoutData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  useEffect(() => {
    reload();
  }, [reload]);

  const findOrCreateDeck = useCallback(
    async (input: NewDeckInput): Promise<EnemyDeck | null> => {
      const res = await fetch("/api/scout/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return null;
      const deck = (await res.json()) as EnemyDeck;
      await reload();
      return deck;
    },
    [reload]
  );

  const updateDeck = useCallback(
    async (id: string, patch: Partial<NewDeckInput>): Promise<boolean> => {
      const res = await fetch(`/api/scout/decks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) await reload();
      return res.ok;
    },
    [reload]
  );

  const deleteDeck = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/scout/decks/${id}`, { method: "DELETE" });
      if (res.ok) await reload();
      return res.ok;
    },
    [reload]
  );

  const createPlayer = useCallback(
    async (input: NewPlayerInput): Promise<EnemyPlayer | null> => {
      const res = await fetch("/api/scout/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return null;
      const player = (await res.json()) as EnemyPlayer;
      await reload();
      return player;
    },
    [reload]
  );

  const updatePlayer = useCallback(
    async (id: string, patch: Partial<NewPlayerInput>): Promise<boolean> => {
      const res = await fetch(`/api/scout/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) await reload();
      return res.ok;
    },
    [reload]
  );

  const deletePlayer = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/scout/players/${id}`, { method: "DELETE" });
      if (res.ok) await reload();
      return res.ok;
    },
    [reload]
  );

  return {
    data,
    loading,
    error,
    reload,
    findOrCreateDeck,
    updateDeck,
    deleteDeck,
    createPlayer,
    updatePlayer,
    deletePlayer,
  };
}
