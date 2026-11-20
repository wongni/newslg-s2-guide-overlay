"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

/**
 * 레벨 소탕 계산기 (Leveling / Sweep planner)
 *
 * 목적: 전쟁 발발 예상 시각에서 "역산"하여, 목표 레벨까지 도달하기 위해
 *       어떤 토(討)를 몇 번 소탕해야 하는지와 시간 안에 달성 가능한지를 계산한다.
 *
 * 확정된 메커니즘 (클라이언트 제공):
 *  - 소탕 1회 = 체력 20 소모
 *  - 체력 회복 = 1 / 3분  →  20/시간  →  시간당 소탕 1회분
 *  - 오미자: 체력 +60 회복, 하루 3회 사용 가능, 매일 오전 8시에 1개 선물 지급
 *  - 레벨별 필요경험치: 개척 트래킹 "부록 A · 누적 경험치 기준선(5레벨=0)"에서 계산
 *    (L → L+1 필요경험치 = 누적[L+1] − 누적[L])
 *
 * 시뮬레이션: 소탕 1회마다 경험치를 더하고 즉시 레벨업을 반영한 뒤,
 *            "올라간 레벨 기준"으로 다음 소탕할 토를 다시 고른다.
 *
 * 경험치 규칙:
 *  - 각 토는 "경험치 100% 받는 최소 레벨"(minLevel100)이 있다. 내 레벨이 이 값 이상이면 100% 경험치.
 *    (minLevel100 미입력 시 "수비군레벨 - 5" 기준으로 대체 계산)
 *  - 내 레벨 < minLevel100  →  70% 경험치 + 전복(실패) 위험
 *
 * 경로 2가지:
 *  1) 안전 경로: 지금 레벨에서 100% 경험치를 받는 토 중 경험치가 가장 큰 토만 소탕.
 *  2) 위험 경로: 안전 경로와 같되, 100% 최소레벨보다 최대 RISKY_MAX_SHORTFALL(3)레벨 낮은 상위 토의
 *     70% 경험치가 안전 최선 토보다 RISKY_MIN_GAIN(10%) 이상 많으면 그 토에 도전한다.
 */

import { getTrackingData } from "@/data/tracking-by-season";

const STAMINA_PER_SWEEP = 20;
const MINUTES_PER_STAMINA = 3;
const OMIJA_HEAL = 60; // 오미자 1개당 체력 회복
const OMIJA_PER_DAY = 3; // 오미자 하루 사용 가능 횟수
const OMIJA_GIFT_HOUR = 8; // 매일 오전 8시에 1개 선물
const SAFE_LEVEL_GAP = 5; // minLevel100 미입력 시: 수비군레벨 − 5 이상이면 100% 경험치
const RISKY_EXP_FACTOR = 0.7; // 100% 최소레벨 미만 도전 시 획득 경험치 비율
const RISKY_MAX_SHORTFALL = 3; // 위험 경로: 100% 최소레벨보다 최대 몇 레벨 낮아도 도전하는지
const RISKY_MIN_GAIN = 1.1; // 위험 경로: 70% 경험치가 안전 최선보다 이 배수 이상일 때만 도전
const MIN_LEVEL = 5;
const MAX_LEVEL = 50;

// 부록 A: 레벨별 누적 경험치(5레벨=0). 토지 경험치 표와 마찬가지로 시즌 공통 데이터.
const CUMULATIVE_EXP: Record<number, number> = {
  [MIN_LEVEL]: 0,
  ...Object.fromEntries(
    (getTrackingData("s4", "low").cumulativeExp ?? []).map((e) => [e.level, e.cumulativeExp])
  ),
};

// 레벨 L → L+1 필요경험치. 부록 A 범위(5~49) 밖이면 0.
function expNeeded(level: number): number {
  const from = CUMULATIVE_EXP[level];
  const to = CUMULATIVE_EXP[level + 1];
  if (from == null || to == null) return 0;
  return to - from;
}

