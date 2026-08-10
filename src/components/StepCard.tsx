"use client";

import { GuideStep } from "@/types/guide";
import { renderWithTooltips } from "@/components/TooltipText";

interface StepCardProps {
  step: GuideStep;
  isCompleted: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onToggleExpand: () => void;
  compact?: boolean;
}

export function StepCard({
  step,
  isCompleted,
  isCurrent,
  isExpanded,
  onToggle,
  onToggleExpand,
  compact = false,
}: StepCardProps) {
  return (
    <div
      className={`flex ${compact ? "gap-2" : "gap-3"} ${
        isCurrent ? `rounded-lg ring-2 ring-amber-500 dark:ring-amber-500/70` : ""
      }`}
    >
      {/* Checkbox + Step number */}
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
        <button
          onClick={() => onToggle(step.id)}
          className={`flex items-center justify-center rounded border transition-colors ${
            compact ? "w-5 h-5" : "w-6 h-6"
          } ${
            isCompleted
              ? "bg-green-600/80 border-green-500 text-white"
              : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-transparent hover:border-zinc-500 dark:hover:border-zinc-400"
          }`}
          title={isCompleted ? "완료 취소" : "완료 표시"}
          aria-label={isCompleted ? `${step.id}단계 완료 취소` : `${step.id}단계 완료 표시`}
        >
          {isCompleted && (
            <svg
              className={compact ? "w-3 h-3" : "w-3.5 h-3.5"}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
        <span
          className={`font-mono font-bold ${
            compact ? "text-[10px]" : "text-xs"
          } ${isCompleted ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500"}`}
        >
          {step.id.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Card body */}
      <div
        onClick={onToggleExpand}
        className={`flex-1 cursor-pointer rounded-lg border transition-colors ${
          compact ? "px-3 py-2 text-sm" : "px-4 py-3"
        } ${
          isCompleted
            ? "border-green-300/50 dark:border-green-800/30 bg-green-50 dark:bg-green-950/20 opacity-60"
            : isCurrent
            ? "border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/5"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {step.phase}
          </span>
          <span
            className={`font-medium ${
              isCompleted ? "line-through text-zinc-400 dark:text-zinc-500" : ""
            }`}
          >
            {renderWithTooltips(step.title)}
          </span>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className={`mt-3 space-y-2.5 ${compact ? "text-xs" : "text-sm"}`}>
            {/* Tasks */}
            <div>
              <div className="text-zinc-800 dark:text-zinc-400 font-semibold mb-1">할 일</div>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-800 dark:text-zinc-300">
                {step.tasks.map((task, i) => (
                  <li key={i}>{renderWithTooltips(task)}</li>
                ))}
              </ul>
            </div>

            {/* Conditions */}
            {step.conditions && step.conditions.length > 0 && (
              <div>
                <div className="text-blue-700 dark:text-blue-400 font-semibold mb-1">조건</div>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
                  {step.conditions.map((cond, i) => (
                    <li key={i}>{renderWithTooltips(cond)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {step.warnings && step.warnings.length > 0 && (
              <div>
                <div className="text-red-700 dark:text-red-400 font-semibold mb-1">⚠ 주의</div>
                <ul className="list-disc list-inside space-y-0.5 text-red-800 dark:text-red-300">
                  {step.warnings.map((warn, i) => (
                    <li key={i}>{renderWithTooltips(warn)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <div>
                <div className="text-sky-700 dark:text-sky-400 font-semibold mb-1">💡 팁</div>
                <ul className="list-disc list-inside space-y-0.5 text-sky-800 dark:text-sky-300">
                  {step.tips.map((tip, i) => (
                    <li key={i}>{renderWithTooltips(tip)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
