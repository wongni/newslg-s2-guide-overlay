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
 *  - 레벨별 필요경험치: 아래 EXP_TABLE (표에 없는 레벨은 선형 보간)
 *
 * 경험치/위험 규칙 (수비군 레벨 기준):
 *  - 수비군레벨 <= 내 레벨              →  100% 경험치, 전복(실패) 위험 없음 (안전)
 *  - 내레벨 < 수비군레벨 <= 내레벨+5    →  100% 경험치, 단 전복(실패) 위험 있음 (도전)
 *  - 수비군레벨 > 내레벨+5              →  70% 경험치 + 전복(실패) 위험 (도전)
 *
 * 경로 2가지:
 *  1) 안전 경로: 수비군레벨 <= 내 레벨인 토만 사용(전복 위험 0). 상위 토는 레벨이 오르며 열린다.
 *  2) 최소 위험 경로: 안전 경로가 체력 예산 안에서 마감까지 목표 달성이 불가할 때,
 *     허용 레벨차 G를 0부터 늘려가며(=상위 토 도전) 예산 안에 들어오는 최소 G 경로를 찾는다.
 *     G가 클수록 소탕 수는 줄지만 전복 위험이 커지므로, 최소 G = 최소 위험.
 */

const STAMINA_PER_SWEEP = 20;
const MINUTES_PER_STAMINA = 3;
const OMIJA_HEAL = 60; // 오미자 1개당 체력 회복
const OMIJA_PER_DAY = 3; // 오미자 하루 사용 가능 횟수
const OMIJA_GIFT_HOUR = 8; // 매일 오전 8시에 1개 선물
const SAFE_LEVEL_GAP = 5; // (수비군레벨 - 내레벨)이 이 값 이하면 경험치 100%, 초과면 70%
const RISKY_EXP_FACTOR = 0.7; // 레벨차 5 초과 도전 시 획득 경험치 비율

// 레벨 L → L+1 필요경험치 (만). 표에 없는 레벨은 인접 구간 기울기로 선형 보간/외삽한다.
const EXP_TABLE: [number, number][] = [
  [27, 25.2],
  [28, 28.8],
  [30, 38],
  [32, 48],
  [38, 108],
  [43, 240],
  [44, 270],
  [45, 300],
  [46, 330],
];

function expNeeded(level: number): number {
  const t = EXP_TABLE;
  if (level <= t[0][0]) {
    const [l0, e0] = t[0];
    const [l1, e1] = t[1];
    const slope = (e1 - e0) / (l1 - l0);
    return Math.max(0, e0 + slope * (level - l0));
  }
  const last = t.length - 1;
  if (level >= t[last][0]) {
    const [l0, e0] = t[last - 1];
    const [l1, e1] = t[last];
    const slope = (e1 - e0) / (l1 - l0);
    return Math.max(0, e1 + slope * (level - t[last][0]));
  }
  for (let i = 0; i < last; i++) {
    const [l0, e0] = t[i];
    const [l1, e1] = t[i + 1];
    if (level >= l0 && level <= l1) {
      const slope = (e1 - e0) / (l1 - l0);
      return Math.max(0, e0 + slope * (level - l0));
    }
  }
  return 0;
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
}

const DEFAULT_TOES: ToeRow[] = [
  { id: 1, toe: "6토", exp: "2", defender: "27" },
  { id: 2, toe: "7토", exp: "4.4", defender: "33" },
  { id: 3, toe: "8토", exp: "8", defender: "37" },
  { id: 4, toe: "9토", exp: "14", defender: "42" },
  { id: 5, toe: "10토", exp: "20", defender: "45" },
  { id: 6, toe: "11토", exp: "30", defender: "48" },
  { id: 7, toe: "12토", exp: "40", defender: "50" },
];

// 기본 입력값 (저장된 값이 없을 때만 사용). "초기화" 시에도 이 값으로 되돌아온다.
const DEFAULT_FORM = {
  currentLevel: "43",
  currentExp: "162",
  targetLevel: "50",
  currentStamina: "81",
  omija: "1",
  deadline: "2026-08-21T15:00",
};

// 마지막 입력/계산 값을 저장하는 localStorage 키
const STORAGE_KEY = "leveling-form-v1";

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
}

interface BreakdownItem {
  label: string;
  count: number;
  defender: number | null;
  risky: boolean;
  factor: number;
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
  maxGapUsed: number; // 사용한 최대 (수비군레벨 - 내레벨)
}

