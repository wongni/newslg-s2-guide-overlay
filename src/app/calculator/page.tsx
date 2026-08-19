"use client";

import { useState, useCallback } from "react";

interface ResourceInput {
  current: string;
  required: string;
  perHour: string;
}

interface ResourceResult {
  name: string;
  deficit: number;
  hoursNeeded: number;
}

const UNIT = 10000;

export default function CalculatorPage() {
  const [wood, setWood] = useState<ResourceInput>({ current: "", required: "", perHour: "" });
  const [iron, setIron] = useState<ResourceInput>({ current: "", required: "", perHour: "" });
  const [stone, setStone] = useState<ResourceInput>({ current: "", required: "", perHour: "" });
  const [result, setResult] = useState<{
    totalHours: number;
    totalMinutes: number;
    completionTime: string;
    details: ResourceResult[];
  } | null>(null);

  const calculate = useCallback(() => {
    const resources = [
      { name: "목재", ...wood },
      { name: "철광석", ...iron },
      { name: "석재", ...stone },
    ];

    const details: ResourceResult[] = [];
    let maxHours = 0;

    for (const res of resources) {
      const current = (parseFloat(res.current) || 0) * UNIT;
      const required = (parseFloat(res.required) || 0) * UNIT;
      const perHour = (parseFloat(res.perHour) || 0) * UNIT;

      const deficit = required - current;

      if (deficit <= 0) {
        details.push({ name: res.name, deficit: 0, hoursNeeded: 0 });
        continue;
      }

      if (perHour <= 0) {
        details.push({ name: res.name, deficit, hoursNeeded: Infinity });
        maxHours = Infinity;
        continue;
      }

      const hoursNeeded = deficit / perHour;
      details.push({ name: res.name, deficit, hoursNeeded });
      maxHours = Math.max(maxHours, hoursNeeded);
    }

    const totalHours = Math.floor(maxHours);
    const totalMinutes = Math.round((maxHours - totalHours) * 60);

    const now = new Date();
    const completionDate = new Date(now.getTime() + maxHours * 60 * 60 * 1000);
    const completionTime = isFinite(maxHours)
      ? completionDate.toLocaleString("ko-KR", {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "계산 불가 (시간당 수급량을 입력해주세요)";

    setResult({ totalHours, totalMinutes, completionTime, details });
  }, [wood, iron, stone]);

  const resetForm = useCallback(() => {
    setWood({ current: "", required: "", perHour: "" });
    setIron({ current: "", required: "", perHour: "" });
    setStone({ current: "", required: "", perHour: "" });
    setResult(null);
  }, []);

  const updateField = (
    resource: "wood" | "iron" | "stone",
    field: keyof ResourceInput,
    value: string
  ) => {
    const setters = { wood: setWood, iron: setIron, stone: setStone };
    const states = { wood, iron, stone };
    setters[resource]({ ...states[resource], [field]: value });
  };

  const inputClass =
    "w-full px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center";

  const resources = ["wood", "iron", "stone"] as const;
  const resourceLabels = { wood: "🪵 목재", iron: "⛏️ 철광석", stone: "🪨 석재" };
  const fields = ["current", "required", "perHour"] as const;
  const fieldLabels = { current: "보유량", required: "필요량", perHour: "시간당 수급" };

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Page title */}
        <h1 className="text-lg font-bold">🏗️ 건물 업그레이드 계산기</h1>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
          단위: 만 (소숫점 가능)
        </p>

        {/* Table: rows=카테고리, cols=자원 */}
        <div className="space-y-3">
          {/* Column headers (resources) */}
          <div className="grid grid-cols-[5.5rem_1fr_1fr_1fr] gap-2 items-center">
            <div />
            {resources.map((r) => (
              <div
                key={r}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 text-center"
              >
                {resourceLabels[r]}
              </div>
            ))}
          </div>

          {/* Rows (fields: 보유량, 필요량, 시간당 수급) */}
          {fields.map((field) => (
            <div
              key={field}
              className="grid grid-cols-[5.5rem_1fr_1fr_1fr] gap-2 items-center"
            >
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {fieldLabels[field]}
              </label>
              {resources.map((r) => (
                <input
                  key={`${field}-${r}`}
                  type="number"
                  step="any"
                  tabIndex={0}
                  placeholder="0"
                  value={{ wood, iron, stone }[r][field]}
                  onChange={(e) => updateField(r, field, e.target.value)}
                  className={inputClass}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={calculate}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 transition-colors"
          >
            계산하기
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300"
          >
            초기화
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
              📊 계산 결과
            </h3>

            {/* Per-resource breakdown */}
            <div className="space-y-1 mb-3">
              {result.details.map((d) => (
                <div
                  key={d.name}
                  className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400"
                >
                  <span>{d.name}</span>
                  <span>
                    {d.deficit <= 0
                      ? "✅ 충분"
                      : d.hoursNeeded === Infinity
                        ? `부족: ${(d.deficit / UNIT).toFixed(1)}만 (수급량 미입력)`
                        : `부족: ${(d.deficit / UNIT).toFixed(1)}만 → ${Math.floor(d.hoursNeeded)}시간 ${Math.round((d.hoursNeeded % 1) * 60)}분`}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-amber-200 dark:border-amber-800 pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">소요 시간</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {isFinite(result.totalHours)
                    ? `${result.totalHours}시간 ${result.totalMinutes}분`
                    : "계산 불가"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">완료 예상 시각</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {result.completionTime}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
