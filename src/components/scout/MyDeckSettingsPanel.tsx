"use client";

import { useState } from "react";
import { TEAMS } from "@/data/matchup";
import { REINFORCEMENTS, ARMY_COUNT } from "@/data/enemy-decks";
import type { MyDeck, MyDeckSettings } from "@/hooks/useMyDeck";

interface MyDeckSettingsPanelProps {
  settings: MyDeckSettings;
  onSetArmy: (index: number, deck: MyDeck | null) => void;
}

const ARMY_LABELS = ["1군", "2군", "3군", "4군", "5군"];

export function MyDeckSettingsPanel({
  settings,
  onSetArmy,
}: MyDeckSettingsPanelProps) {
  const [open, setOpen] = useState(false);

  const activeArmies = settings.decks.filter(Boolean).length;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <span className="text-sm font-bold flex items-center gap-1.5">
          <span>🎖️</span> 내 부대 설정
          <span className="text-xs font-normal text-zinc-400">
            ({settings.decks
              .map((d, i) => (d ? `${ARMY_LABELS[i]} ${d.name}` : null))
              .filter(Boolean)
              .join(", ") || "미설정"})
          </span>
        </span>
        <span
          className="text-zinc-400 text-xs transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
            운용 중인 군만 설정하세요. 소과금이면 1군만 채워도 됩니다. 설정은 이
            브라우저에 저장됩니다.
          </p>
          {Array.from({ length: ARMY_COUNT }, (_, i) => {
            const idx = i;
            const deck = settings.decks[idx];
            return (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
              >
                <span className="text-xs font-bold w-8 text-zinc-600 dark:text-zinc-300">
                  {ARMY_LABELS[i]}
                </span>
                <select
                  value={deck?.name ?? ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    if (!name) {
                      onSetArmy(idx, null);
                    } else {
                      onSetArmy(idx, {
                        name,
                        reinforcement: deck?.reinforcement ?? "명함",
                      });
                    }
                  }}
                  className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- 미사용 --</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={deck?.reinforcement ?? "명함"}
                  disabled={!deck}
                  onChange={(e) =>
                    deck &&
                    onSetArmy(idx, {
                      name: deck.name,
                      reinforcement: e.target.value as MyDeck["reinforcement"],
                    })
                  }
                  className="px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {REINFORCEMENTS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {activeArmies === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              최소 1개 군을 설정해야 상성 판정이 표시됩니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
