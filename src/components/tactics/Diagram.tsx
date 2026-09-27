"use client";

import { ReactNode } from "react";

/**
 * 전술 가이드용 도식(diagram) 컴포넌트 모음.
 * 텍스트 위주 설명의 가독성을 높이기 위한 시각 요소들.
 */

/** 장수 슬롯 (레벨 뱃지 포함) */
export function GeneralChip({
  name,
  level,
  role,
  dim = false,
  highlight = false,
}: {
  name: string;
  level?: number | string;
  role?: "axis" | "grow" | "normal";
  dim?: boolean;
  highlight?: boolean;
}) {
  const roleStyle =
    role === "axis"
      ? "border-amber-400 bg-amber-50 dark:bg-amber-500/15 dark:border-amber-600"
      : role === "grow"
      ? "border-green-400 bg-green-50 dark:bg-green-500/15 dark:border-green-600"
      : "border-zinc-300 bg-white dark:bg-zinc-800 dark:border-zinc-600";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border px-2 py-1.5 min-w-[64px] ${roleStyle} ${
        dim ? "opacity-40" : ""
      } ${highlight ? "ring-2 ring-amber-500" : ""}`}
    >
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
        {name}
      </span>
      {level !== undefined && (
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Lv.{level}
        </span>
      )}
    </div>
  );
}

/** 부대 카드 (부대명 + 장수 3슬롯) */
export function ArmyCard({
  label,
  accent = "zinc",
  children,
}: {
  label: string;
  accent?: "amber" | "blue" | "green" | "zinc";
  children: ReactNode;
}) {
  const accentMap = {
    amber: "border-amber-300 dark:border-amber-700/60",
    blue: "border-blue-300 dark:border-blue-700/60",
    green: "border-green-300 dark:border-green-700/60",
    zinc: "border-zinc-300 dark:border-zinc-700",
  };
  return (
    <div className={`rounded-xl border ${accentMap[accent]} p-2.5`}>
      <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
        {label}
      </div>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

/** 조작 뱃지 (교체 / 퇴진 / 전투 / 이관) */
export function OpBadge({ type }: { type: "교체" | "퇴진" | "전투" | "이관" }) {
  const style =
    type === "교체"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200"
      : type === "퇴진"
      ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200"
      : type === "이관"
      ? "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200"
      : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200";
  const icon =
    type === "교체" ? "🔄" : type === "퇴진" ? "↩️" : type === "이관" ? "🔀" : "⚔️";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${style}`}
    >
      {icon} {type}
    </span>
  );
}

/** 세로 화살표 (단계 사이 연결) */
export function StepArrow({ label }: { label?: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <span className="text-zinc-400 dark:text-zinc-500 text-lg">↓</span>
      {label && (
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
      )}
    </div>
  );
}

