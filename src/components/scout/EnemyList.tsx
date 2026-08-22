"use client";

import { useMemo } from "react";
import {
  judgeMatchup,
  VERDICT_META,
  TROOP_META,
  REINFORCEMENT_RANK,
  troopAdvantage,
  type Verdict,
  type Reinforcement,
  type TroopType,
} from "@/data/enemy-decks";
import type { EnemyDeck, EnemyPlayer, EnemyArmy } from "@/lib/repositories/types";
import type { MyDeck } from "@/hooks/useMyDeck";

interface EnemyListProps {
  players: EnemyPlayer[];
  decks: EnemyDeck[];
  myDecks: (MyDeck | null)[]; // 내 부대 [1군~5군]
  filter?: string; // 상단 검색어와 연동 (이름 부분일치)
  onEdit: (player: EnemyPlayer) => void;
  onDeletePlayer: (id: string) => void;
}

const ARMY_LABELS = ["1군", "2군", "3군", "4군", "5군"];

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: meta.bg, color: meta.text }}
      title={meta.advice}
    >
      {meta.emoji} {verdict}
    </span>
  );
}

// 적 군의 병종 조합을 아이콘 문자열로 (예: 🛡️🐎🏹)
function TroopIcons({ troops }: { troops: (TroopType | null)[] }) {
  const known = troops.filter((t): t is TroopType => Boolean(t));
  if (known.length === 0) return <span className="text-[10px] text-zinc-400">병종 미상</span>;
  return (
    <span className="text-xs" title={known.map((t) => TROOP_META[t].shape).join("·")}>
      {troops.map((t, i) => (
        <span key={i}>{t ? TROOP_META[t].emoji : "❔"}</span>
      ))}
    </span>
  );
}

export function EnemyList({
  players,
  decks,
  myDecks,
  filter = "",
  onEdit,
  onDeletePlayer,
}: EnemyListProps) {
  const deckById = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks]);

  const myRank =
    REINFORCEMENT_RANK[(myDecks[0]?.reinforcement as Reinforcement) ?? "명함"];

  const filtered = useMemo(() => {
    const q = filter.trim();
    const sorted = [...players].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    if (!q) return sorted;
    return sorted.filter((p) => p.name.includes(q));
  }, [players, filter]);

  if (players.length === 0) return null;

  return (
    <div className="space-y-3">
      {filtered.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          &quot;{filter}&quot;와 일치하는 기록이 없습니다.
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm truncate">{p.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEdit(p)}
                  className="text-xs text-zinc-400 hover:text-blue-500"
                  title="수정"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDeletePlayer(p.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>

            {p.armies.map((army: EnemyArmy, ai) => {
              const ed = army.deckId ? deckById.get(army.deckId) : undefined;
              const enemyRank = REINFORCEMENT_RANK[army.reinforcement as Reinforcement];
              const stronger = enemyRank > myRank;
              const hasContent = ed || army.troops.some(Boolean);
              if (!hasContent) return null;

              return (
                <div
                  key={ai}
                  className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2 space-y-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {ARMY_LABELS[ai]}
                    </span>
                    <TroopIcons troops={army.troops} />
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        stronger
                          ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}
                      title={stronger ? "내 1군보다 강화 높음 — 주의" : undefined}
                    >
                      {army.reinforcement}
                      {stronger ? " ⚠️" : ""}
                    </span>
                  </div>

                  {ed ? (
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium">{ed.name}</span>{" "}
                        <span className="text-zinc-400">({ed.generals.join("·")})</span>
                        {!ed.isStandard && (
                          <span className="ml-1 text-[10px] text-amber-500">커스텀</span>
                        )}
                      </div>
                      {/* 내 각 군 대비 판정 */}
                      <div className="flex flex-wrap items-center gap-2">
                        {myDecks.map((my, mi) => {
                          if (!my) return null;
                          const outcome = judgeMatchup(
                            my.name,
                            ed.name,
                            ed.manualVerdict ?? undefined
                          );
                          return (
                            <div
                              key={mi}
                              className="flex items-center gap-1"
                              title={outcome.detail}
                            >
                              <span className="text-[10px] text-zinc-400 font-mono">
                                내{ARMY_LABELS[mi]}
                              </span>
                              <VerdictBadge verdict={outcome.verdict} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400">
                      덱 미확인 (병종만 관측됨)
                    </p>
                  )}
                </div>
              );
            })}

            {/* 병종 상성 참고: 내 1군 병종이 있으면 비교 */}
            <TroopReference player={p} myTroops={myDecks[0]?.troops} />

            {p.note && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                💬 {p.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 병종 순환 상성 참고 표시 (내 1군 병종 세팅이 있을 때만)
function TroopReference({
  player,
  myTroops,
}: {
  player: EnemyPlayer;
  myTroops?: (TroopType | null)[];
}) {
  if (!myTroops || !myTroops.some(Boolean)) return null;
  // 적 각 군의 병종과 내 1군 병종을 비교해 우위 개수 요약
  const summaries = player.armies
    .map((army, ai) => {
      const enemyTroops = army.troops.filter((t): t is TroopType => Boolean(t));
      if (enemyTroops.length === 0) return null;
      const mine = myTroops.filter((t): t is TroopType => Boolean(t));
      let win = 0;
      let lose = 0;
      for (const m of mine) {
        for (const e of enemyTroops) {
          const adv = troopAdvantage(m, e);
          if (adv === "우위") win++;
          else if (adv === "불리") lose++;
        }
      }
      return { ai, win, lose };
    })
    .filter((x): x is { ai: number; win: number; lose: number } => Boolean(x));

  if (summaries.length === 0) return null;

  return (
    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
      병종참고(내1군 기준):{" "}
      {summaries.map((s) => (
        <span key={s.ai} className="mr-2">
          {ARMY_LABELS[s.ai]}{" "}
          <span className="text-emerald-500">▲{s.win}</span>/
          <span className="text-red-400">▼{s.lose}</span>
        </span>
      ))}
      <span className="ml-1 opacity-70">(방▶궁▶창▶기▶방)</span>
    </div>
  );
}