function countDailyGifts(now: Date, deadline: Date, hour = OMIJA_GIFT_HOUR): number {
  if (deadline.getTime() <= now.getTime()) return 0;
  let count = 0;
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  while (d.getTime() <= deadline.getTime()) {
    count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

interface ToeRow {
  id: number;
  toe: string;
  exp: string;
  defender: string; // 수비군 레벨 (선택)
  minLevel100: string; // 경험치 100% 받는 최소 레벨 (선택)
}

const DEFAULT_TOES: ToeRow[] = [
  { id: 1, toe: "2토", exp: "2560", defender: "3", minLevel100: "5" },
  { id: 2, toe: "3토", exp: "2800", defender: "10", minLevel100: "5" },
  { id: 3, toe: "4토", exp: "6400", defender: "15", minLevel100: "5" },
  { id: 4, toe: "5토", exp: "12000", defender: "22", minLevel100: "5" },
  { id: 5, toe: "6토", exp: "26000", defender: "27", minLevel100: "19" },
  { id: 6, toe: "7토", exp: "44000", defender: "33", minLevel100: "24" },
  { id: 7, toe: "8토", exp: "80000", defender: "37", minLevel100: "29" },
  { id: 8, toe: "9토", exp: "140000", defender: "42", minLevel100: "34" },
  { id: 9, toe: "10토", exp: "200000", defender: "45", minLevel100: "39" },
  { id: 10, toe: "11토", exp: "300000", defender: "48", minLevel100: "41" },
  { id: 11, toe: "12토", exp: "400000", defender: "50", minLevel100: "43" },
];

// 기본 입력값 (저장된 값이 없을 때만 사용). "초기화" 시에도 이 값으로 되돌아온다.
const DEFAULT_FORM = {
  currentLevel: "43",
  currentExp: "1620000",
  targetLevel: "50",
  currentStamina: "81",
  omija: "1",
  deadline: "2026-08-21T15:00",
};

// 마지막 입력/계산 값을 저장하는 localStorage 키
// v3: 경험치 단위를 "만"에서 "일 단위(실제 경험치 값)"로 변경 (이전 저장값 오해석 방지)
const STORAGE_KEY = "leveling-form-v3";

// 시각화 막대/범례용 토 색상 팔레트 (도전=위험 구간은 빨강으로 별도 표시)
const TOE_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-teal-500",
  "bg-indigo-500",
];

interface ToeInput {
  label: string;
  exp: number;
  defender: number | null;
  minLevel100: number | null; // 경험치 100% 받는 최소 레벨
}

interface BreakdownItem {
  label: string;
  count: number;
  defender: number | null;
  minLevel100: number | null;
  risky: boolean;
  factor: number;
  fromLevel: number; // 이 토를 처음 소탕한 레벨
  toLevel: number; // 이 토를 마지막으로 소탕한 레벨
}

interface SimResult {
  requiredSweeps: number;
  requiredStamina: number;
  breakdown: BreakdownItem[];
  reachedLevel: number;
  reachedProgress: number;
  targetReached: boolean;
  hasRisky: boolean;
  riskySweeps: number;
  maxShortfallUsed: number; // 도전 소탕 중 (100% 최소레벨 − 내 레벨)의 최댓값
}

type PathMode = "safe" | "risky";

const MAX_ITER = 1_000_000;

// 100% 경험치를 받는 최소 레벨. minLevel100이 없으면 "수비군레벨 - SAFE_LEVEL_GAP".
function fullExpLevel(toe: ToeInput): number {
  if (toe.minLevel100 != null) return toe.minLevel100;
  if (toe.defender != null) return toe.defender - SAFE_LEVEL_GAP;
  return MIN_LEVEL;
}

interface Pick {
  toe: ToeInput;
  factor: number;
  risky: boolean;
  shortfall: number;
}

// 현재 레벨에서 소탕할 토를 고른다.
//  - 안전: 100% 경험치를 받는 토 중 경험치 최대 (동률이면 수비군 낮은 토)
//  - 위험: 위 + "바로 다음 토"(100% 최소레벨이 가장 가까운 상위 토)가 RISKY_MAX_SHORTFALL 이내로 모자라고
//          그 70% 경험치가 안전 최선의 RISKY_MIN_GAIN배 이상이면 그 토에 도전 (토 건너뛰기 없음)
function pickToe(toeList: ToeInput[], level: number, mode: PathMode): Pick {
  const full = toeList.filter((t) => level >= fullExpLevel(t));
  let safeBest: ToeInput | null = null;
  for (const t of full) {
    if (
      !safeBest ||
      t.exp > safeBest.exp ||
      (t.exp === safeBest.exp && (t.defender ?? 0) < (safeBest.defender ?? 0))
    ) {
      safeBest = t;
    }
  }

  if (mode === "risky") {
    // 도전 후보는 "바로 다음 토" 하나뿐: 아직 100%가 아닌 토 중 100% 최소레벨이 가장 낮은 토
    // (같은 최소레벨이 여럿이면 경험치가 큰 토). 토를 건너뛰어 도전하지 않는다.
    let next: ToeInput | null = null;
    for (const t of toeList) {
      if (fullExpLevel(t) <= level) continue;
      if (
        !next ||
        fullExpLevel(t) < fullExpLevel(next) ||
        (fullExpLevel(t) === fullExpLevel(next) && t.exp > next.exp)
      ) {
        next = t;
      }
    }
    if (next) {
      const shortfall = fullExpLevel(next) - level;
      const eff = next.exp * RISKY_EXP_FACTOR;
      const bar = (safeBest?.exp ?? 0) * RISKY_MIN_GAIN;
      if (shortfall <= RISKY_MAX_SHORTFALL && eff >= bar) {
        return { toe: next, factor: RISKY_EXP_FACTOR, risky: true, shortfall };
      }
    }
  }

  if (safeBest) return { toe: safeBest, factor: 1, risky: false, shortfall: 0 };

  // 100% 경험치 토가 하나도 없음 → 100% 최소레벨이 가장 낮은 토를 70%로 (안전 경로도 불가피)
  const nearest = toeList.reduce((a, b) => (fullExpLevel(b) < fullExpLevel(a) ? b : a));
  return {
    toe: nearest,
    factor: RISKY_EXP_FACTOR,
    risky: true,
    shortfall: fullExpLevel(nearest) - level,
  };
}

// 소탕 1회마다 레벨업을 즉시 반영하며 시뮬레이션.
// maxSweeps 도달 시 목표 미달이라도 중단(예산 내 도달 레벨 계산용).
function simulate(
  toeList: ToeInput[],
  mode: PathMode,
  cLevel: number,
  cExp: number,
  tLevel: number,
  maxSweeps = Infinity
): SimResult {
  const counts = new Map<string, BreakdownItem>();
  let level = cLevel;
  let progress = cExp;
  let sweeps = 0;
  let hasRisky = false;
  let riskySweeps = 0;
  let maxShortfallUsed = 0;

  // 시작 경험치가 이미 다음 레벨 이상이면 먼저 반영
  while (level < tLevel && expNeeded(level) > 0 && progress >= expNeeded(level)) {
    progress -= expNeeded(level);
    level += 1;
  }

  while (level < tLevel && sweeps < MAX_ITER && sweeps < maxSweeps) {
    const { toe, factor, risky, shortfall } = pickToe(toeList, level, mode);
    const gained = toe.exp * factor;
    if (gained <= 0) break;
    progress += gained;
    sweeps += 1;
    if (risky) {
      hasRisky = true;
      riskySweeps += 1;
      maxShortfallUsed = Math.max(maxShortfallUsed, shortfall);
    }
    const key = `${toe.label}__${risky}`;
    const entry =
      counts.get(key) ??
      {
        label: toe.label,
        count: 0,
        defender: toe.defender,
        minLevel100: toe.minLevel100,
        risky,
        factor,
        fromLevel: level,
        toLevel: level,
      };
    entry.count += 1;
    entry.toLevel = level;
    counts.set(key, entry);

    while (level < tLevel && expNeeded(level) > 0 && progress >= expNeeded(level)) {
      progress -= expNeeded(level);
      level += 1;
    }
  }

  return {
    requiredSweeps: sweeps,
    requiredStamina: sweeps * STAMINA_PER_SWEEP,
    breakdown: [...counts.values()],
    reachedLevel: level,
    reachedProgress: progress,
    targetReached: level >= tLevel,
    hasRisky,
    riskySweeps,
    maxShortfallUsed,
  };
}

interface PlanResult {
  totalExpNeeded: number;
  budgetStamina: number;
  budgetSweeps: number;
  omijaOwned: number;
  omijaGift: number;
  omijaUsed: number;
  regenStamina: number;
  daysRemaining: number;
  minutesRemaining: number;
  safe: SimResult;
  safeAchievable: boolean;
  safeReach: SimResult | null; // 안전 경로로 예산 내 도달 지점 (안전 불가 시)
  safeCompletion: string; // 안전 경로 목표 도달 예상 시각
  risky: SimResult | null; // 위험 경로 (도전이 의미 있는 구간이 없으면 null)
  riskyAchievable: boolean;
  riskyReach: SimResult | null; // 위험 경로로 예산 내 도달 지점 (위험도 불가 시)
  riskyCompletion: string | null; // 위험 경로 목표 도달 예상 시각
}
export default function LevelingPage() {
  const [currentLevel, setCurrentLevel] = useState(DEFAULT_FORM.currentLevel);
  const [currentExp, setCurrentExp] = useState(DEFAULT_FORM.currentExp);
  const [targetLevel, setTargetLevel] = useState(DEFAULT_FORM.targetLevel);
  const [currentStamina, setCurrentStamina] = useState(DEFAULT_FORM.currentStamina);
  const [omija, setOmija] = useState(DEFAULT_FORM.omija);
  const [deadline, setDeadline] = useState(DEFAULT_FORM.deadline);

  const [minDateTime, setMinDateTime] = useState("");

  const [toes, setToes] = useState<ToeRow[]>(DEFAULT_TOES);
  const [showToes, setShowToes] = useState(false);
  const [showExpTable, setShowExpTable] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);

  // 마지막 입력/계산 값 복원 (최초 1회). 저장된 값이 없으면 DEFAULT_FORM 유지.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.currentLevel === "string") setCurrentLevel(s.currentLevel);
        if (typeof s.currentExp === "string") setCurrentExp(s.currentExp);
        if (typeof s.targetLevel === "string") setTargetLevel(s.targetLevel);
        if (typeof s.currentStamina === "string") setCurrentStamina(s.currentStamina);
        if (typeof s.omija === "string") setOmija(s.omija);
        if (typeof s.deadline === "string") setDeadline(s.deadline);
        if (Array.isArray(s.toes))
          setToes(
            s.toes.map((t: Partial<ToeRow> & { id: number }) => ({
              minLevel100: "",
              defender: "",
              exp: "",
              toe: "",
              ...t,
            }))
          );
      }
    } catch {
      // 손상된 저장값은 무시
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 값이 바뀔 때마다 저장 (복원 완료 이후에만 저장해 초기값 덮어쓰기 방지)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentLevel, currentExp, targetLevel, currentStamina, omija, deadline, toes })
      );
    } catch {
      // 저장 실패는 무시
    }
  }, [hydrated, currentLevel, currentExp, targetLevel, currentStamina, omija, deadline, toes]);

  const refreshMin = useCallback(() => {
    setMinDateTime(toLocalInput(new Date()));
  }, []);

  const addToe = useCallback(() => {
    setToes((prev) => [
      ...prev,
      { id: (prev.at(-1)?.id ?? 0) + 1, toe: `${prev.length + 6}토`, exp: "", defender: "", minLevel100: "" },
    ]);
  }, []);

  const removeToe = useCallback((id: number) => {
    setToes((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToe = useCallback((id: number, field: keyof ToeRow, value: string) => {
    setToes((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }, []);

  const calculate = useCallback(() => {
    setError(null);

    const cLevel = parseInt(currentLevel);
    const tLevel = parseInt(targetLevel);
    const cExp = parseFloat(currentExp) || 0;
    const cStam = parseFloat(currentStamina) || 0;
    const omijaCount = parseInt(omija) || 0;

    if (!Number.isFinite(cLevel) || !Number.isFinite(tLevel)) {
      setError("현재 레벨과 목표 레벨을 입력해주세요.");
      return;
    }
    if (cLevel < MIN_LEVEL) {
      setError(`현재 레벨은 ${MIN_LEVEL} 이상이어야 합니다.`);
      return;
    }
    if (tLevel <= cLevel) {
      setError("목표 레벨은 현재 레벨보다 높아야 합니다.");
      return;
    }
    if (tLevel > 50) {
      setError("최대 레벨은 50입니다. 목표 레벨을 50 이하로 입력해주세요.");
      return;
    }
    if (!deadline) {
      setError("전쟁 발발 예상 일시를 입력해주세요.");
      return;
    }

    const now = new Date();
    const deadlineDate = new Date(deadline);
    if (deadlineDate.getTime() <= now.getTime()) {
      setError("전쟁 발발 예상 일시는 현재 이후여야 합니다.");
      return;
    }

    const toeList: ToeInput[] = toes
      .map((t) => ({
        label: t.toe.trim() || "토",
        exp: parseFloat(t.exp) || 0,
        defender: t.defender.trim() === "" ? null : parseInt(t.defender),
        minLevel100: t.minLevel100.trim() === "" ? null : parseInt(t.minLevel100),
      }))
      .filter((t) => t.exp > 0);

    if (toeList.length === 0) {
      setError("소탕할 토 정보(획득경험치)를 최소 1개 입력해주세요.");
      return;
    }

    // ---- 마감까지 남은 시간 & 확보 가능 체력 ----
    const minutesRemaining = Math.max(0, (deadlineDate.getTime() - now.getTime()) / 60000);
    const daysRemaining = Math.max(1, Math.ceil(minutesRemaining / 1440));

    const regenStamina = Math.floor(minutesRemaining / MINUTES_PER_STAMINA);
    const omijaGift = countDailyGifts(now, deadlineDate);
    const omijaTotal = omijaCount + omijaGift;
    const omijaUsable = Math.min(omijaTotal, OMIJA_PER_DAY * daysRemaining);
    const staminaFromOmija = omijaUsable * OMIJA_HEAL;

    const budgetStamina = cStam + regenStamina + staminaFromOmija;
    const budgetSweeps = Math.floor(budgetStamina / STAMINA_PER_SWEEP);

    // ---- 필요 총 경험치 ----
    let totalExpNeeded = Math.max(0, expNeeded(cLevel) - cExp);
    for (let L = cLevel + 1; L < tLevel; L++) totalExpNeeded += expNeeded(L);

    // 특정 소탕 수(체력)를 확보하는 데 걸리는 예상 시각(근사):
    //  즉시 사용 가능 체력(현재+오미자) 초과분을 자연 회복(1/3분)으로 충당한다고 가정.
    const instantStamina = cStam + staminaFromOmija;
    const completionAt = (requiredStamina: number): string => {
      const deficitForNow = Math.max(0, requiredStamina - instantStamina);
      const minutesToComplete = deficitForNow * MINUTES_PER_STAMINA;
      return new Date(now.getTime() + minutesToComplete * 60000).toLocaleString("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    // ---- ① 안전 경로: 100% 경험치 토만 ----
    const safe = simulate(toeList, "safe", cLevel, cExp, tLevel);
    const safeAchievable = safe.requiredStamina <= budgetStamina;
    const safeReach = safeAchievable
      ? null
      : simulate(toeList, "safe", cLevel, cExp, tLevel, budgetSweeps);

    // ---- ② 위험 경로: 의미 있는 구간에서 70% 도전 ----
    const riskySim = simulate(toeList, "risky", cLevel, cExp, tLevel);
    // 안전 경로보다 소탕 수가 줄지 않으면(도전할 구간이 없으면) 표시하지 않는다.
    const risky =
      riskySim.hasRisky && riskySim.requiredSweeps < safe.requiredSweeps ? riskySim : null;
    const riskyAchievable = risky != null && risky.requiredStamina <= budgetStamina;
    const riskyReach =
      risky && !riskyAchievable
        ? simulate(toeList, "risky", cLevel, cExp, tLevel, budgetSweeps)
        : null;

    setResult({
      totalExpNeeded,
      budgetStamina,
      budgetSweeps,
      omijaOwned: omijaCount,
      omijaGift,
      omijaUsed: omijaUsable,
      regenStamina,
      daysRemaining,
      minutesRemaining,
      safe,
      safeAchievable,
      safeReach,
      safeCompletion: completionAt(safe.requiredStamina),
      risky,
      riskyAchievable,
      riskyReach,
      riskyCompletion: risky ? completionAt(risky.requiredStamina) : null,
    });
  }, [currentLevel, targetLevel, currentExp, currentStamina, omija, deadline, toes]);

  const resetForm = useCallback(() => {
    setCurrentLevel(DEFAULT_FORM.currentLevel);
    setCurrentExp(DEFAULT_FORM.currentExp);
    setTargetLevel(DEFAULT_FORM.targetLevel);
    setCurrentStamina(DEFAULT_FORM.currentStamina);
    setOmija(DEFAULT_FORM.omija);
    setDeadline(DEFAULT_FORM.deadline);
    setToes(DEFAULT_TOES);
    setResult(null);
    setError(null);
  }, []);

  const inputClass =
    "w-full px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500";

  const fmt = (n: number) => n.toLocaleString("ko-KR");
  const fmtHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h >= 24) {
      const d = Math.floor(h / 24);
      return `${d}일 ${h % 24}시간`;
    }
    return `${h}시간 ${m}분`;
  };

  const previewNeeded = useMemo(() => {
    const cLevel = parseInt(currentLevel);
    const tLevel = parseInt(targetLevel);
    const cExp = parseFloat(currentExp) || 0;
    if (!Number.isFinite(cLevel) || !Number.isFinite(tLevel) || tLevel <= cLevel) return null;
    let total = Math.max(0, expNeeded(cLevel) - cExp);
    for (let L = cLevel + 1; L < tLevel; L++) total += expNeeded(L);
    return total;
  }, [currentLevel, targetLevel, currentExp]);

  // 레벨별 필요경험치 표(5→49). 전 구간 확정 데이터(docs/level-exp.md).
  const expRows = useMemo(() => {
    const rows: { level: number; exp: number }[] = [];
    for (let L = 5; L <= 49; L++) {
      rows.push({ level: L, exp: Math.round(expNeeded(L)) });
    }
    return rows;
  }, []);

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-lg font-bold">🎯 레벨업 플래너</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            전쟁 발발 시각에서 역산해, 목표 레벨까지 도달하는 <b>소탕 경로</b>를 계산합니다.
            소탕할 때마다 레벨업을 바로 반영해 <b>올라간 레벨 기준으로 다음 토를 다시 고릅니다</b>.
            <b>안전 경로</b>는 지금 레벨에서 <b>100% 경험치</b>를 받는 토 중 경험치가 가장 큰 토만 소탕합니다.
            <b>위험 경로</b>는 100% 최소레벨보다 <b>{RISKY_MAX_SHORTFALL}레벨 이내로 낮아도</b>, 70% 경험치가
            안전 최선보다 <b>{Math.round((RISKY_MIN_GAIN - 1) * 100)}% 이상 많으면</b> <b>바로 다음 토</b>에 도전합니다(토 건너뛰기 없음). (최대 레벨 {MAX_LEVEL})
          </p>
        </div>

        {/* 기본 입력 */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="현재 레벨">
              <input type="number" className={inputClass} placeholder="예: 44" value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} />
            </Field>
            <Field label="목표 레벨">
              <input type="number" className={inputClass} placeholder="예: 50" value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} />
            </Field>
            <Field label="현재 경험치" hint="현재 레벨에서 쌓인 양">
              <input type="number" step="any" className={inputClass} placeholder="0" value={currentExp} onChange={(e) => setCurrentExp(e.target.value)} />
            </Field>
            <Field label="현재 체력">
              <input type="number" className={inputClass} placeholder="0" value={currentStamina} onChange={(e) => setCurrentStamina(e.target.value)} />
            </Field>
            <Field label="오미자 갯수" hint="체력+60, 하루 3회, 매일 8시 +1">
              <input type="number" className={inputClass} placeholder="0" value={omija} onChange={(e) => setOmija(e.target.value)} />
            </Field>
          </div>

          <Field label="전쟁 발발 예상 일시" hint="과거 시각은 선택할 수 없습니다">
            <input
              type="datetime-local"
              className={inputClass}
              min={minDateTime}
              value={deadline}
              onFocus={refreshMin}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>

          {previewNeeded != null && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
              목표까지 필요 경험치: 약 <b>{fmt(Math.round(previewNeeded))}</b>
            </p>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-1">
          <button onClick={calculate} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 transition-colors">
            계산하기
          </button>
          <button onClick={resetForm} className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300">
            초기화
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
            {/* 상태 배너 */}
            {result.safeAchievable ? (
              <div className="px-3 py-2.5 rounded-md text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                ✅ 마감까지 안전 경로로 목표 레벨 달성 가능
              </div>
            ) : result.riskyAchievable ? (
              <div className="px-3 py-2.5 rounded-md text-sm font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                ⚠️ 안전 경로만으론 부족 — 위험 경로로 달성 가능
              </div>
            ) : (
              <div className="px-3 py-2.5 rounded-md text-sm font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                ❌ 마감까지 목표 레벨 달성 불가
              </div>
            )}

            {/* 추천 경로 요약 (핵심) */}
            <RecommendedSummary result={result} fmt={fmt} />

            {/* 자세히 보기 */}
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
            >
              {showDetail ? "▼ 자세히 접기" : "▶ 자세히 보기 (예산 내역·다른 경로)"}
            </button>

            {showDetail && (
              <div className="space-y-3">
                <Section title="개요">
                  <Row k="필요 총 경험치" v={`${fmt(Math.round(result.totalExpNeeded))}`} />
                  <Row k="확보 가능 총 체력" v={`${fmt(result.budgetStamina)} (소탕 ${fmt(result.budgetSweeps)}회분)`} strong />
                </Section>

                <Section title="마감까지 확보 가능 체력">
                  <Row k="남은 시간" v={fmtHours(result.minutesRemaining)} />
                  <Row k="자연 회복" v={`${fmt(result.regenStamina)} 체력`} />
                  <Row
                    k={`오미자 ${fmt(result.omijaUsed)}개 사용 (보유 ${result.omijaOwned} + 선물 ${result.omijaGift})`}
                    v={`+${fmt(result.omijaUsed * OMIJA_HEAL)}`}
                  />
                  {result.omijaUsed < result.omijaOwned + result.omijaGift && (
                    <p className="text-[10px] text-zinc-400 -mt-0.5">
                      · 보유+선물 {fmt(result.omijaOwned + result.omijaGift)}개 중 하루 3회 제한으로 {fmt(result.omijaUsed)}개만 사용
                    </p>
                  )}
                  <Row k="확보 가능 총 체력" v={`${fmt(result.budgetStamina)}`} strong />
                </Section>

                <PathSection title="① 안전 경로 (100% 경험치만)" sim={result.safe} budgetStamina={result.budgetStamina} fmt={fmt} />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-1">
                  {result.safeReach ? (
                    <>
                      → 마감까지 도달:{" "}
                      <b>
                        {result.safeReach.reachedLevel}레벨 (경험치 {fmt(Math.round(result.safeReach.reachedProgress))})
                      </b>
                      {" "}· 목표 도달 예상 {result.safeCompletion}
                    </>
                  ) : (
                    <>→ 목표 도달 예상 <b>{result.safeCompletion}</b></>
                  )}
                </p>

                {result.risky ? (
                  <>
                    <PathSection
                      title={`② 위험 경로 (최대 ${RISKY_MAX_SHORTFALL}레벨 낮게 70% 도전)`}
                      sim={result.risky}
                      budgetStamina={result.budgetStamina}
                      fmt={fmt}
                      emphasizeRisk
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-1">
                      {result.riskyReach ? (
                        <>
                          → 마감까지 도달:{" "}
                          <b>
                            {result.riskyReach.reachedLevel}레벨 (경험치 {fmt(Math.round(result.riskyReach.reachedProgress))})
                          </b>
                          {" "}· 목표 도달 예상 {result.riskyCompletion}
                        </>
                      ) : (
                        <>
                          → 목표 도달 예상 <b>{result.riskyCompletion}</b> · 안전 경로보다 소탕{" "}
                          {fmt(result.safe.requiredSweeps - result.risky.requiredSweeps)}회 적음
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    ② 위험 경로: 이 구간에는 70% 도전이 안전 경로보다 유리한 토가 없습니다.
                  </p>
                )}
                <p className="text-[10px] text-zinc-400">
                  ※ 도달 예상 시각은 현재+오미자 체력을 즉시 쓰고 나머지를 자연 회복(1당 3분)으로 채운다고 가정한 근사치입니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 토 데이터 (정적 게임 데이터 — 기본 접힘, 화면 하단 배치) */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setShowToes((v) => !v)}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {showToes ? "▼" : "▶"} 토 데이터 (획득경험치·수비군 레벨)
            {!showToes && <span> · 기본값 사용 중, 보통 건드릴 필요 없음</span>}
          </button>
          {showToes && (
            <div className="mt-2 space-y-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  변하지 않는 게임 데이터입니다. 값이 바뀌면 여기서 수정하세요.
                </span>
                <button onClick={addToe} className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 shrink-0">
                  + 토 추가
                </button>
              </div>
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
                <span>토</span>
                <span>획득경험치</span>
                <span>수비군 레벨</span>
                <span>100% 경험치 최소레벨</span>
                <span />
              </div>
              {toes.map((t) => (
                <div key={t.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_2rem] gap-2 items-center">
                  <input className={inputClass} placeholder="6토" value={t.toe} onChange={(e) => updateToe(t.id, "toe", e.target.value)} />
                  <input type="number" step="any" className={inputClass} placeholder="26000" value={t.exp} onChange={(e) => updateToe(t.id, "exp", e.target.value)} />
                  <input type="number" className={inputClass} placeholder="(선택)" value={t.defender} onChange={(e) => updateToe(t.id, "defender", e.target.value)} />
                  <input type="number" className={inputClass} placeholder="(선택)" value={t.minLevel100} onChange={(e) => updateToe(t.id, "minLevel100", e.target.value)} />
                  <button onClick={() => removeToe(t.id)} className="text-zinc-400 hover:text-red-500 text-sm" title="삭제">
                    ✕
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-zinc-400">
                소탕 후보는 획득경험치를 입력한 모든 토입니다. 내 레벨이 <b>“100% 경험치 최소레벨” 이상이면 100% 경험치</b>,
                미만이면 <b>70% + 전복 위험</b>입니다. (100% 경험치 최소레벨을 비워두면 “수비군레벨 − {SAFE_LEVEL_GAP}”로 대체 계산)
                안전 경로는 100% 경험치 토 중 경험치가 가장 큰 토를 고르고, 레벨이 오르면 다시 고릅니다.
              </p>
            </div>
          )}
        </div>

        {/* 레벨별 필요 경험치 (정적 데이터 — 기본 접힘) */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setShowExpTable((v) => !v)}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {showExpTable ? "▼" : "▶"} 레벨별 필요 경험치 (다음 레벨까지)
            {!showExpTable && <span> · 참고용</span>}
          </button>
          {showExpTable && (
            <div className="mt-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <p className="text-[11px] text-zinc-400 mb-2">
                각 레벨에서 <b>다음 레벨</b>까지 필요한 경험치입니다. (5~49 전 구간 확정 데이터)
              </p>
              <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      <th className="text-left font-medium px-2 py-1.5">레벨</th>
                      <th className="text-right font-medium px-2 py-1.5">다음 레벨 필요 경험치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expRows.map((r) => (
                      <tr
                        key={r.level}
                        className="border-t border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                      >
                        <td className="px-2 py-1">
                          {r.level} → {r.level + 1}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {fmt(r.exp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RecommendedSummary({
  result,
  fmt,
}: {
  result: PlanResult;
  fmt: (n: number) => string;
}) {
  // 추천: 안전 달성 가능 → 안전 / 위험만 가능 → 위험 / 둘 다 불가 → 더 빠른 경로(위험 있으면 위험)
  const useRisky = !result.safeAchievable && result.risky != null;
  const rec = useRisky ? result.risky! : result.safe;
  if (rec.requiredSweeps === 0) return null;

  const kind = useRisky ? "위험 경로" : "안전 경로";
  const achievable = useRisky ? result.riskyAchievable : result.safeAchievable;
  const reach = useRisky ? result.riskyReach : result.safeReach;
  const completion = useRisky ? result.riskyCompletion : result.safeCompletion;

  // 상태별 세 번째 지표 & 헤드라인
  let thirdLabel = "여유 체력";
  let thirdValue = fmt(result.budgetStamina - rec.requiredStamina);
  let headline: React.ReactNode = null;
  if (achievable) {
    headline = (
      <>
        {useRisky && (
          <>⚠️ 70% 도전 {fmt(rec.riskySweeps)}회 (최대 {rec.maxShortfallUsed}레벨 낮게) · </>
        )}
        🕒 가장 빠른 달성 <b>{completion}</b>
      </>
    );
  } else {
    thirdLabel = "마감 도달";
    thirdValue = reach ? `${reach.reachedLevel}레벨` : "-";
    headline = completion ? (
      <>❗ 마감 내 불가 · 목표 도달 예상 <b>{completion}</b></>
    ) : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">🎯 추천: {kind}</span>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">총 {fmt(rec.requiredSweeps)}회 소탕</span>
      </div>

      {/* 시각화 막대 */}
      <div className="flex h-6 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
        {rec.breakdown.map((b, i) => (
          <div
            key={`${b.label}-${b.risky}-${b.factor}`}
            className={b.risky ? "bg-red-500" : TOE_COLORS[i % TOE_COLORS.length]}
            style={{ width: `${(b.count / rec.requiredSweeps) * 100}%` }}
            title={`${b.label} ${fmt(b.count)}회`}
          />
        ))}
      </div>

      {/* 범례 */}
      <div className="space-y-0.5">
        {rec.breakdown.map((b, i) => (
          <div key={`${b.label}-${b.risky}-${b.factor}`} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${b.risky ? "bg-red-500" : TOE_COLORS[i % TOE_COLORS.length]}`} />
              {b.label}
              <span className="text-zinc-400">
                {" "}{b.fromLevel === b.toLevel ? `${b.fromLevel}렙` : `${b.fromLevel}~${b.toLevel}렙`}
              </span>
              {b.risky && <span className="text-red-500"> ⚠️70%</span>}
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{fmt(b.count)}회</span>
          </div>
        ))}
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <Stat label="필요 체력" value={fmt(rec.requiredStamina)} />
        <Stat label="확보 체력" value={fmt(result.budgetStamina)} />
        <Stat label={thirdLabel} value={thirdValue} />
      </div>

      {headline && (
        <div className="text-xs text-center px-3 py-2 rounded-md bg-amber-100/70 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
          {headline}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center px-2 py-1.5 rounded-md bg-white/60 dark:bg-zinc-800/60">
      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function PathSection({
  title,
  sim,
  budgetStamina,
  fmt,
  emphasizeRisk,
}: {
  title: string;
  sim: SimResult;
  budgetStamina: number;
  fmt: (n: number) => string;
  emphasizeRisk?: boolean;
}) {
  const within = sim.requiredStamina <= budgetStamina;
  return (
    <Section title={title}>
      <Row k="필요 소탕 횟수" v={`${fmt(sim.requiredSweeps)}회`} />
      <Row k="필요 총 체력" v={`${fmt(sim.requiredStamina)} ${within ? "(예산 내)" : "(예산 초과)"}`} />
      <Row
        k="70% 도전"
        v={sim.hasRisky ? `${fmt(sim.riskySweeps)}회 · 100% 최소레벨보다 최대 ${sim.maxShortfallUsed}레벨 낮게` : "없음"}
      />
      <div className="pt-1 space-y-0.5">
        {sim.breakdown.map((b) => (
          <div
            key={`${b.label}-${b.risky}-${b.factor}`}
            className={`flex justify-between text-xs ${b.risky ? "text-red-500" : "text-zinc-600 dark:text-zinc-400"}`}
          >
            <span>
              {b.label}
              <span className={b.risky ? "" : "text-zinc-400"}>
                {" "}[{b.fromLevel === b.toLevel ? `${b.fromLevel}렙` : `${b.fromLevel}~${b.toLevel}렙`}]
              </span>
              {b.defender != null && <span className={b.risky ? "" : "text-zinc-400"}> (수비군 {b.defender})</span>}
              {b.minLevel100 != null && <span className={b.risky ? "" : "text-zinc-400"}> (100%경험치 {b.minLevel100}렙)</span>}
              {b.risky ? ` ⚠️도전${b.factor < 1 ? " 70%" : ""}` : ""}
            </span>
            <span className="font-medium">{fmt(b.count)}회</span>
          </div>
        ))}
      </div>
      {emphasizeRisk && sim.hasRisky ? (
        <p className="text-[11px] text-red-500 pt-1">
          ⚠️ 도전 표시 소탕은 내 레벨이 해당 토의 “100% 경험치 최소레벨”에 못 미쳐 경험치 70% + 전복(실패) 위험이 있습니다.
          위험 소탕 {fmt(sim.riskySweeps)}회 · 최대 {sim.maxShortfallUsed}레벨 미달.
        </p>
      ) : !sim.hasRisky ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          모든 소탕이 100% 경험치 구간입니다. 레벨이 오르면 더 높은 토로 전환합니다.
        </p>
      ) : null}
    </Section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
        {label}
        {hint && <span className="text-zinc-400 font-normal"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-amber-200 dark:border-amber-800 pt-2">
      <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1.5">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">{k}</span>
      <span className={strong ? "font-bold text-amber-700 dark:text-amber-300" : "text-zinc-800 dark:text-zinc-200"}>{v}</span>
    </div>
  );
}
