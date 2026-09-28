"use client";

import { useMemo, useState } from "react";
import type { Reinforcement } from "@/data/enemy-decks";
import type { EnemyPlayer } from "@/lib/repositories/types";

/**
 * 돌파 등급별 위협 가중치.
 * 상위 등급 1부대가 하위 등급 여러 부대보다 항상 가치가 높도록 배분.
 * (고돌파 1 = 20점 > 저돌파 5 = 5점, 중돌파 4 = 20점)
 * 정렬 시 총점이 같으면 상위 등급 보유 수로 tie-break 하므로
 * "고돌파 1부대 > 저돌파 N부대"가 항상 보장된다.
 */
const THREAT_WEIGHT: Record<Reinforcement, number> = {
  명함: 0,
  저돌파: 1,
  중돌파: 5,
  고돌파: 20,
};

/** 랭킹 순위별 메달/색상. */
const RANK_STYLE: { medal: string; badge: string }[] = [
  { medal: "🥇", badge: "bg-amber-400 text-amber-950" },
  { medal: "🥈", badge: "bg-zinc-300 text-zinc-800" },
  { medal: "🥉", badge: "bg-orange-400 text-orange-950" },
];

/** 돌파 등급별 뱃지 색상 (표시용). */
const REINFORCEMENT_BADGE: Record<Reinforcement, string> = {
  명함: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
  저돌파: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  중돌파: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  고돌파: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

interface ThreatEntry {
  player: EnemyPlayer;
  score: number;
  /** 돌파 등급별 부대 수 (명함 제외 표시용). */
  counts: Record<Reinforcement, number>;
}

interface ThreatRankingProps {
  players: EnemyPlayer[];
  /** 이름 클릭 시 상단 검색어로 연동 (선택). */
  onSelect?: (name: string) => void;
}

export function ThreatRanking({ players, onSelect }: ThreatRankingProps) {
  const [open, setOpen] = useState(true);

  const ranking = useMemo<ThreatEntry[]>(() => {
    const entries = players.map((player) => {
      const counts: Record<Reinforcement, number> = {
        명함: 0,
        저돌파: 0,
        중돌파: 0,
        고돌파: 0,
      };
      let score = 0;
      for (const army of player.armies) {
        // 실제 편성된 군만 집계 (덱 또는 병종이 확인된 슬롯).
        const hasContent = army.deckId || army.troops.some(Boolean);
        if (!hasContent) continue;
        const r = army.reinforcement as Reinforcement;
        if (counts[r] === undefined) continue;
        counts[r] += 1;
        score += THREAT_WEIGHT[r] ?? 0;
      }
      return { player, score, counts };
    });

    return entries
      .filter((e) => e.score > 0)
      .sort((a, b) => {
        // 1차: 총 위협 점수
        if (b.score !== a.score) return b.score - a.score;
        // tie-break: 상위 등급 보유 수 (고돌파 → 중돌파 → 저돌파)
        if (b.counts.고돌파 !== a.counts.고돌파)
          return b.counts.고돌파 - a.counts.고돌파;
        if (b.counts.중돌파 !== a.counts.중돌파)
          return b.counts.중돌파 - a.counts.중돌파;
        if (b.counts.저돌파 !== a.counts.저돌파)
          return b.counts.저돌파 - a.counts.저돌파;
        return a.player.name.localeCompare(b.player.name);
      })
      .slice(0, 10);
  }, [players]);

  if (ranking.length === 0) return null;

  const maxScore = ranking[0].score;
  // 표시할 돌파 등급 (명함 제외, 높은 등급부터).
  const shownGrades: Reinforcement[] = ["고돌파", "중돌파", "저돌파"];

  return (
    <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-red-800 dark:text-red-300 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors"
      >
        <span>⚠️ 요주의 랭킹 · 고돌파 부대 TOP 10</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5">
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug">
            돌파 등급별 위협 점수(고돌파 {THREAT_WEIGHT.고돌파} · 중돌파{" "}
            {THREAT_WEIGHT.중돌파} · 저돌파 {THREAT_WEIGHT.저돌파})를 합산해
            정렬합니다. 고돌파 1부대가 저돌파 여러 부대보다 위험합니다.
          </p>

          <ol className="space-y-1.5">
            {ranking.map((entry, i) => {
              const rankStyle = RANK_STYLE[i];
              const barPercent =
                maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;
              return (
                <li
                  key={entry.player.id}
                  className="flex items-center gap-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1.5"
                >
                  {/* 순위 */}
                  <span
                    className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                      rankStyle
                        ? rankStyle.badge
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {rankStyle ? rankStyle.medal : i + 1}
                  </span>

                  {/* 이름 + 점수 바 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <button
                        onClick={() => onSelect?.(entry.player.name)}
                        className="font-semibold text-sm truncate text-left hover:text-red-600 dark:hover:text-red-400 hover:underline"
                        title={onSelect ? "목록에서 찾기" : undefined}
                      >
                        {entry.player.name}
                      </button>
                      <span className="shrink-0 text-xs font-mono font-bold text-red-600 dark:text-red-400">
                        {entry.score}점
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 돌파 등급별 부대 수 */}
                  <div className="shrink-0 flex items-center gap-1">
                    {shownGrades.map((g) =>
                      entry.counts[g] > 0 ? (
                        <span
                          key={g}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${REINFORCEMENT_BADGE[g]}`}
                          title={`${g} ${entry.counts[g]}부대`}
                        >
                          {g.replace("돌파", "")}×{entry.counts[g]}
                        </span>
                      ) : null
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
