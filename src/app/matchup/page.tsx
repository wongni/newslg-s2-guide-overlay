"use client";

import { useMemo, useState } from "react";
import {
  TEAMS,
  MATCHUP_MATRIX,
  MATCHUP_META,
  deckUrl,
  type MatchupResult,
  type TeamName,
} from "@/data/matchup";
import { TEAM_GENERALS, canBuildTeam, missingGenerals } from "@/data/generals";
import { useOwnedGenerals } from "@/hooks/useOwnedGenerals";
import { GeneralSelector } from "@/components/GeneralSelector";

function CellContent({ result }: { result: MatchupResult }) {
  const meta = MATCHUP_META[result];
  return (
    <span className="text-xs font-bold leading-none">
      {meta.label}
    </span>
  );
}

// 조합명 + 덱 정보 링크 (클릭 시 새 탭으로 원본 사이트 열기)
function TeamHeaderName({ team }: { team: TeamName }) {
  const url = deckUrl(team);
  if (!url) {
    return <span>{team}</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()} // 하이라이트 토글과 분리
      className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline"
      title={`${team} 덱 정보 보기 (새 탭)`}
    >
      {team}
      <span className="text-[9px] opacity-70">↗</span>
    </a>
  );
}

// 공격 기준 승무패 + 상성 총점 (상성표는 공격 방향으로만 정의됨)
function ScoreBadge({ team }: { team: TeamName }) {
  const idx = TEAMS.indexOf(team);
  let total = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;

  MATCHUP_MATRIX[idx].forEach((r, ci) => {
    if (ci === idx) return; // 자기 자신 제외
    total += MATCHUP_META[r].score;
    if (r === "완승" || r === "우세") wins++;
    else if (r === "비등") draws++;
    else losses++;
  });

  const color =
    total > 0
      ? "text-green-600 dark:text-green-400"
      : total < 0
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-500";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
        {wins}승 {draws}무 {losses}패
      </span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>
        {total > 0 ? `+${total}` : total}
      </span>
    </div>
  );
}

