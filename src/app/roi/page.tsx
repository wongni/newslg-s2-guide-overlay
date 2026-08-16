"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";

// --- 상수 ---
const MAX_LEVEL = 25;
const MAX_BUILDINGS = 2;
const DUNJEON_BONUS_PER_BUILDING = 0.25;
const DUNJEON_PER_DAY = 5; // 둔전 하루 5회 충전
const HOURS_PER_DAY = 24;

// 생산량 증가 패턴 (확인됨):
// 도달 레벨 2~5: +200/레벨 (fromLevel 1~4)
// 도달 레벨 6~10: +400/레벨 (fromLevel 5~9)
// 도달 레벨 11~15: +600/레벨 (fromLevel 10~14)
// 도달 레벨 16~20: +800/레벨 (fromLevel 15~19) (추정)
// 도달 레벨 21~25: +1000/레벨 (fromLevel 20~24) (추정)
function defaultProductionGain(fromLevel: number): number {
  const targetLevel = fromLevel + 1;
  if (targetLevel <= 5) return 200;
  if (targetLevel <= 10) return 400;
  if (targetLevel <= 15) return 600;
  if (targetLevel <= 20) return 800;
  return 1000;
}

// 비용 패턴 (확인된 값 + 추정):
// 1→2: 6500, 2→3: 8500, 3→4: 10500, 4→5: 12500 (증가폭 2000)
// 5→6: 17000 (증가폭 변경)
// 13→14: 61000
// 구간별 추정 적용
function defaultUpgradeCost(fromLevel: number): number {
  // 확인된 값
  const known: Record<number, number> = {
    1: 6500,
    2: 8500,
    3: 10500,
    4: 12500,
    5: 17000,
    13: 61000,
  };
  if (known[fromLevel] !== undefined) return known[fromLevel];

  // 구간별 추정
  if (fromLevel <= 4) {
    return 6500 + (fromLevel - 1) * 2000;
  } else if (fromLevel <= 9) {
    // 5→6: 17000, 증가폭 추정 5500
    return 17000 + (fromLevel - 5) * 5500;
  } else if (fromLevel <= 14) {
    // 10→11 시작 추정: 17000 + 5*5500 = 44500 → 구간 증가폭 추정
    // 13→14 = 61000 확인됨. 10→11부터 역산
    // 10→11: X, 11→12: X+d, 12→13: X+2d, 13→14: X+3d = 61000
    // 5→6~9→10 마지막: 17000 + 4*5500 = 39000
    // 10→11 시작: 44500 추정, d: (61000-44500)/3 = 5500
    return 44500 + (fromLevel - 10) * 5500;
  } else if (fromLevel <= 19) {
    // 15→16 시작 추정: 44500 + 5*5500 = 72000, 증가폭 8000 추정
    return 72000 + (fromLevel - 15) * 8000;
  } else {
    // 20→21 시작 추정: 72000 + 5*8000 = 112000
    // 고레벨은 비용 급증 → 증가폭 15000 추정
    return 130000 + (fromLevel - 20) * 15000;
  }
}

interface LevelRow {
  fromLevel: number;
  cost: number;
  productionGain: number;
  confirmed: boolean;
}

// 1레벨 기본 생산량
const BASE_PRODUCTION = 200;

function createDefaultData(): LevelRow[] {
  const confirmedCosts = new Set([1, 2, 3, 4, 5, 13]);
  const confirmedGains = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

  return Array.from({ length: MAX_LEVEL - 1 }, (_, i) => {
    const fromLevel = i + 1;
    return {
      fromLevel,
      cost: defaultUpgradeCost(fromLevel),
      productionGain: defaultProductionGain(fromLevel),
      confirmed: confirmedCosts.has(fromLevel),
    };
  });
}

function formatNumber(n: number): string {
  if (n >= 10000) {
    const v = n / 10000;
    return v === Math.floor(v) ? `${v}만` : `${v.toFixed(1)}만`;
  }
  return n.toLocaleString();
}

