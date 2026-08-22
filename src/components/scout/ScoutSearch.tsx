"use client";

import { useMemo, useState } from "react";
import type { EnemyPlayer } from "@/lib/repositories/types";

interface ScoutSearchProps {
  players: EnemyPlayer[];
  onSelectExisting: (player: EnemyPlayer) => void;
  onAddNew: (name: string) => void;
  onQueryChange?: (query: string) => void;
}

// 최상단 검색: 이름 입력/선택 → 기존 적이면 선택, 새 이름이면 추가 유도
export function ScoutSearch({
  players,
  onSelectExisting,
  onAddNew,
  onQueryChange,
}: ScoutSearchProps) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  function updateQuery(next: string) {
    setQuery(next);
    onQueryChange?.(next.trim());
  }

  const matches = useMemo(() => {
    if (!q) return [] as EnemyPlayer[];
    return players.filter((p) => p.name.includes(q)).slice(0, 8);
  }, [players, q]);

  const exactMatch = players.find((p) => p.name === q);
  const isNewName = q.length > 0 && !exactMatch;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <h2 className="text-sm font-bold flex items-center gap-1.5">
        <span>🔍</span> 적 검색
      </h2>

      <input
        value={query}
        onChange={(e) => updateQuery(e.target.value)}
        placeholder="적 이름 입력 또는 선택"
        className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* 매칭되는 기존 적 목록 */}
      {matches.length > 0 && (
        <div className="space-y-1">
          {matches.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelectExisting(p);
                updateQuery(p.name);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-[10px] text-zinc-400">
                {p.armies.filter((a) => a.deckId).length}개 군 기록됨
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 새 이름이면 추가 유도 */}
      {isNewName && (
        <button
          onClick={() => {
            onAddNew(q);
            updateQuery("");
          }}
          className="w-full px-3 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          ➕ &quot;{q}&quot; 새 적으로 추가
        </button>
      )}

      {!q && players.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          아직 기록된 적이 없습니다. 이름을 입력해 첫 적을 추가하세요.
        </p>
      )}
    </section>
  );
}