export default function MatchupPage() {
  const [highlightRow, setHighlightRow] = useState<number | null>(null);
  const [highlightCol, setHighlightCol] = useState<number | null>(null);
  const { owned, toggle, setMany, clear } = useOwnedGenerals();
  const [highlightOwned, setHighlightOwned] = useState(true);

  // 보유 장수로 조립 가능한 조합(공격 덱) 집합
  const buildable = useMemo(() => {
    const set = new Set<TeamName>();
    for (const team of TEAMS) {
      if (canBuildTeam(team, owned)) set.add(team);
    }
    return set;
  }, [owned]);

  const buildableCount = buildable.size;
  const showBuildable = highlightOwned && owned.size > 0;

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Page title */}
        <h1 className="text-lg font-bold">⚔️ 조합 상성표</h1>

        {/* 보유 장수 선택 */}
        <GeneralSelector
          owned={owned}
          onToggle={toggle}
          onSetMany={setMany}
          onClear={clear}
        />

        {/* 보유 장수 → 조립 가능 덱 요약 */}
        {owned.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              조립 가능한 공격 덱 {buildableCount}개
            </span>
            {buildableCount > 0 ? (
              <span className="flex flex-wrap gap-1">
                {TEAMS.filter((t) => buildable.has(t)).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium"
                  >
                    {t}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">
                아직 완성 가능한 조합이 없습니다. 장수를 더 선택해 보세요.
              </span>
            )}
            <label className="ml-auto inline-flex items-center gap-1.5 cursor-pointer select-none text-emerald-700 dark:text-emerald-300">
              <input
                type="checkbox"
                checked={highlightOwned}
                onChange={(e) => setHighlightOwned(e.target.checked)}
                className="accent-emerald-600"
              />
              표에서 하이라이트
            </label>
          </div>
        )}

        {/* 범례 */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">상성:</span>
            {(["완승", "우세", "비등", "열세", "완패"] as MatchupResult[]).map((r) => {
              const meta = MATCHUP_META[r];
              return (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: meta.bg, color: meta.text }}
                >
                  {meta.label} ({meta.score > 0 ? `+${meta.score}` : meta.score})
                </span>
              );
            })}
          </div>

          {/* 상성 총점 설명 */}
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
            <p>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                세로(행) 헤더 아래 &quot;○승 ○무 ○패&quot;
              </span>{" "}
              = 해당 조합이 나머지 8개 조합을 <span className="font-bold">공격</span>했을 때 결과 (완승·우세=승, 비등=무, 열세·완패=패)
            </p>
            <p>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                그 아래 숫자 (
                <span className="text-green-600 dark:text-green-400">+N</span> /{" "}
                <span className="text-red-600 dark:text-red-400">-N</span>)
              </span>{" "}
              = 상성 총점. 각 매치업 점수(완승+2, 우세+1, 비등0, 열세-1, 완패-2)의 합.
              <span className="text-green-600 dark:text-green-400"> 높을수록 유리</span>,
              <span className="text-red-600 dark:text-red-400"> 낮을수록 불리</span>합니다.
            </p>
            <p>
              세로(행) 헤더 아래에 표시되며, 각 조합이 <span className="font-bold text-zinc-700 dark:text-zinc-300">공격</span>할 때 기준입니다 (자기 자신 제외).
            </p>
          </div>
        </div>

        {/* 매트릭스 테이블 */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse text-center" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-[2] bg-zinc-100 dark:bg-zinc-900 px-2 py-2 text-xs font-bold border-b-2 border-r-2 border-zinc-400 dark:border-zinc-500 min-w-[72px]">
                  공격 ＼ 방어
                </th>
                {TEAMS.map((team, ci) => (
                  <th
                    key={team}
                    className={`px-1 py-2 text-xs font-bold border-b-2 border-r border-zinc-400 dark:border-zinc-500 min-w-[72px] cursor-pointer transition-colors ${
                      highlightCol === ci
                        ? "bg-amber-100 dark:bg-amber-900/40"
                        : "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                    onClick={() => setHighlightCol(highlightCol === ci ? null : ci)}
                  >
                    <div><TeamHeaderName team={team} /></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAMS.map((attacker, ri) => {
                const isBuildable = showBuildable && buildable.has(attacker);
                const need = TEAM_GENERALS[attacker];
                const missing = missingGenerals(attacker, owned);
                return (
                <tr
                  key={attacker}
                  className={
                    isBuildable ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""
                  }
                >
                  <th
                    className={`sticky left-0 z-[1] px-2 py-2 text-xs font-bold border-r-2 border-b border-zinc-400 dark:border-zinc-500 cursor-pointer transition-colors ${
                      highlightRow === ri
                        ? "bg-amber-100 dark:bg-amber-900/40"
                        : isBuildable
                          ? "bg-emerald-100 dark:bg-emerald-900/40"
                          : "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                    onClick={() => setHighlightRow(highlightRow === ri ? null : ri)}
                    title={
                      showBuildable
                        ? isBuildable
                          ? `조립 가능 · 필요 장수: ${need.join(", ")}`
                          : `부족 장수: ${missing.join(", ")}`
                        : `필요 장수: ${need.join(", ")}`
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isBuildable && (
                        <span
                          className="text-emerald-600 dark:text-emerald-400"
                          aria-label="조립 가능"
                        >
                          ✓
                        </span>
                      )}
                      <TeamHeaderName team={attacker} />
                    </div>
                    <div className="mt-0.5">
                      <ScoreBadge team={attacker} />
                    </div>
                  </th>
                  {MATCHUP_MATRIX[ri].map((result, ci) => {
                    const meta = MATCHUP_META[result];
                    const isHighlighted =
                      highlightRow === ri || highlightCol === ci;
                    const isDiagonal = ri === ci;

                    return (
                      <td
                        key={ci}
                        className={`px-1 py-2 border-b border-r border-black/5 dark:border-white/10 transition-all ${
                          isHighlighted ? "ring-2 ring-amber-400 ring-inset" : ""
                        } ${isDiagonal ? "opacity-60" : ""} ${
                          isBuildable && !isHighlighted
                            ? "ring-1 ring-emerald-400/60 ring-inset"
                            : ""
                        }`}
                        style={{ backgroundColor: meta.bg, color: meta.text }}
                        title={`${attacker}(공) vs ${TEAMS[ci]}(방) = ${meta.label}`}
                      >
                        <CellContent result={result} />
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 읽는 법 안내 */}
        <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <p>• 행(세로) = 공격하는 조합, 열(가로) = 방어하는 조합</p>
          <p>• 행/열 헤더 클릭 시 해당 조합 하이라이트</p>
          <p>
            • <span className="text-emerald-600 dark:text-emerald-400">초록색 ✓</span>{" "}
            = 위에서 선택한 보유 장수로 조립 가능한 공격 덱 (행 헤더에 마우스를 올리면 필요·부족 장수 확인)
          </p>
          <p>
            • 조합명(<span className="text-blue-600 dark:text-blue-400">파란색 ↗</span>)
            클릭 시{" "}
            <a
              href="https://cheonha-deck.xyz/decks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              천하결전 덱 연구소
            </a>
            의 해당 덱 정보(장수·전법·진형)를 새 탭으로 엽니다
          </p>
          <p>• 대각선(자기 자신)은 비등으로 처리하며 승무패·총점 계산에서 제외됩니다</p>
        </div>
      </main>
    </div>
  );
}