const MAX_ITER = 1_000_000;

// 허용 레벨차 allowedGap 안에서 소탕당 유효경험치(경험치×보정)가 가장 높은 토를 선택하며 시뮬레이션.
// maxSweeps 도달 시 목표 미달이라도 중단(예산 내 도달 레벨 계산용).
function simulate(
  toeList: ToeInput[],
  allowedGap: number,
  cLevel: number,
  cExp: number,
  tLevel: number,
  maxSweeps = Infinity
): SimResult {
  const pick = (level: number) => {
    // 후보는 "내 레벨보다 높은 토"만 (동렙·이하 소탕은 실제로 거의 하지 않음).
    const above = toeList.filter((t) => t.defender != null && (t.defender as number) > level);
    if (above.length === 0) {
      // 위 토가 없음(내 레벨이 모든 수비군 이상) → 경험치 최고 토를 안전(100%)하게.
      const best = toeList.reduce((a, b) => (b.exp > a.exp ? b : a));
      return { toe: best, factor: 1, risky: false, gap: 0 };
    }
    // 허용 레벨차(allowedGap) 안에 드는 상위 토. 없으면 가장 가까운 상위 토로 대체.
    const inWindow = above.filter((t) => (t.defender as number) <= level + allowedGap);
    let best: ToeInput;
    let bestFactor = 1;
    let bestGap = 0;
    if (inWindow.length > 0) {
      // 허용 범위 안: 유효경험치(경험치×보정)가 가장 높은 토. 동률이면 레벨차 작은(안전한) 토.
      let bestEff = -Infinity;
      let chosenGap = Infinity;
      best = inWindow[0];
      for (const t of inWindow) {
        const gap = (t.defender as number) - level;
        const factor = gap <= SAFE_LEVEL_GAP ? 1 : RISKY_EXP_FACTOR;
        const eff = t.exp * factor;
        if (eff > bestEff || (eff === bestEff && gap < chosenGap)) {
          bestEff = eff;
          best = t;
          chosenGap = gap;
          bestFactor = factor;
        }
      }
      bestGap = chosenGap;
    } else {
      // 허용 범위 밖 → 가장 가까운 상위 토(레벨차 최소 = 전복 위험 최소).
      best = above.reduce((a, b) =>
        (a.defender as number) <= (b.defender as number) ? a : b
      );
      bestGap = (best.defender as number) - level;
      bestFactor = bestGap <= SAFE_LEVEL_GAP ? 1 : RISKY_EXP_FACTOR;
    }
    const risky = bestGap > SAFE_LEVEL_GAP;
    return { toe: best, factor: bestFactor, risky, gap: bestGap };
  };

  const counts = new Map<string, BreakdownItem>();
  let level = cLevel;
  let progress = cExp;
  let sweeps = 0;
  let hasRisky = false;
  let riskySweeps = 0;
  let maxGapUsed = 0;

  while (level < tLevel && sweeps < MAX_ITER && sweeps < maxSweeps) {
    const { toe, factor, risky, gap } = pick(level);
    const gained = toe.exp * factor;
    if (gained <= 0) break;
    progress += gained;
    sweeps += 1;
    maxGapUsed = Math.max(maxGapUsed, gap);
    if (risky) {
      hasRisky = true;
      riskySweeps += 1;
    }
    const key = `${toe.label}__${risky}__${factor}`;
    const entry =
      counts.get(key) ?? { label: toe.label, count: 0, defender: toe.defender, risky, factor };
    entry.count += 1;
    counts.set(key, entry);

    while (level < tLevel && progress >= expNeeded(level)) {
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
    maxGapUsed,
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
  safeReach: SimResult | null; // 안전 경로로 예산 내 도달 가능 지점 (안전 불가 시)
  riskyPath: SimResult | null; // 최소 위험 대안 (안전 불가 & 예산 내 가능 시)
  mostEfficient: SimResult | null; // 도전 최대 경로 — 목표까지 전체 (완전 불가 시)
  mostEfficientReach: SimResult | null; // 도전 최대 경로로 예산 내(마감까지) 도달 지점
  mostEfficientCompletion: string | null; // 도전 최대 경로로 목표 레벨 도달 예상 시각
  earliestCompletion: string | null;
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
        if (Array.isArray(s.toes)) setToes(s.toes);
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
      { id: (prev.at(-1)?.id ?? 0) + 1, toe: `${prev.length + 6}토`, exp: "", defender: "" },
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

    // ---- 안전 경로 (G = 0) ----
    const safe = simulate(toeList, 0, cLevel, cExp, tLevel);
    const safeAchievable = safe.requiredStamina <= budgetStamina;

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

    let safeReach: SimResult | null = null;
    let riskyPath: SimResult | null = null;
    let mostEfficient: SimResult | null = null;
    let mostEfficientReach: SimResult | null = null;
    let mostEfficientCompletion: string | null = null;

    if (!safeAchievable) {
      // 예산 내에서 안전 경로로 어디까지 도달?
      safeReach = simulate(toeList, 0, cLevel, cExp, tLevel, budgetSweeps);

      // 최소 위험 경로 탐색: G를 1부터 늘려 예산 안에 들어오는 최소 G
      const maxDefender = Math.max(0, ...toeList.map((t) => t.defender ?? 0));
      const maxG = Math.max(1, maxDefender - cLevel);
      for (let G = 1; G <= maxG; G++) {
        const r = simulate(toeList, G, cLevel, cExp, tLevel);
        if (r.requiredStamina <= budgetStamina) {
          riskyPath = r;
          break;
        }
      }
      // 최소 위험 경로가 없으면(도전 최대로도 예산 초과):
      //  - 목표까지 전체 최대 도전 경로
      //  - 예산 내(마감까지) 도달 지점
      //  - 목표 레벨 도달 예상 시각
      if (!riskyPath) {
        mostEfficient = simulate(toeList, maxG, cLevel, cExp, tLevel);
        mostEfficientReach = simulate(toeList, maxG, cLevel, cExp, tLevel, budgetSweeps);
        mostEfficientCompletion = completionAt(mostEfficient.requiredStamina);
      }
    }

    // 가장 빠른 완료 시각(근사): 안전 경로 달성 가능 시
    const earliestCompletion = safeAchievable ? completionAt(safe.requiredStamina) : null;

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
      riskyPath,
      mostEfficient,
      mostEfficientReach,
      mostEfficientCompletion,
      earliestCompletion,
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

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-lg font-bold">🎯 레벨업 플래너</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            전쟁 발발 시각에서 역산해, 목표 레벨까지 도달하는 <b>최적 소탕 경로</b>를 계산합니다.
            경험치 단위는 <b>만</b>. 보통 <b>내 레벨보다 높은 토</b>를 소탕하며, 수비군과의
            <b> 레벨차가 5 이내면 100% 경험치</b>, 초과하면 <b>70% + 전복(실패) 위험</b>입니다.
            안전 경로는 <b>가장 가까운(레벨차 최소) 상위 토</b>만 골라 전복 위험을 최소화하고,
            마감까지 부족하면 <b>최소 위험 경로</b>를 함께 제시합니다. (최대 레벨 50)
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
            <Field label="현재 경험치 (만)" hint="현재 레벨에서 쌓인 양">
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
              목표까지 필요 경험치: 약 <b>{fmt(Math.round(previewNeeded))}</b>만
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
                ✅ 마감까지 안전하게 목표 레벨 달성 가능
              </div>
            ) : result.riskyPath ? (
              <div className="px-3 py-2.5 rounded-md text-sm font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                ⚠️ 안전 경로만으론 부족 — 최소 위험 경로로 달성 가능
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
                  <Row k="필요 총 경험치" v={`${fmt(Math.round(result.totalExpNeeded))}만`} />
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

                <PathSection title="① 안전 경로 (레벨차 최소)" sim={result.safe} budgetStamina={result.budgetStamina} fmt={fmt} />
                {!result.safeAchievable && result.safeReach && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-1">
                    → 예산 내 도달 가능:{" "}
                    <b>
                      {result.safeReach.reachedLevel}레벨 (경험치 {fmt(Math.round(result.safeReach.reachedProgress))}만)
                    </b>
                  </p>
                )}

                {result.riskyPath && (
                  <PathSection
                    title="② 최소 위험 경로 (도전 포함)"
                    sim={result.riskyPath}
                    budgetStamina={result.budgetStamina}
                    fmt={fmt}
                    emphasizeRisk
                  />
                )}

                {result.mostEfficient && (
                  <>
                    <PathSection
                      title="③ 최대 도전 경로"
                      sim={result.mostEfficient}
                      budgetStamina={result.budgetStamina}
                      fmt={fmt}
                      emphasizeRisk
                    />
                    <p className="text-[10px] text-zinc-400">
                      ※ 도달 예상 시각은 현재+오미자 체력을 즉시 쓰고 나머지를 자연 회복(1당 3분)으로 채운다고 가정한 근사치입니다.
                    </p>
                  </>
                )}
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
              <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
                <span>토</span>
                <span>획득경험치(만)</span>
                <span>수비군 레벨</span>
                <span />
              </div>
              {toes.map((t) => (
                <div key={t.id} className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 items-center">
                  <input className={inputClass} placeholder="6토" value={t.toe} onChange={(e) => updateToe(t.id, "toe", e.target.value)} />
                  <input type="number" step="any" className={inputClass} placeholder="2" value={t.exp} onChange={(e) => updateToe(t.id, "exp", e.target.value)} />
                  <input type="number" className={inputClass} placeholder="(선택)" value={t.defender} onChange={(e) => updateToe(t.id, "defender", e.target.value)} />
                  <button onClick={() => removeToe(t.id)} className="text-zinc-400 hover:text-red-500 text-sm" title="삭제">
                    ✕
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-zinc-400">
                소탕 후보는 <b>내 레벨보다 높은 토</b>입니다(동렙·이하는 제외). 레벨차가 <b>5 이내면 100% 경험치</b>,
                5를 넘으면 <b>70% + 전복 위험</b>입니다. 안전 경로는 레벨차가 가장 작은 상위 토를 고르고, 레벨이 오르면
                상위 토로 전환합니다. (수비군 레벨을 비워둔 토는 후보에서 제외)
              </p>
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
  const rec = result.safeAchievable
    ? result.safe
    : result.riskyPath ?? result.mostEfficient;
  if (!rec || rec.requiredSweeps === 0) return null;

  const kind = result.safeAchievable
    ? "안전 경로"
    : result.riskyPath
    ? "최소 위험 경로"
    : "최대 도전 경로";

  // 상태별 세 번째 지표 & 헤드라인
  let thirdLabel = "여유 체력";
  let thirdValue = fmt(result.budgetStamina - rec.requiredStamina);
  let headline: React.ReactNode = null;
  if (result.safeAchievable) {
    headline = result.earliestCompletion ? (
      <>🕒 가장 빠른 달성 <b>{result.earliestCompletion}</b></>
    ) : null;
  } else if (result.riskyPath) {
    thirdLabel = "위험 소탕";
    thirdValue = `${fmt(rec.riskySweeps)}회`;
    headline = (
      <>
        ⚠️ 최대 <b>+{rec.maxGapUsed}레벨</b> 도전 · 여유 체력 {fmt(result.budgetStamina - rec.requiredStamina)}
      </>
    );
  } else {
    thirdLabel = "마감 도달";
    thirdValue = result.mostEfficientReach ? `${result.mostEfficientReach.reachedLevel}레벨` : "-";
    headline = result.mostEfficientCompletion ? (
      <>❗ 마감 내 불가 · 목표 도달 예상 <b>{result.mostEfficientCompletion}</b></>
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
              {b.defender != null && <span className="text-zinc-400"> 수비군 {b.defender}</span>}
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
      <Row k="사용 레벨차" v={sim.maxGapUsed > 0 ? `내 레벨 +최대 ${sim.maxGapUsed}` : "내 레벨 이하"} />
      <div className="pt-1 space-y-0.5">
        {sim.breakdown.map((b) => (
          <div
            key={`${b.label}-${b.risky}-${b.factor}`}
            className={`flex justify-between text-xs ${b.risky ? "text-red-500" : "text-zinc-600 dark:text-zinc-400"}`}
          >
            <span>
              {b.label}
              {b.defender != null && <span className={b.risky ? "" : "text-zinc-400"}> (수비군 {b.defender})</span>}
              {b.risky ? ` ⚠️도전${b.factor < 1 ? " 70%" : ""}` : ""}
            </span>
            <span className="font-medium">{fmt(b.count)}회</span>
          </div>
        ))}
      </div>
      {emphasizeRisk && sim.hasRisky ? (
        <p className="text-[11px] text-red-500 pt-1">
          ⚠️ 도전 표시 소탕은 레벨차가 5를 초과해 전복(실패) 위험이 있고 경험치도 70%입니다.
          위험 소탕 {fmt(sim.riskySweeps)}회 · 최대 레벨차 {sim.maxGapUsed}.
        </p>
      ) : !sim.hasRisky ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          모든 소탕이 레벨차 5 이내(100% 경험치)입니다. 레벨이 오르면 상위 토로 전환합니다.
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
