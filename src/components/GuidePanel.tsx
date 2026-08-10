"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import guideSteps from "@/data/guide-steps.json";
import { GuideStepRaw } from "@/types/guide";
import { useProgress } from "@/hooks/useProgress";
import { useTier } from "@/hooks/useTier";
import { resolveSteps } from "@/lib/resolveSteps";
import { StepCard } from "@/components/StepCard";
import { ProgressBar } from "@/components/ProgressBar";
import { TierSelector } from "@/components/TierSelector";

const rawSteps: GuideStepRaw[] = guideSteps;

interface GuidePanelProps {
  compact?: boolean;
  extraActions?: React.ReactNode;
}

export function GuidePanel({ compact = false, extraActions }: GuidePanelProps) {
  const { tier, setTier } = useTier();
  const { theme, setTheme } = useTheme();
  const steps = useMemo(() => resolveSteps(rawSteps, tier), [tier]);

  const { completed, toggle, reset, progressCount, progressPercent, currentStepId } =
    useProgress(steps.length);

  const currentRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(steps.map((s) => s.id)));
  }, [steps]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const allExpanded = expandedIds.size === steps.length;

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Auto-scroll to current step (compact/PiP mode only)
  useEffect(() => {
    if (compact && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStepId, compact]);

  return (
    <div className="min-h-screen transition-colors bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95">
        <div className={compact ? "px-3 py-2" : "max-w-3xl mx-auto px-4 py-4"}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={compact ? "text-sm font-bold" : "text-lg font-bold"}>
                {compact ? "S2 개척 가이드" : "삼국지 천하결전 S2 개척 가이드"}
              </h1>
              {!compact && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  S3 시즌(글로벌 S2) · 원문: slgguxi 古今工作室 · 번역: 3서버 담덕
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className={`rounded transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 ${
                  compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-2 text-sm"
                }`}
                title={theme === "dark" ? "라이트 모드" : "다크 모드"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                onClick={allExpanded ? collapseAll : expandAll}
                className={`rounded transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 ${
                  compact ? "px-1.5 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs"
                }`}
              >
                {allExpanded ? "▲ 접기" : "▼ 펼치기"}
              </button>
              {!compact && (
                <button
                  onClick={reset}
                  className="px-3 py-2 rounded-lg text-sm transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                >
                  초기화
                </button>
              )}
              {extraActions}
            </div>
          </div>
          <TierSelector tier={tier} onChangeTier={setTier} compact={compact} />
          <ProgressBar
            current={progressCount}
            total={steps.length}
            percent={progressPercent}
            compact={compact}
          />
        </div>
      </header>

      {/* Steps */}
      <main className={compact ? "px-2 py-2" : "max-w-3xl mx-auto px-4 py-6"}>
        <div className={compact ? "space-y-1" : "space-y-2"}>
          {steps.map((step) => (
            <div
              key={step.id}
              ref={step.id === currentStepId ? currentRef : undefined}
            >
              <StepCard
                step={step}
                isCompleted={completed.has(step.id)}
                isCurrent={step.id === currentStepId}
                isExpanded={expandedIds.has(step.id)}
                onToggle={toggle}
                onToggleExpand={() => toggleExpand(step.id)}
                compact={compact}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
