"use client";

import { useMemo, useState } from "react";
import { TEAMS } from "@/data/matchup";
import { TEAM_GENERALS } from "@/data/generals";
import {
  TROOP_TYPES,
  TROOP_META,
  resolveStandardDeck,
  resolveDeckByGenerals,
  REINFORCEMENTS,
  VERDICT_META,
  type Verdict,
  type TroopType,
} from "@/data/enemy-decks";
import type { EnemyDeck, EnemyArmy } from "@/lib/repositories/types";
import type { NewDeckInput } from "@/hooks/useScoutData";

interface ArmySlotEditorProps {
  index: number; // 0=1군
  army: EnemyArmy;
  decks: EnemyDeck[];
  onChange: (army: EnemyArmy) => void;
  onFindOrCreateDeck: (input: NewDeckInput) => Promise<EnemyDeck | null>;
}

const ARMY_LABELS = ["1군", "2군", "3군", "4군", "5군"];

function parseGenerals(raw: string): string[] {
  return raw
    .split(/[,\s/·]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ArmySlotEditor({
  index,
  army,
  decks,
  onChange,
  onFindOrCreateDeck,
}: ArmySlotEditorProps) {
  // "새 덱 추가" 인라인 폼 표시 여부
  const [adding, setAdding] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckGenerals, setNewDeckGenerals] = useState("");
  const [newDeckVerdict, setNewDeckVerdict] = useState<Verdict>("비등");
  const [busy, setBusy] = useState(false);

  const selectedDeck = decks.find((d) => d.id === army.deckId) || null;

  // 드롭다운 옵션: 기록된 덱 + 아직 없는 표준 덱(가상)
  const deckOptions = useMemo(() => {
    const recordedStd = new Set(decks.filter((d) => d.isStandard).map((d) => d.name));
    const recorded = decks.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.generals.join("·")})${d.isStandard ? " ★" : ""}`,
    }));
    const virtual = TEAMS.filter((t) => !recordedStd.has(t)).map((t) => ({
      value: `std:${t}`,
      label: `${t} (${TEAM_GENERALS[t].join("·")}) ★`,
    }));
    return { recorded, virtual };
  }, [decks]);

  async function handleSelect(value: string) {
    if (value === "__add__") {
      setAdding(true);
      return;
    }
    if (!value) {
      onChange({ ...army, deckId: null });
      return;
    }
    if (value.startsWith("std:")) {
      const teamName = value.slice(4);
      const std = resolveStandardDeck(teamName);
      if (!std) return;
      setBusy(true);
      const deck = await onFindOrCreateDeck({
        name: std,
        generals: TEAM_GENERALS[std],
        isStandard: true,
        manualVerdict: null,
      });
      setBusy(false);
      if (deck) onChange({ ...army, deckId: deck.id });
      return;
    }
    onChange({ ...army, deckId: value });
  }

  const parsed = parseGenerals(newDeckGenerals);
  const detectedStd = resolveStandardDeck(newDeckName) || resolveDeckByGenerals(parsed);

  async function confirmNewDeck() {
    const std = detectedStd;
    const generals = std ? TEAM_GENERALS[std] : parsed;
    if (!std && generals.length !== 3) return;
    setBusy(true);
    const deck = await onFindOrCreateDeck({
      name: (std ?? newDeckName).trim() || newDeckName.trim(),
      generals,
      isStandard: Boolean(std),
      manualVerdict: std ? null : newDeckVerdict,
    });
    setBusy(false);
    if (deck) {
      onChange({ ...army, deckId: deck.id });
      setAdding(false);
      setNewDeckName("");
      setNewDeckGenerals("");
    }
  }

  function setTroop(i: number, t: TroopType | null) {
    const troops = [...army.troops];
    troops[i] = troops[i] === t ? null : t;
    onChange({ ...army, troops });
  }

  const generalsForTroops = selectedDeck?.generals ?? ["무장1", "무장2", "무장3"];

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900">
          {ARMY_LABELS[index]}
        </span>
        {busy && <span className="text-[10px] text-zinc-400">처리 중...</span>}
      </div>

      {/* 덱 선택 */}
      {!adding ? (
        <select
          value={army.deckId ?? ""}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">-- 미확인 (덱 없음) --</option>
          {deckOptions.recorded.length > 0 && (
            <optgroup label="기록된 덱">
              {deckOptions.recorded.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="표준 덱">
            {deckOptions.virtual.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
          <option value="__add__">➕ 새 덱 추가...</option>
        </select>
      ) : (
        <div className="space-y-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
            새 덱 추가 ({ARMY_LABELS[index]})
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
            placeholder="무장 3명 (예: 하후돈,관우,등애)"
            className="w-full px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {detectedStd ? (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              ✓ 표준 덱 &quot;{detectedStd}&quot;로 인식 — 상성 자동 판정
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                커스텀 덱 — 내 1군 기준 상성 지정
              </p>
              <div className="flex gap-1">
                {(Object.keys(VERDICT_META) as Verdict[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNewDeckVerdict(v)}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold border"
                    style={
                      newDeckVerdict === v
                        ? {
                            backgroundColor: VERDICT_META[v].bg,
                            color: VERDICT_META[v].text,
                            borderColor: VERDICT_META[v].bg,
                          }
                        : { borderColor: "transparent" }
                    }
                  >
                    {VERDICT_META[v].emoji}
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={confirmNewDeck}
              disabled={busy}
              className="flex-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
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

      {/* 무장별 병종 */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          병종 (인게임 부대 모양) — 무장별 선택
        </p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[11px] w-14 shrink-0 truncate text-zinc-600 dark:text-zinc-300">
              {generalsForTroops[i] ?? `무장${i + 1}`}
            </span>
            <div className="flex gap-1 flex-wrap">
              {TROOP_TYPES.map((t) => {
                const active = army.troops[i] === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTroop(i, t)}
                    className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                    title={TROOP_META[t].shape}
                  >
                    {TROOP_META[t].emoji}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 군별 강화 단계 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
          강화
        </span>
        <div className="flex gap-1">
          {REINFORCEMENTS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ ...army, reinforcement: r })}
              className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors ${
                army.reinforcement === r
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
