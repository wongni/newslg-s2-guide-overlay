"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";

// --- 상수 ---
const MAX_LEVEL = 20;
const MAX_BUILDINGS = 2;
const DUNJEON_BONUS_PER_BUILDING = 0.25;
const DUNJEON_PER_DAY = 5; // 둔전 하루 5회 충전
const HOURS_PER_DAY = 24;

// 생산량 증가 패턴 (확인됨):
// 도달 레벨 2~5: +200/레벨 (fromLevel 1~4)
// 도달 레벨 6~10: +400/레벨 (fromLevel 5~9)
// 도달 레벨 11~15: +600/레벨 (fromLevel 10~14)
// 도달 레벨 16~20: +800/레벨 (fromLevel 15~19) (추정)
function defaultProductionGain(fromLevel: number): number {
  const targetLevel = fromLevel + 1;
  if (targetLevel <= 5) return 200;
  if (targetLevel <= 10) return 400;
  if (targetLevel <= 15) return 600;
  return 800;
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
  } else {
    // 15→16 시작 추정: 44500 + 5*5500 = 72000, 증가폭 8000 추정
    return 72000 + (fromLevel - 15) * 8000;
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

export default function RoiCalculatorPage() {
  const [data, setData] = useState<LevelRow[]>(createDefaultData);
  const [buildingCount, setBuildingCount] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(MAX_LEVEL);
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
    const rows = data.filter(
      (d) => d.fromLevel >= currentLevel && d.fromLevel < targetLevel
    );

    let cumulativeCost = 0;
    let cumulativeProduction = BASE_PRODUCTION; // 1레벨 기본 생산량 포함

    const detailed = rows.map((row) => {
      cumulativeCost += row.cost;
      cumulativeProduction += row.productionGain;
      // ROI for this level: cost(both resources) / daily gain from this level
      const dailyGainThisLevel = row.productionGain * HOURS_PER_DAY;
      const levelRoi = (row.cost * 2) / dailyGainThisLevel;
      return {
        ...row,
        cumulativeCost,
        cumulativeProduction,
        levelRoi,
      };
    });

    const totalCostPerResource = cumulativeCost;
    const totalCostBoth = totalCostPerResource * 2;
    const totalProduction = cumulativeProduction;
    const totalCostAllBuildings = totalCostPerResource * buildingCount;
    const totalProductionAll = totalProduction * buildingCount;

    // 하루 추가 생산량 = 시간당 증가 × 24시간 × 건물 수
    const dailyGainAll = totalProductionAll * HOURS_PER_DAY;

    // 둔전 보너스 (20레벨 달성 시 둔전 수확량 +25%/동, 하루 5회)
    const baseDunjeonPerHarvest = parseFloat(currentDunjeon) || 0;
    const dunjeonBonusPerHarvest =
      targetLevel === MAX_LEVEL ? baseDunjeonPerHarvest * DUNJEON_BONUS_PER_BUILDING * buildingCount : 0;
    const dailyDunjeonBonus = dunjeonBonusPerHarvest * DUNJEON_PER_DAY;

    const totalDailyGainWithBonus = dailyGainAll + dailyDunjeonBonus;

    // Overall ROI: total cost (both resources, all buildings) / daily gain
    const overallRoiDays = totalDailyGainWithBonus > 0 ? (totalCostAllBuildings * 2) / totalDailyGainWithBonus : Infinity;

    return {
      detailed,
      totalCostPerResource,
      totalCostBoth,
      totalProduction,
      totalCostAllBuildings,
      totalProductionAll,
      dailyGainAll,
      dunjeonBonusPerHarvest,
      dailyDunjeonBonus,
      totalDailyGainWithBonus,
      overallRoiDays,
      levelsCount: rows.length,
    };
  }, [data, currentLevel, targetLevel, buildingCount, currentDunjeon]);

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">현재 레벨</label>
              <select
                value={currentLevel}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setCurrentLevel(v);
                  if (v >= targetLevel) setTargetLevel(Math.min(v + 1, MAX_LEVEL));
                }}
                className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              >
                {Array.from({ length: MAX_LEVEL - 1 }, (_, i) => i + 1).map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">목표 레벨</label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              >
                {Array.from({ length: MAX_LEVEL - currentLevel }, (_, i) => currentLevel + 1 + i).map((lv) => (
                  <option key={lv} value={lv}>{lv}{lv === MAX_LEVEL ? " (최대)" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">건물 수</label>
              <div className="flex gap-2 mt-1">
                {[1, 2].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBuildingCount(n)}
                    className={`flex-1 py-1.5 rounded text-sm font-bold transition-colors ${
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
            <div>
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
        </div>

        {/* 결과 요약 */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
          <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">
            📊 {currentLevel}레벨 → {targetLevel}레벨 (×{buildingCount}동)
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
                <div className="text-zinc-600 dark:text-zinc-400">둔전 보너스 (+{buildingCount * 25}%, 5회/일)</div>
                <div className="font-bold text-right text-blue-600 dark:text-blue-400">
                  +{Math.round(analysis.dailyDunjeonBonus).toLocaleString()}/일
                </div>
              </>
            )}

            <div className="col-span-2 border-t border-amber-200 dark:border-amber-700 my-1" />

            <div className="text-zinc-600 dark:text-zinc-400">투자 회수 기간 (ROI)</div>
            <div className="font-bold text-right text-amber-700 dark:text-amber-300">
              {isFinite(analysis.overallRoiDays) ? `${analysis.overallRoiDays.toFixed(1)}일` : "-"}
            </div>
          </div>
        </div>

        {/* 편집 가능한 레벨별 테이블 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold">레벨별 상세 (클릭하여 수정)</h2>
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
                {analysis.detailed.map((row, idx) => {
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
          <p>• 건물 최대 2동, 각 최대 20레벨</p>
          <p>• 20레벨 달성 시 둔전 수확량 +25%/동 보너스</p>
          <p>• 둔전: 하루 5회 충전</p>
          <p>• ROI = 총 투입 자원(목+철) ÷ 하루 추가 생산량</p>
        </div>
      </main>
    </div>
  );
}
