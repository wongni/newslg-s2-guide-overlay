"use client";

import { useState } from "react";
import { ARMY_COUNT } from "@/data/enemy-decks";
import { MyArmySlotEditor } from "./MyArmySlotEditor";
import type { MyDeck, MyDeckSettings } from "@/hooks/useMyDeck";

interface MyDeckSettingsPanelProps {
  settings: MyDeckSettings;
  onSetArmy: (index: number, deck: MyDeck | null) => void;
  loggedIn?: boolean;
}

const ARMY_LABELS = ["1군", "2군", "3군", "4군", "5군"];

export function MyDeckSettingsPanel({
  settings,
  onSetArmy,
  loggedIn = false,
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
            운용 중인 군만 설정하세요. 소과금이면 1군만 채워도 됩니다.{" "}
            {loggedIn
              ? "설정은 계정에 저장되어 어느 기기에서나 동일하게 불러옵니다."
              : "설정은 이 브라우저에 저장됩니다. 로그인하면 계정에 저장됩니다."}
          </p>
          {Array.from({ length: ARMY_COUNT }, (_, i) => (
            <MyArmySlotEditor
              key={i}
              index={i}
              deck={settings.decks[i] ?? null}
              onChange={(d) => onSetArmy(i, d)}
            />
          ))}
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
