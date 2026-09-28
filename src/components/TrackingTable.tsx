"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { TrackingData, TrackingRow, TrackingUnitState } from "@/types/tracking";

const DEFAULT_STORAGE_KEY = "s3-pioneer-tracking-progress";

const UNIT_LABELS = ["개척1", "개척2", "개척3"];

const ACTION_STYLES: Record<string, string> = {
  개간: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  점령: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  소탕: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  둔전: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  편성: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  회복: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "퇴진/편성": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  퇴진: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  교체: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  완료: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  한도증가: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  대기: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  기타: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function fmtLevel(lv?: number): string {
  if (lv === undefined) return "-";
  // 정수면 소수점 없이, 아니면 소수 둘째 자리까지
  return Number.isInteger(lv) ? String(lv) : lv.toFixed(2);
}

function fmtHp(hp?: number): string {
  return hp === undefined ? "-" : String(hp);
}

function fmtChicken(chicken?: number | string): string {
  if (chicken === undefined) return "-";
  return String(chicken);
}

/** "2장 완료", "6장·번영도 4500" 등에서 기준 챕터("2장","6장")를 추출해 그룹 경계 판단에 사용. */
function baseChapter(chapter: string): string {
  const m = chapter.match(/^\d+장/);
  if (m) return m[0];
  return chapter;
}

/** 파싱된 토지 항목: 레벨별 개수. */
interface LandEntry {
  level: string; // "3", "?" 등
  count: string; // "4", "?" 등
}

/**
 * 현황 문자열을 파싱.
 * 예: "Lv5×9, Lv3x1 (10/10)" → entries=[{5,9},{3,1}], capacity="10/10"
 *     "(0/10)" → entries=[], capacity="0/10"
 * ×/x, 공백 표기 혼용을 모두 처리.
 */
function parseLandStatus(raw: string): { entries: LandEntry[]; capacity?: string } {
  // 말미의 (사용/한도) 추출
  const capMatch = raw.match(/\(([^()]*)\)\s*$/);
  const capacity = capMatch ? capMatch[1] : undefined;
  const body = capMatch ? raw.slice(0, capMatch.index).trim() : raw.trim();

  const entries: LandEntry[] = [];
  // LvN×M / LvN xM / LvN×? 형태 매칭
  const re = /Lv\s*([0-9?]+)\s*[×xX]\s*([0-9?]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    entries.push({ level: m[1], count: m[2] });
  }
  return { entries, capacity };
}

/** 레벨 값 → 색상 클래스 (레벨 높을수록 진한 색으로 구분). */
function levelColor(level: string): string {
  const n = parseInt(level, 10);
  if (Number.isNaN(n))
    return "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300";
  if (n <= 2) return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
  if (n === 3) return "bg-lime-200 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300";
  if (n === 4) return "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
  if (n === 5) return "bg-teal-200 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300";
  if (n === 6) return "bg-sky-200 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300";
  if (n === 7) return "bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
  if (n === 8) return "bg-indigo-200 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
  if (n === 9) return "bg-violet-200 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300";
  return "bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300";
}

/** 70% 도전 효율(직전 Lv 100% 대비 %)에 따른 뱃지 색상. 100% 이하는 손해(경고). */
function efficiencyStyle(ratio: number): string {
  if (ratio >= 130)
    return "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white";
  if (ratio >= 120)
    return "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
  if (ratio > 100)
    return "bg-lime-200 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300";
  // 100% 이하: 손해 → 붉은색 경고
  return "bg-red-500 text-white dark:bg-red-600 dark:text-white";
}

/** 토지 현황을 레벨 뱃지 + 개수로 렌더링. (사용/한도)는 표시하지 않음.
 *  inline=true면 가로로 배열(모바일 카드용), 기본은 세로 스택(데스크톱 표용). */
function LandStatus({ raw, inline = false }: { raw?: string; inline?: boolean }) {
  if (!raw) return <span className="text-zinc-300 dark:text-zinc-600">-</span>;
  const { entries } = parseLandStatus(raw);
  if (entries.length === 0) {
    // 레벨 항목이 없는 상태(예: "(0/10)")는 대시로 표시
    return <span className="text-zinc-300 dark:text-zinc-600">-</span>;
  }
  return (
    <span
      className={
        inline
          ? "inline-flex flex-wrap items-center gap-1"
          : "inline-flex flex-col items-start gap-0.5"
      }
    >
      {entries.map((e, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded overflow-hidden text-[11px] font-mono"
          title={`${e.level}레벨 ${e.count}개`}
        >
          <span className={`px-1.5 py-0.5 font-bold ${levelColor(e.level)}`}>
            {e.level}
          </span>
          <span className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            ×{e.count}
          </span>
        </span>
      ))}
    </span>
  );
}

/** 부대 표기(개척1/2/3/4)에 색을 입혀 반환. 없으면 null. */
const UNIT_TAG_STYLE: Record<string, string> = {
  개척1: "text-rose-600 dark:text-rose-400",
  개척2: "text-amber-600 dark:text-amber-400",
  개척3: "text-sky-600 dark:text-sky-400",
  개척4: "text-violet-600 dark:text-violet-400",
  "개척3/4": "text-violet-600 dark:text-violet-400",
};

/** 대상/현황 텍스트에서 키워드를 이모지로 치환 (앞에 아이콘 부착, 단어는 유지). */
const ICON_MAP: [RegExp, string][] = [
  // 텍스트를 이모지로 완전 대체 (긴 표현부터 먼저 매칭)
  [/개간지 한도/g, "🌾"],
  [/영지 한도/g, "🏯"],
  [/닭다리/g, "🍗"],
  // 접두어형: 이모지 + 텍스트 유지
  [/건물/g, "🏗️\u200a건물"],
  [/자원/g, "📦\u200a자원"],
];

function iconizeText(text: string): string {
  let out = text;
  for (const [re, rep] of ICON_MAP) out = out.replace(re, rep);
  return out;
}

/**
 * 텍스트 세그먼트를 렌더링: 이모지 치환 후 "개척N" 표기를 부대 색상 스팬으로 감싼다.
 */
function renderTextSegment(text: string, keyBase: string): ReactNode {
  const withIcons = iconizeText(text);
  const parts: ReactNode[] = [];
  const re = /개척[0-9]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(withIcons)) !== null) {
    if (m.index > last) parts.push(withIcons.slice(last, m.index));
    const tag = m[0];
    parts.push(
      <span
        key={`${keyBase}-u${k++}`}
        className={`font-semibold ${
          UNIT_TAG_STYLE[tag] ?? "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {tag}
      </span>
    );
    last = re.lastIndex;
  }
  if (last < withIcons.length) parts.push(withIcons.slice(last));
  return parts.length > 0 ? parts : withIcons;
}

/** 대상 문자열에서 말미의 "(개척N)" 태그를 추출. */
function extractUnitTag(raw?: string): { unitTag?: string; body: string } {
  if (!raw) return { body: "" };
  const unitMatch = raw.match(/\((개척[0-9/]+)\)\s*$/);
  if (unitMatch) {
    return { unitTag: unitMatch[1], body: raw.slice(0, unitMatch.index).trim() };
  }
  return { body: raw.trim() };
}

/** 부대 태그 뱃지(개척1/2/3/4). */
function UnitTag({ tag }: { tag: string }) {
  return (
    <span
      className={`text-[10px] font-semibold whitespace-nowrap ${
        UNIT_TAG_STYLE[tag] ?? "text-zinc-500 dark:text-zinc-400"
      }`}
    >
      {tag}
    </span>
  );
}

/**
 * 대상 문자열을 렌더링. "LvN ×M" 토큰은 레벨 뱃지로, 나머지 텍스트는 그대로 표시.
 * "(개척N)" 부대 태그는 행동 컬럼으로 이동했으므로 여기서는 제거.
 * 예: "외성 Lv3 ×1 (개척2)" → [🏰 외성] [3 ×1]
 */
function TargetCell({ raw }: { raw?: string }) {
  if (!raw) return <span className="text-zinc-300 dark:text-zinc-600">-</span>;

  const { body } = extractUnitTag(raw);

  // "LvN ×M" 또는 "LvN xM" 토큰을 뱃지로 치환하기 위해 조각으로 분해
  const parts: ReactNode[] = [];
  const re = /Lv\s*([0-9?]+)\s*[×xX]\s*([0-9?]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(body)) !== null) {
    if (m.index > lastIndex) {
      const pre = body.slice(lastIndex, m.index).trim();
      if (pre) parts.push(<span key={key++}>{renderTextSegment(pre, `p${key}`)} </span>);
    }
    parts.push(
      <span
        key={key++}
        className="inline-flex items-center rounded overflow-hidden text-[11px] font-mono align-middle"
        title={`${m[1]}레벨 ${m[2]}개`}
      >
        <span className={`px-1.5 py-0.5 font-bold ${levelColor(m[1])}`}>{m[1]}</span>
        <span className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          ×{m[2]}
        </span>
      </span>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < body.length) {
    const rest = body.slice(lastIndex).trim();
    if (rest) parts.push(<span key={key++}> {renderTextSegment(rest, `r${key}`)}</span>);
  }

  return (
    <span className="inline-flex flex-nowrap items-center gap-1 whitespace-nowrap">
      {parts.length > 0 ? parts : <span>{renderTextSegment(body, "b")}</span>}
    </span>
  );
}

/** 트래킹 진행 상태(체크) 저장 훅 — 가이드 진행과 분리된 별도 키 사용. */
function useTrackingProgress(storageKey: string) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setCompleted(new Set(JSON.parse(stored) as number[]));
      else setCompleted(new Set());
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(storageKey);
    channel.onmessage = (e) => setCompleted(new Set(e.data as number[]));
    return () => channel.close();
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<number>) => {
      const arr = Array.from(next).sort((a, b) => a - b);
      localStorage.setItem(storageKey, JSON.stringify(arr));
      try {
        const channel = new BroadcastChannel(storageKey);
        channel.postMessage(arr);
        channel.close();
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const toggle = useCallback(
    (index: number) => {
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    setCompleted(new Set());
    persist(new Set());
  }, [persist]);

  return { completed, toggle, reset };
}

function UnitCell({
  unit,
  stacked = false,
}: {
  unit: TrackingUnitState;
  stacked?: boolean;
}) {
  const hasChange = unit.lv !== undefined || unit.hp !== undefined;
  if (!hasChange) return <span className="text-zinc-300 dark:text-zinc-600">-</span>;
  if (stacked) {
    return (
      <span className="inline-flex flex-col items-center leading-tight font-mono">
        <span className="font-bold">{fmtLevel(unit.lv)}</span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {fmtHp(unit.hp)}
        </span>
      </span>
    );
  }
  return (
    <span className="font-mono">
      <span className="font-bold">{fmtLevel(unit.lv)}</span>
      <span className="text-zinc-400 dark:text-zinc-500"> / </span>
      <span className="text-zinc-600 dark:text-zinc-400">{fmtHp(unit.hp)}</span>
    </span>
  );
}

function ActionBadge({ action }: { action: TrackingRow["action"] }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
        ACTION_STYLES[action] ?? ACTION_STYLES.기타
      }`}
    >
      {action}
    </span>
  );
}

