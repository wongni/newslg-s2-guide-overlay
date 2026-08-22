"use client";

import { useMemo, useState } from "react";
import { TEAMS } from "@/data/matchup";
import { TEAM_GENERALS } from "@/data/generals";
import {
  REINFORCEMENTS,
  resolveStandardDeck,
  resolveDeckByGenerals,
} from "@/data/enemy-decks";
import type { MyDeck } from "@/hooks/useMyDeck";

interface MyArmySlotEditorProps {
  index: number; // 0 = 1군
  deck: MyDeck | null;
  onChange: (deck: MyDeck | null) => void;
}

const ARMY_LABELS = ["1군", "2군", "3군", "4군", "5군"];

function parseGenerals(raw: string): string[] {
  return raw
    .split(/[,\s/·]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// 적 덱 편집기(ArmySlotEditor)와 동일한 룩앤필로 "내 덱"을 구성한다.
// 내 덱은 서버 덱 저장소를 참조하지 않고 이름 문자열만 저장한다.
export function MyArmySlotEditor({ index, deck, onChange }: MyArmySlotEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckGenerals, setNewDeckGenerals] = useState("");

  // 현재 값이 표준 덱 목록에 없는 커스텀 이름인지
  const isCustomSelected = Boolean(
    deck && !(TEAMS as readonly string[]).includes(deck.name)
  );

  const options = useMemo(
    () =>
      TEAMS.map((t) => ({
        value: t,
        label: `${t} (${TEAM_GENERALS[t].join("·")})`,
      })),
    []
  );

  function handleSelect(value: string) {
    if (value === "__add__") {
      setAdding(true);
      return;
    }
    if (!value) {
      onChange(null);
      return;
    }
    onChange({
      name: value,
      reinforcement: deck?.reinforcement ?? "명함",
    });
  }

  const parsed = parseGenerals(newDeckGenerals);
  const detectedStd = resolveStandardDeck(newDeckName) || resolveDeckByGenerals(parsed);

  function confirmNewDeck() {
    // 표준으로 인식되면 표준명으로, 아니면 입력한 커스텀 이름으로 저장
    const name = (detectedStd ?? newDeckName).trim();
    if (!name) return;
    onChange({ name, reinforcement: deck?.reinforcement ?? "명함" });
    setAdding(false);
    setNewDeckName("");
    setNewDeckGenerals("");
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900">
          {ARMY_LABELS[index]}
        </span>
      </div>

      {/* 덱 선택 */}
      {!adding ? (
        <select
          value={isCustomSelected ? "__custom__" : deck?.name ?? ""}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">-- 미사용 --</option>
          {isCustomSelected && (
            <option value="__custom__">{deck!.name} (커스텀)</option>
          )}
          <optgroup label="표준 덱">
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
          <option value="__add__">➕ 커스텀 덱 추가...</option>
        </select>
      ) : (
        <div className="space-y-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
            커스텀 덱 추가 ({ARMY_LABELS[index]})
          </p>
          <input
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="덱 이름 (예: 하관등, 조감초)"
            className="w-full px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={newDeckGenerals}
            onChange={(e) => setNewDeckGenerals(e.target.value)}
            placeholder="무장 3명 (선택, 예: 하후돈,관우,등애)"
            className="w-full px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {detectedStd ? (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              ✓ 표준 덱 &quot;{detectedStd}&quot;로 인식 — 상성 자동 판정
            </p>
          ) : (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              커스텀 덱 — 이름만 기록됩니다 (표준 덱만 상성 자동 판정)
            </p>
          )}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={confirmNewDeck}
              className="flex-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-2 py-1 rounded-lg text-xs bg-zinc-200 dark:bg-zinc-700"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 강화 단계 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
          강화
        </span>
        <div className="flex gap-1">
          {REINFORCEMENTS.map((r) => (
            <button
              key={r}
              type="button"
              disabled={!deck}
              onClick={() => deck && onChange({ ...deck, reinforcement: r })}
              className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors disabled:opacity-40 ${
                deck?.reinforcement === r
                  ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