/** 이득/손실 2열 비교 박스 */
export function ProsCons({
  pros,
  cons,
}: {
  pros: { title: string; items: string[] };
  cons: { title: string; items: string[] };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-green-300 dark:border-green-700/60 bg-green-50 dark:bg-green-500/10 p-3">
        <div className="font-bold text-green-800 dark:text-green-300 mb-1.5">
          ✅ {pros.title}
        </div>
        <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
          {pros.items.map((t, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-green-600 dark:text-green-400">+</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-500/10 p-3">
        <div className="font-bold text-red-800 dark:text-red-300 mb-1.5">
          ❌ {cons.title}
        </div>
        <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
          {cons.items.map((t, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-red-600 dark:text-red-400">−</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * 9명 전체 상태 추적 도식 (S0~S11).
 * 각 단계마다 9명 장수의 Lv/HP 상태를 격자로 보여주고,
 * 변경된 셀은 강조하며, 단계 유형(점령/회복 등)을 색으로 구분한다.
 */
export type StepPhase = "start" | "reconfig" | "capture" | "evac" | "recover" | "restore";

export interface GenState {
  /** "36/200" 형식. 변경된 셀이면 앞에 "*" 표기: "*27/200" */
  v: string;
}

export interface FlowStep {
  id: string;
  phase: StepPhase;
  title: string;
  desc?: string;
  /** 9명 상태: [강유, 유비, 제갈량, 채문희, 원소, 동탁, 서성, 대교, 태사자] */
  states: string[];
}

const PHASE_META: Record<
  StepPhase,
  { label: string; icon: string; badge: string; bar: string }
> = {
  start: {
    label: "시작",
    icon: "🏳️",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
    bar: "bg-zinc-300 dark:bg-zinc-600",
  },
  reconfig: {
    label: "이관",
    icon: "🔀",
    badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
    bar: "bg-fuchsia-400 dark:bg-fuchsia-500",
  },
  capture: {
    label: "점령",
    icon: "⚔️",
    badge: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
    bar: "bg-green-500 dark:bg-green-500",
  },
  evac: {
    label: "대피",
    icon: "📦",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
    bar: "bg-orange-400 dark:bg-orange-500",
  },
  recover: {
    label: "회복",
    icon: "❤️",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
    bar: "bg-rose-400 dark:bg-rose-500",
  },
  restore: {
    label: "복원",
    icon: "🔁",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
    bar: "bg-sky-400 dark:bg-sky-500",
  },
};

const FLOW_GENERALS = [
  { name: "강유", army: 1 },
  { name: "유비", army: 1 },
  { name: "제갈량", army: 1 },
  { name: "채문희", army: 2 },
  { name: "원소", army: 2 },
  { name: "동탁", army: 2 },
  { name: "서성", army: 3 },
  { name: "대교", army: 3 },
  { name: "태사자", army: 3 },
];

const ARMY_TINT: Record<number, string> = {
  1: "text-amber-700 dark:text-amber-300",
  2: "text-blue-700 dark:text-blue-300",
  3: "text-teal-700 dark:text-teal-300",
};

function StateCell({ raw, tint }: { raw: string; tint: string }) {
  const changed = raw.startsWith("*");
  const val = changed ? raw.slice(1) : raw;
  const [lv, hp] = val.split("/");
  const isShell = lv === "5";
  return (
    <div
      className={`rounded-md border px-1 py-1 text-center leading-tight transition-colors ${
        changed
          ? "border-amber-400 bg-amber-50 dark:bg-amber-500/20 dark:border-amber-500 ring-1 ring-amber-400/60"
          : isShell
          ? "border-zinc-200 bg-zinc-50 opacity-60 dark:bg-zinc-800/40 dark:border-zinc-700"
          : "border-zinc-200 bg-white dark:bg-zinc-800/60 dark:border-zinc-700"
      }`}
    >
      <div className={`font-mono text-[11px] font-bold ${tint}`}>{lv}</div>
      <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{hp}</div>
    </div>
  );
}

export function StepTracker({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="space-y-2">
      {/* 헤더: 9명 이름 (부대 색상) */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[150px_repeat(9,1fr)] gap-1 px-1 pb-1">
            <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 self-end">
              단계
            </div>
            {FLOW_GENERALS.map((g) => (
              <div
                key={g.name}
                className={`text-center text-[11px] font-bold ${ARMY_TINT[g.army]}`}
              >
                {g.name}
              </div>
            ))}
          </div>

          {steps.map((s) => {
            const meta = PHASE_META[s.phase];
            const emphasize = s.phase === "capture";
            return (
              <div
                key={s.id}
                className={`grid grid-cols-[150px_repeat(9,1fr)] gap-1 rounded-lg p-1 mb-1 ${
                  emphasize
                    ? "bg-green-50 dark:bg-green-500/10 ring-1 ring-green-300 dark:ring-green-700/60"
                    : "bg-zinc-50/60 dark:bg-zinc-800/30"
                }`}
              >
                {/* 단계 라벨 */}
                <div className="flex items-center gap-1 pl-0.5">
                  <span className={`w-1 self-stretch rounded-full ${meta.bar}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                        {s.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1 text-[9px] font-bold ${meta.badge}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {s.title}
                    </div>
                  </div>
                </div>
                {/* 9명 상태 셀 */}
                {s.states.map((raw, i) => (
                  <StateCell key={i} raw={raw} tint={ARMY_TINT[FLOW_GENERALS[i].army]} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold">범례:</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-amber-400 bg-amber-50 dark:bg-amber-500/20" />
          변경됨
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-zinc-200 bg-zinc-50 opacity-60 dark:bg-zinc-800/40" />
          5레벨 껍데기
        </span>
        <span className="inline-flex items-center gap-1">
          <span className={ARMY_TINT[1]}>■</span> 1군
        </span>
        <span className="inline-flex items-center gap-1">
          <span className={ARMY_TINT[2]}>■</span> 2군
        </span>
        <span className="inline-flex items-center gap-1">
          <span className={ARMY_TINT[3]}>■</span> 3군
        </span>
        <span>셀 = Lv / HP</span>
      </div>
    </div>
  );
}

/** 범용 데이터 표 (임의 열 수) */
export function DataTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      {caption && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{caption}</div>
      )}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-left font-semibold whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 ${
                    j === 0
                      ? "font-medium text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 비교표 (안 했을 때 vs 했을 때) */
export function CompareTable({
  headers,
  rows,
}: {
  headers: [string, string, string];
  rows: [string, string, string][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-left font-semibold">
              {headers[0]}
            </th>
            <th className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 bg-red-50 dark:bg-red-500/10 text-left font-semibold text-red-800 dark:text-red-300">
              {headers[1]}
            </th>
            <th className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 bg-green-50 dark:bg-green-500/10 text-left font-semibold text-green-800 dark:text-green-300">
              {headers[2]}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                {r[0]}
              </td>
              <td className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-zinc-800 dark:text-zinc-200">
                {r[1]}
              </td>
              <td className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-zinc-800 dark:text-zinc-200">
                {r[2]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
