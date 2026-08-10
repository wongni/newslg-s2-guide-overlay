"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  percent: number;
  compact?: boolean;
}

export function ProgressBar({ current, total, percent, compact = false }: ProgressBarProps) {
  return (
    <div className={compact ? "py-1.5" : "py-2"}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-medium text-zinc-600 dark:text-zinc-300 ${compact ? "text-[10px]" : "text-xs"}`}>
          {current} / {total}
        </span>
        <span
          className={`font-bold ${compact ? "text-[10px]" : "text-xs"} ${
            percent === 100 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {percent}%
        </span>
      </div>
      <div className={`w-full rounded-full bg-zinc-200 dark:bg-zinc-800 ${compact ? "h-1.5" : "h-2"}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percent === 100 ? "bg-green-500" : "bg-amber-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