function formatHours(h: number): string {
  if (!isFinite(h)) return "-";
  if (h < 1) return `${Math.round(h * 60)}분`;
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

function formatDays(h: number): string {
  if (!isFinite(h)) return "-";
  const days = h / 24;
  if (days < 1) return formatHours(h);
  return `${days.toFixed(1)}일 (${formatHours(h)})`;
}

// --- 업그레이드 추천 컴포넌트 ---
function UpgradeRecommendation({
  level1,
  level2,
  data,
  dunjeonPerHarvest,
}: {
  level1: number;
  level2: number;
  data: LevelRow[];
  dunjeonPerHarvest: number;
}) {
  const recommendation = useMemo(() => {
    const DUNJEON_THRESHOLD = 20;

    // 다음 레벨업의 ROI 비교
    const getNextUpgradeRoi = (currentLevel: number) => {
      if (currentLevel >= MAX_LEVEL) return Infinity;
      const row = data[currentLevel - 1]; // fromLevel = currentLevel
      if (!row) return Infinity;
      const dailyGain = row.productionGain * HOURS_PER_DAY;
      return (row.cost * 2) / dailyGain;
    };

    // 20레벨까지 남은 비용 계산
    const getCostToLevel = (from: number, to: number) => {
      return data
        .filter((d) => d.fromLevel >= from && d.fromLevel < to)
        .reduce((sum, d) => sum + d.cost, 0);
    };

    // 20까지 남은 생산량 증가 합산
    const getProductionToLevel = (from: number, to: number) => {
      return data
        .filter((d) => d.fromLevel >= from && d.fromLevel < to)
        .reduce((sum, d) => sum + d.productionGain, 0);
    };

    const roi1 = getNextUpgradeRoi(level1);
    const roi2 = getNextUpgradeRoi(level2);

    const higher = Math.max(level1, level2);
    const lower = Math.min(level1, level2);
    const higherIs1 = level1 >= level2;

    // Case 1: 둘 다 20 이상 → 단순 ROI 비교
    if (level1 >= DUNJEON_THRESHOLD && level2 >= DUNJEON_THRESHOLD) {
      const better = roi1 <= roi2 ? "1동" : "2동";
      const betterRoi = Math.min(roi1, roi2);
      return {
        strategy: "lower_roi",
        title: `${better} 우선 업그레이드`,
        reason: `${better}의 다음 레벨 ROI(${betterRoi.toFixed(1)}일)가 더 효율적입니다.`,
        detail: `1동 다음 ROI: ${roi1.toFixed(1)}일 / 2동 다음 ROI: ${roi2.toFixed(1)}일`,
      };
    }

    // Case 2: 한쪽이 20 미만이고 높은 쪽이 10 이상 → 높은 쪽 20 집중 권장 여부
    if (higher >= 10 && higher < DUNJEON_THRESHOLD) {
      // 높은 쪽을 20까지 밀기 vs 낮은 쪽 올리기 비교
      const costToMax = getCostToLevel(higher, DUNJEON_THRESHOLD);
      const prodToMax = getProductionToLevel(higher, DUNJEON_THRESHOLD);
      const daysToMax = (costToMax * 2) / (prodToMax * HOURS_PER_DAY); // 대략적 ROI

      // 둔전 보너스 가치: 하루 기준
      const dunjeonDailyValue = dunjeonPerHarvest * DUNJEON_BONUS_PER_BUILDING * DUNJEON_PER_DAY;

      // 낮은 쪽에 같은 비용을 넣었을 때 생산량
      const prodIfLower = getProductionToLevel(lower, Math.min(lower + (DUNJEON_THRESHOLD - higher), MAX_LEVEL));
      const dailyIfLower = prodIfLower * HOURS_PER_DAY;

      // 높은 쪽 20 밀기의 실효 가치 = 생산량 + 둔전 보너스
      const dailyIfHigher = prodToMax * HOURS_PER_DAY + dunjeonDailyValue;

      if (dailyIfHigher > dailyIfLower) {
        const which = higherIs1 ? "1동" : "2동";
        return {
          strategy: "rush_20",
          title: `🏆 ${which} → 20레벨 집중 추천`,
          reason: `${which}을 20까지 밀면 둔전 보너스(+${Math.round(dunjeonDailyValue).toLocaleString()}/일)를 빨리 확보할 수 있습니다.`,
          detail: `${which} 20 집중: 실효 +${Math.round(dailyIfHigher).toLocaleString()}/일 vs 낮은 쪽 균등: +${Math.round(dailyIfLower).toLocaleString()}/일`,
        };
      }
    }

    // Case 3: 둘 다 낮음 → 낮은 쪽 우선 (저렙 ROI가 좋음)
    if (higher < 10) {
      if (level1 === level2) {
        return {
          strategy: "equal",
          title: "번갈아 균등 업그레이드",
          reason: "두 건물 레벨이 같으므로 번갈아 올리는 것이 효율적입니다.",
          detail: `다음 레벨 ROI: ${roi1.toFixed(1)}일 (동일)`,
        };
      }
      const lowerName = level1 <= level2 ? "1동" : "2동";
      const lowerRoi = Math.min(roi1, roi2);
      return {
        strategy: "lower_first",
        title: `${lowerName} 우선 (낮은 쪽 먼저)`,
        reason: `저레벨 업그레이드가 ROI(${lowerRoi.toFixed(1)}일)가 더 좋습니다. 낮은 쪽을 먼저 올리세요.`,
        detail: `1동(Lv${level1}) ROI: ${roi1.toFixed(1)}일 / 2동(Lv${level2}) ROI: ${roi2.toFixed(1)}일`,
      };
    }

    // Case 4: 한쪽 10+, 다른 쪽 낮음 → 상황에 따라
    if (lower < 10 && higher >= 10) {
      // 낮은 쪽 ROI가 훨씬 좋으면 낮은 쪽
      if (roi2 < roi1 * 0.7 || roi1 < roi2 * 0.7) {
        const better = roi1 <= roi2 ? "1동" : "2동";
        return {
          strategy: "lower_roi",
          title: `${better} 우선 (ROI 효율)`,
          reason: `${better}의 다음 레벨 ROI가 훨씬 효율적입니다.`,
          detail: `1동(Lv${level1}) ROI: ${roi1.toFixed(1)}일 / 2동(Lv${level2}) ROI: ${roi2.toFixed(1)}일`,
        };
      }

      // 둔전 보너스 고려
      const dunjeonDailyValue = dunjeonPerHarvest * DUNJEON_BONUS_PER_BUILDING * DUNJEON_PER_DAY;
      if (dunjeonDailyValue > 0 && higher >= 15) {
        const which = higherIs1 ? "1동" : "2동";
        return {
          strategy: "rush_20",
          title: `🏆 ${which} → 20레벨 집중 추천`,
          reason: `${which}이 15+이므로 20까지 밀어서 둔전 보너스를 먼저 확보하세요.`,
          detail: `둔전 보너스 확보 시: +${Math.round(dunjeonDailyValue).toLocaleString()}/일`,
        };
      }

      const lowerName = level1 <= level2 ? "1동" : "2동";
      return {
        strategy: "lower_first",
        title: `${lowerName} 우선 (낮은 쪽 ROI 우수)`,
        reason: "저레벨 업그레이드의 투자 효율이 더 높습니다.",
        detail: `1동(Lv${level1}) ROI: ${roi1.toFixed(1)}일 / 2동(Lv${level2}) ROI: ${roi2.toFixed(1)}일`,
      };
    }

    // 기본: ROI 낮은 쪽
    const better = roi1 <= roi2 ? "1동" : "2동";
    return {
      strategy: "lower_roi",
      title: `${better} 우선 업그레이드`,
      reason: `다음 레벨 ROI 기준으로 ${better}이 더 효율적입니다.`,
      detail: `1동(Lv${level1}) ROI: ${roi1.toFixed(1)}일 / 2동(Lv${level2}) ROI: ${roi2.toFixed(1)}일`,
    };
  }, [level1, level2, data, dunjeonPerHarvest]);

  return (
    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
      <h2 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2">
        💡 업그레이드 추천
      </h2>
      <div className="space-y-1">
        <div className="text-sm font-bold text-green-700 dark:text-green-400">
          {recommendation.title}
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          {recommendation.reason}
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 pt-1 border-t border-green-200 dark:border-green-800">
          {recommendation.detail}
        </div>
      </div>
    </div>
  );
}

export default function RoiCalculatorPage() {
  const [data, setData] = useState<LevelRow[]>(createDefaultData);
  const [buildingCount, setBuildingCount] = useState(1);
  const [currentLevel1, setCurrentLevel1] = useState(1);
  const [targetLevel1, setTargetLevel1] = useState(MAX_LEVEL);
  const [currentLevel2, setCurrentLevel2] = useState(1);
  const [targetLevel2, setTargetLevel2] = useState(MAX_LEVEL);
  const [currentDunjeon, setCurrentDunjeon] = useState("");
  const [editingCell, setEditingCell] = useState<{ row: number; field: "cost" | "productionGain" } | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (rowIdx: number, field: "cost" | "productionGain") => {
    setEditingCell({ row: rowIdx, field });
    setEditValue(String(data[rowIdx][field]));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const val = parseInt(editValue);
    if (!isNaN(val) && val > 0) {
      setData((prev) => {
        const next = [...prev];
        next[editingCell.row] = {
          ...next[editingCell.row],
          [editingCell.field]: val,
          confirmed: true,
        };
        return next;
      });
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") setEditingCell(null);
  };

  const resetData = useCallback(() => {
    setData(createDefaultData());
  }, []);

  // 계산
  const analysis = useMemo(() => {
    // 건물 1 계산
    const rows1 = data.filter(
      (d) => d.fromLevel >= currentLevel1 && d.fromLevel < targetLevel1
    );
    let cumCost1 = 0;
    let cumProd1 = BASE_PRODUCTION;
    const detailed1 = rows1.map((row) => {
      cumCost1 += row.cost;
      cumProd1 += row.productionGain;
      const dailyGainThisLevel = row.productionGain * HOURS_PER_DAY;
      const levelRoi = (row.cost * 2) / dailyGainThisLevel;
      return { ...row, cumulativeCost: cumCost1, cumulativeProduction: cumProd1, levelRoi };
    });
    const totalCost1 = cumCost1;
    const totalProd1 = rows1.reduce((sum, r) => sum + r.productionGain, 0);

    // 건물 2 계산 (2동일 때만)
    let totalCost2 = 0;
    let totalProd2 = 0;
    let detailed2: typeof detailed1 = [];
    if (buildingCount === 2) {
      const rows2 = data.filter(
        (d) => d.fromLevel >= currentLevel2 && d.fromLevel < targetLevel2
      );
      let cumCost2 = 0;
      let cumProd2 = BASE_PRODUCTION;
      detailed2 = rows2.map((row) => {
        cumCost2 += row.cost;
        cumProd2 += row.productionGain;
        const dailyGainThisLevel = row.productionGain * HOURS_PER_DAY;
        const levelRoi = (row.cost * 2) / dailyGainThisLevel;
        return { ...row, cumulativeCost: cumCost2, cumulativeProduction: cumProd2, levelRoi };
      });
      totalCost2 = cumCost2;
      totalProd2 = rows2.reduce((sum, r) => sum + r.productionGain, 0);
    }

    const totalCostAllBuildings = totalCost1 + totalCost2;
    const totalProductionAll = totalProd1 + totalProd2;

    // 하루 추가 생산량 = 시간당 증가 × 24시간
    const dailyGainAll = totalProductionAll * HOURS_PER_DAY;

    // 둔전 보너스 (20레벨 달성 시 둔전 수확량 +25%/동, 하루 5회)
    const baseDunjeonPerHarvest = parseFloat(currentDunjeon) || 0;
    const maxedBuildings = (targetLevel1 >= 20 ? 1 : 0) + (buildingCount === 2 && targetLevel2 >= 20 ? 1 : 0);
    const dunjeonBonusPerHarvest = baseDunjeonPerHarvest * DUNJEON_BONUS_PER_BUILDING * maxedBuildings;
    const dailyDunjeonBonus = dunjeonBonusPerHarvest * DUNJEON_PER_DAY;

    const totalDailyGainWithBonus = dailyGainAll + dailyDunjeonBonus;

    // ROI 순수 (건물 생산량만): 20레벨 달성 전 회수 속도
    const overallRoiDaysBase = dailyGainAll > 0 ? (totalCostAllBuildings * 2) / dailyGainAll : Infinity;
    // ROI 보너스 포함: 20레벨 달성 후 회수 속도
    const overallRoiDaysWithBonus = totalDailyGainWithBonus > 0 ? (totalCostAllBuildings * 2) / totalDailyGainWithBonus : Infinity;

    return {
      detailed1,
      detailed2,
      totalCostAllBuildings,
      totalProductionAll,
      dailyGainAll,
      dunjeonBonusPerHarvest,
      dailyDunjeonBonus,
      totalDailyGainWithBonus,
      overallRoiDaysBase,
      overallRoiDaysWithBonus,
      maxedBuildings,
    };
  }, [data, currentLevel1, targetLevel1, currentLevel2, targetLevel2, buildingCount, currentDunjeon]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">📈 자원 건물 ROI 계산기</h1>
          <div className="flex gap-2">
            <button
              onClick={resetData}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            >
              데이터 초기화
            </button>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            >
              ← 가이드로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* 설정 */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold">설정</h2>

          {/* 건물 수 */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">건물 수</label>
            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setBuildingCount(n)}
                  className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${
                    buildingCount === n
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {n}동
                </button>
              ))}
            </div>
          </div>

          {/* 건물별 레벨 설정 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1동 */}
            <div className="p-3 rounded border border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">1동</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400">현재</label>
                  <select
                    value={currentLevel1}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCurrentLevel1(v);
                      if (v >= targetLevel1) setTargetLevel1(Math.min(v + 1, MAX_LEVEL));
                    }}
                    className="w-full mt-0.5 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                  >
                    {Array.from({ length: MAX_LEVEL - 1 }, (_, i) => i + 1).map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">목표</label>
                  <select
                    value={targetLevel1}
                    onChange={(e) => setTargetLevel1(Number(e.target.value))}
                    className="w-full mt-0.5 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                  >
                    {Array.from({ length: MAX_LEVEL - currentLevel1 }, (_, i) => currentLevel1 + 1 + i).map((lv) => (
                      <option key={lv} value={lv}>{lv}{lv === MAX_LEVEL ? " (최대)" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2동 */}
            {buildingCount === 2 && (
              <div className="p-3 rounded border border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">2동</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400">현재</label>
                    <select
                      value={currentLevel2}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setCurrentLevel2(v);
                        if (v >= targetLevel2) setTargetLevel2(Math.min(v + 1, MAX_LEVEL));
                      }}
                      className="w-full mt-0.5 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                    >
                      {Array.from({ length: MAX_LEVEL - 1 }, (_, i) => i + 1).map((lv) => (
                        <option key={lv} value={lv}>{lv}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400">목표</label>
                    <select
                      value={targetLevel2}
                      onChange={(e) => setTargetLevel2(Number(e.target.value))}
                      className="w-full mt-0.5 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                    >
                      {Array.from({ length: MAX_LEVEL - currentLevel2 }, (_, i) => currentLevel2 + 1 + i).map((lv) => (
                        <option key={lv} value={lv}>{lv}{lv === MAX_LEVEL ? " (최대)" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 둔전 */}
          <div className="max-w-[200px]">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              현재 둔전 1회 수확량
            </label>
            <input
              type="number"
              placeholder="예: 5000"
              value={currentDunjeon}
              onChange={(e) => setCurrentDunjeon(e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
            />
          </div>
        </div>

        {/* 결과 요약 */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
          <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">
            📊 {buildingCount === 1
              ? `${currentLevel1}→${targetLevel1}레벨 (1동)`
              : `1동: ${currentLevel1}→${targetLevel1} / 2동: ${currentLevel2}→${targetLevel2}`}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-zinc-600 dark:text-zinc-400">총 비용 (목재)</div>
            <div className="font-bold text-right">{formatNumber(analysis.totalCostAllBuildings)}</div>

            <div className="text-zinc-600 dark:text-zinc-400">총 비용 (철광)</div>
            <div className="font-bold text-right">{formatNumber(analysis.totalCostAllBuildings)}</div>

            <div className="text-zinc-600 dark:text-zinc-400">총 비용 합산 (목+철)</div>
            <div className="font-bold text-right text-amber-700 dark:text-amber-300">
              {formatNumber(analysis.totalCostAllBuildings * 2)}
            </div>

            <div className="col-span-2 border-t border-amber-200 dark:border-amber-700 my-1" />

            <div className="text-zinc-600 dark:text-zinc-400">시간당 생산량 증가</div>
            <div className="font-bold text-right text-green-700 dark:text-green-400">
              +{analysis.totalProductionAll.toLocaleString()}/h
            </div>

            <div className="text-zinc-600 dark:text-zinc-400">하루 추가 생산량 (×24h)</div>
            <div className="font-bold text-right text-green-700 dark:text-green-400">
              +{analysis.dailyGainAll.toLocaleString()}/일
            </div>

            {analysis.dailyDunjeonBonus > 0 && (
              <>
                <div className="text-zinc-600 dark:text-zinc-400">둔전 보너스 (+{analysis.maxedBuildings * 25}%, 5회/일)</div>
                <div className="font-bold text-right text-blue-600 dark:text-blue-400">
                  +{Math.round(analysis.dailyDunjeonBonus).toLocaleString()}/일
                </div>
              </>
            )}

            <div className="col-span-2 border-t border-amber-200 dark:border-amber-700 my-1" />

            <div className="text-zinc-600 dark:text-zinc-400">투자 회수 기간 (ROI)</div>
            <div className="font-bold text-right text-amber-700 dark:text-amber-300">
              {isFinite(analysis.overallRoiDaysBase) ? `${analysis.overallRoiDaysBase.toFixed(1)}일` : "-"}
            </div>

            {analysis.dailyDunjeonBonus > 0 && (
              <>
                <div className="text-zinc-600 dark:text-zinc-400">ROI (20레벨 후 둔전 포함)</div>
                <div className="font-bold text-right text-blue-600 dark:text-blue-400">
                  {isFinite(analysis.overallRoiDaysWithBonus) ? `${analysis.overallRoiDaysWithBonus.toFixed(1)}일` : "-"}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 업그레이드 추천 */}
        {buildingCount === 2 && (
          <UpgradeRecommendation
            level1={currentLevel1}
            level2={currentLevel2}
            data={data}
            dunjeonPerHarvest={parseFloat(currentDunjeon) || 0}
          />
        )}

        {/* 편집 가능한 레벨별 테이블 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold">{buildingCount === 2 ? "1동 " : ""}레벨별 상세 (클릭하여 수정)</h2>
            <span className="text-[10px] text-zinc-400">
              ⚡ 확인됨 / 📐 추정값 — 셀 클릭으로 실제 값 입력
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                  <th className="py-2 px-1 text-left">레벨</th>
                  <th className="py-2 px-1 text-right">비용 (각 자원)</th>
                  <th className="py-2 px-1 text-right">생산량 증가/h</th>
                  <th className="py-2 px-1 text-right">총 생산량/h</th>
                  <th className="py-2 px-1 text-right">이번 레벨 ROI (일)</th>
                </tr>
              </thead>
              <tbody>
                {analysis.detailed1.map((row) => {
                  const dataIdx = row.fromLevel - 1;
                  const isEditing = editingCell?.row === dataIdx;

                  return (
                    <tr
                      key={row.fromLevel}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="py-1.5 px-1 font-medium">
                        {row.fromLevel}→{row.fromLevel + 1}
                      </td>
                      <td
                        className="py-1.5 px-1 text-right cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
                        onClick={() => handleStartEdit(dataIdx, "cost")}
                      >
                        {isEditing && editingCell.field === "cost" ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            className="w-20 px-1 py-0.5 text-right text-xs border rounded bg-white dark:bg-zinc-800"
                            autoFocus
                          />
                        ) : (
                          <span className={row.confirmed ? "" : "text-zinc-400 italic"}>
                            {row.confirmed ? "⚡" : "📐"} {formatNumber(row.cost)}
                          </span>
                        )}
                      </td>
                      <td
                        className="py-1.5 px-1 text-right cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-green-600 dark:text-green-400"
                        onClick={() => handleStartEdit(dataIdx, "productionGain")}
                      >
                        {isEditing && editingCell.field === "productionGain" ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            className="w-16 px-1 py-0.5 text-right text-xs border rounded bg-white dark:bg-zinc-800"
                            autoFocus
                          />
                        ) : (
                          <span>+{row.productionGain}</span>
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-right">
                        {row.cumulativeProduction.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-1 text-right">
                        {row.levelRoi.toFixed(1)}일
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 참고 */}
        <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <p>• ⚡ = 확인된 값, 📐 = 추정값 (셀 클릭으로 실제 값 입력 가능)</p>
          <p>• 비용: 목재/철광 동일 금액 소모</p>
          <p>• 건물 최대 2동, 각 최대 25레벨</p>
          <p>• 20레벨 달성 시 둔전 수확량 +25%/동 보너스 (1회성)</p>
          <p>• 둔전: 하루 5회 충전</p>
          <p>• ROI = 총 투입 자원(목+철) ÷ 하루 추가 생산량</p>
        </div>
      </main>
    </div>
  );
}
