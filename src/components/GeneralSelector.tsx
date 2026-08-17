"use client";

import { useMemo, useState } from "react";
import {
  FACTIONS,
  GENERALS_BY_FACTION,
  type Faction,
} from "@/data/generals";

interface GeneralSelectorProps {
  owned: ReadonlySet<string>;
  onToggle: (general: string) => void;
  onSetMany: (generals: string[], value: boolean) => void;
  onClear: () => void;
}

export function GeneralSelector({
  owned,
  onToggle,
  onSetMany,
  onClear,
}: GeneralSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const q = query.trim();

  const totalOwned = owned.size;

  const filtered = useMemo<Record<Faction, string[]>>(() => {
    const result = {} as Record<Faction, string[]>;
    for (const f of FACTIONS) {
      result[f] = q
        ? GENERALS_BY_FACTION[f].filter((g) => g.includes(q))
        : GENERALS_BY_FACTION[f];
    }
    return result;
  }, [q]);

  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <span aria-hidden>🎖️</span>
          보유 장수 선택
          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-mono">
            {totalOwned}
          </span>
        </span>
        <span
          className="text-zinc-400 text-xs transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-3">
            보유한 장수를 선택하면 아래 상성표에서 조립 가능한{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              공격 덱
            </span>
            이 하이라이트됩니다. 선택은 이 브라우저에 자동 저장됩니다.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="장수 이름 검색"
              className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={onClear}
              disabled={totalOwned === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              전체 해제
            </button>
          </div>

          <div className="space-y-3">
            {FACTIONS.map((faction) => {
              const list = filtered[faction];
              if (list.length === 0) return null;
              const all = GENERALS_BY_FACTION[faction];
              const ownedCount = all.filter((g) => owned.has(g)).length;
              const allSelected = ownedCount === all.length;
              return (
                <div key={faction}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {faction}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {ownedCount}/{all.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSetMany(all, !allSelected)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                    >
                      {allSelected ? "해제" : "전체"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((g) => {
                      const isOwned = owned.has(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={isOwned}
                          onClick={() => onToggle(g)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            isOwned
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