export function TrackingTable({
  data,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  data: TrackingData;
  storageKey?: string;
}) {
  const { completed, toggle, reset } = useTrackingProgress(storageKey);
  const [expOpen, setExpOpen] = useState(false);

  const total = data.rows.length;
  const doneCount = completed.size;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* 제목 */}
        <div>
          <h1 className="text-lg font-bold">🧭 {data.title}</h1>
        </div>

        {/* 개요 · 알아두기 */}
        {data.intro.length > 0 && (
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-semibold mb-1.5">📌 알아두기</div>
            <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
              {data.intro.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 준비 과정 */}
        {data.prep && data.prep.length > 0 && (
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-semibold mb-2">🧰 준비 과정</div>
            <ol className="list-decimal list-inside text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
              {data.prep.map((section, i) => (
                <li key={i} className="font-medium">
                  {section.heading}
                  {section.items.length > 0 && (
                    <ul className="list-disc list-inside font-normal text-zinc-600 dark:text-zinc-400 ml-4 mt-0.5 space-y-0.5">
                      {section.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 토지 레벨별 경험치 표 */}
        {data.landExp && data.landExp.length > 0 && (
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-semibold mb-2">⚔️ 토지 레벨별 경험치</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-2 py-1.5 whitespace-nowrap">토지 Lv</th>
                    <th className="px-2 py-1.5 whitespace-nowrap">100% 최소 부대 Lv</th>
                    <th className="px-2 py-1.5 whitespace-nowrap">수비군 Lv</th>
                    <th className="px-2 py-1.5 whitespace-nowrap text-right">경험치 (100%)</th>
                    <th className="px-2 py-1.5 whitespace-nowrap text-right">경험치 (70%)</th>
                    <th className="px-2 py-1.5 whitespace-nowrap text-right">70% vs 직전 Lv 100%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.landExp.map((e, idx) => {
                    const exp70 = Math.round(e.exp * 0.7);
                    const prev = idx > 0 ? data.landExp![idx - 1] : undefined;
                    // 100% 최소 부대 레벨이 5 이하면 장수 최소 레벨(5)로 항상 100% 획득 → 70% 상황 없음
                    const has70 = e.fullExpMinLevel > 5;
                    const ratio =
                      has70 && prev ? Math.round((exp70 / prev.exp) * 100) : undefined;
                    return (
                      <tr
                        key={e.landLevel}
                        className="border-b border-zinc-100 dark:border-zinc-800/50"
                      >
                        <td className="px-2 py-1.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${levelColor(
                              String(e.landLevel)
                            )}`}
                          >
                            {e.landLevel}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 font-mono">{e.fullExpMinLevel}</td>
                        <td className="px-2 py-1.5 font-mono text-zinc-500 dark:text-zinc-400">
                          {e.guardLevel}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-right">
                          {e.exp.toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-right text-amber-600 dark:text-amber-400">
                          {has70 ? exp70.toLocaleString() : <span className="text-zinc-300 dark:text-zinc-600">-</span>}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {ratio === undefined ? (
                            <span className="text-zinc-300 dark:text-zinc-600 font-mono">-</span>
                          ) : (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${efficiencyStyle(
                                ratio
                              )}`}
                            >
                              {ratio}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              부대 레벨이 &apos;100% 최소 부대 Lv&apos; 미만이면 경험치 70%만 획득. 마지막 열은 저레벨 부대로 이 토지를 70%로 먹을 때, 직전 레벨 토지를 100%로 먹는 것 대비 효율(100% 초과면 이득, 100% 이하면 손해)
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
              <span>효율:</span>
              <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${efficiencyStyle(130)}`}>130%+</span>
              <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${efficiencyStyle(120)}`}>120+</span>
              <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${efficiencyStyle(101)}`}>101+</span>
              <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${efficiencyStyle(100)}`}>≤100 손해</span>
            </div>
          </div>
        )}

        {/* 진행률 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {doneCount}/{total} ({percent}%)
          </span>
          <button
            onClick={reset}
            className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 범례: 레벨 색상 */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="mr-1">토지 레벨:</span>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((lv) => (
            <span
              key={lv}
              className={`px-1.5 py-0.5 rounded font-mono font-bold ${levelColor(lv)}`}
            >
              {lv}
            </span>
          ))}
          <span className="ml-1">· 뒤 숫자(×N)는 개수</span>
          <span className="ml-2 pl-2 border-l border-zinc-300 dark:border-zinc-700">
            🍗 닭다리 · 🌾 개간지 한도 · 🏯 영지 한도
          </span>
        </div>

        {/* 데스크톱 표 */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-left shadow-sm">
                <th className="px-2 py-2.5 w-8"></th>
                <th className="px-2 py-2.5 whitespace-nowrap">챕터</th>
                <th className="px-2 py-2.5 whitespace-nowrap">행동</th>
                <th className="px-2 py-2.5 whitespace-nowrap">대상</th>
                <th className="px-2 py-2.5 whitespace-nowrap">개간지 현황</th>
                <th className="px-2 py-2.5 whitespace-nowrap">점령지 현황</th>
                {UNIT_LABELS.map((label, u) => (
                  <th
                    key={label}
                    className={`px-2 py-2.5 text-center whitespace-nowrap ${
                      u % 2 === 0 ? "bg-zinc-200/50 dark:bg-zinc-800/50" : ""
                    }`}
                  >
                    {label}
                    <div className="text-[9px] font-normal opacity-70">Lv / HP</div>
                  </th>
                ))}
                <th className="px-2 py-2.5 text-center">🍗</th>
                <th className="px-2 py-2.5 w-full">팁</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => {
                const isDone = completed.has(i);
                const prevBase = i > 0 ? baseChapter(data.rows[i - 1].chapter) : null;
                const curBase = baseChapter(row.chapter);
                const isGroupStart = prevBase !== null && prevBase !== curBase;
                return (
                  <tr
                    key={i}
                    className={`align-top transition-colors ${
                      isGroupStart
                        ? "border-t-2 border-zinc-300 dark:border-zinc-600"
                        : "border-t border-zinc-100 dark:border-zinc-800"
                    } ${
                      row.milestone
                        ? "bg-amber-50/70 dark:bg-amber-950/25 font-medium"
                        : i % 2 === 1
                          ? "bg-zinc-50/60 dark:bg-zinc-900/40"
                          : ""
                    } ${isDone ? "opacity-45" : "hover:bg-sky-50/50 dark:hover:bg-sky-950/20"}`}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggle(i)}
                        className="w-4 h-4 accent-green-600 cursor-pointer"
                        aria-label={`${row.chapter} ${row.action} 완료`}
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap font-medium">{row.chapter}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col items-start gap-0.5">
                        <ActionBadge action={row.action} />
                        {extractUnitTag(row.target).unitTag && (
                          <UnitTag tag={extractUnitTag(row.target).unitTag!} />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <TargetCell raw={row.target} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <LandStatus raw={row.reclaimStatus} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <LandStatus raw={row.occupyStatus} />
                    </td>
                    {row.units.map((unit, u) => (
                      <td
                        key={u}
                        className={`px-2 py-2 text-center whitespace-nowrap ${
                          u % 2 === 0 && !row.milestone
                            ? "bg-zinc-100/40 dark:bg-zinc-800/30"
                            : ""
                        }`}
                      >
                        <UnitCell unit={unit} stacked />
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center font-mono">
                      {fmtChicken(row.chicken)}
                    </td>
                    <td className="px-2 py-2 text-sky-700 dark:text-sky-400 leading-snug whitespace-normal break-words max-w-xs">
                      {row.tip ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 */}
        <div className="md:hidden space-y-2">
          {data.rows.map((row, i) => {
            const isDone = completed.has(i);
            const prevBase = i > 0 ? baseChapter(data.rows[i - 1].chapter) : null;
            const curBase = baseChapter(row.chapter);
            const isGroupStart = prevBase === null || prevBase !== curBase;
            const hasUnitChange = row.units.some(
              (u) => u.lv !== undefined || u.hp !== undefined
            );
            return (
              <div key={i}>
                {isGroupStart && (
                  <div className="sticky top-14 z-10 -mx-4 px-4 py-1.5 mt-3 mb-1 bg-zinc-200/95 dark:bg-zinc-800/95 backdrop-blur text-sm font-bold text-zinc-700 dark:text-zinc-200 border-y border-zinc-300 dark:border-zinc-700">
                    {curBase}
                  </div>
                )}
                <div
                  className={`rounded-lg border p-3 ${
                    row.milestone
                      ? "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
                  } ${isDone ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggle(i)}
                      className="w-4 h-4 mt-1 accent-green-600 cursor-pointer shrink-0"
                      aria-label={`${row.chapter} ${row.action} 완료`}
                    />
                    <div className="flex-1 min-w-0">
                      {/* 헤더: 챕터 + 행동 + 부대 */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          {row.chapter}
                        </span>
                        <ActionBadge action={row.action} />
                        {extractUnitTag(row.target).unitTag && (
                          <UnitTag tag={extractUnitTag(row.target).unitTag!} />
                        )}
                      </div>

                      {/* 라벨 + 값 행들 */}
                      <div className="space-y-1 text-xs">
                        {row.target && (
                          <div className="flex items-baseline gap-2">
                            <span className="w-11 shrink-0 text-zinc-400 dark:text-zinc-500">
                              대상
                            </span>
                            <span className="font-semibold text-[13px]">
                              <TargetCell raw={row.target} />
                            </span>
                          </div>
                        )}
                        {row.reclaimStatus && (
                          <div className="flex items-baseline gap-2">
                            <span className="w-11 shrink-0 text-zinc-400 dark:text-zinc-500">
                              개간지
                            </span>
                            <LandStatus raw={row.reclaimStatus} inline />
                          </div>
                        )}
                        {row.occupyStatus && (
                          <div className="flex items-baseline gap-2">
                            <span className="w-11 shrink-0 text-zinc-400 dark:text-zinc-500">
                              점령지
                            </span>
                            <LandStatus raw={row.occupyStatus} inline />
                          </div>
                        )}
                        {(hasUnitChange || row.chicken !== undefined) && (
                          <div className="flex items-baseline gap-2">
                            <span className="w-11 shrink-0 text-zinc-400 dark:text-zinc-500">
                              부대
                            </span>
                            <span className="flex gap-1.5 flex-wrap">
                              {row.units.map((unit, u) => {
                                const has =
                                  unit.lv !== undefined || unit.hp !== undefined;
                                if (!has) return null;
                                return (
                                  <span
                                    key={u}
                                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.5"
                                  >
                                    <span
                                      className={`text-[10px] font-semibold ${
                                        UNIT_TAG_STYLE[UNIT_LABELS[u]] ??
                                        "text-zinc-500 dark:text-zinc-400"
                                      }`}
                                    >
                                      {UNIT_LABELS[u]}
                                    </span>
                                    <UnitCell unit={unit} />
                                  </span>
                                );
                              })}
                              {row.chicken !== undefined && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 font-mono">
                                  🍗 {fmtChicken(row.chicken)}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {row.tip && (
                          <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="w-11 shrink-0 text-zinc-400 dark:text-zinc-500">
                              팁
                            </span>
                            <span className="text-sky-700 dark:text-sky-400 leading-snug">
                              {row.tip}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 부록 A: 누적 경험치선 (접이식) */}
        {data.cumulativeExp && data.cumulativeExp.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <button
              onClick={() => setExpOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>📊 부록 A · 누적 경험치 기준선 (5레벨=0)</span>
              <span>{expOpen ? "▲" : "▼"}</span>
            </button>
            {expOpen && (
              <div className="px-4 py-3">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-1 text-xs font-mono">
                  {data.cumulativeExp.map((e) => (
                    <div key={e.level} className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Lv{e.level}</span>
                      <span>{e.cumulativeExp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 출처 */}
        {data.sources && data.sources.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-sm font-semibold mb-1.5">📚 출처 · 참고 자료</div>
            <ul className="list-disc list-inside text-xs space-y-1">
              {data.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 dark:text-sky-400 hover:underline break-all"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
