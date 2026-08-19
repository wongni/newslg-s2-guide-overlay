"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import guideSteps from "@/data/guide-steps.json";
import { GuideStepRaw } from "@/types/guide";
import { TIER_VALUES, COMMON_VALUES, TierValuesMap, CommonValuesMap } from "@/data/tier-config";
import { useProgress } from "@/hooks/useProgress";
import { useCustomGuide } from "@/hooks/useCustomGuide";
import { useTier } from "@/hooks/useTier";
import { resolveSteps } from "@/lib/resolveSteps";
import { StepCard } from "@/components/StepCard";
import { buildGlossary } from "@/components/TooltipText";
import { ProgressBar } from "@/components/ProgressBar";
import { TierSelector } from "@/components/TierSelector";
import { GuideSourceSelector } from "@/components/GuideSourceSelector";
import { GuideEditor } from "@/components/GuideEditor";
import { ShareGuideModal } from "@/components/ShareGuideModal";
import { BaseGuidePicker } from "@/components/BaseGuidePicker";
import { useAuthContext } from "@/components/AuthProvider";

const rawSteps: GuideStepRaw[] = guideSteps;
const defaultTierValues: TierValuesMap = TIER_VALUES;
const defaultCommonValues: CommonValuesMap = COMMON_VALUES;

interface GuidePanelProps {
  compact?: boolean;
}

export function GuidePanel({ compact = false }: GuidePanelProps) {
  const { tier, setTier } = useTier();
  const { user } = useAuthContext();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"server" | "admin">("server");
  const [editorGuideCode, setEditorGuideCode] = useState<string | undefined>(undefined);
  const [editorGuideTitle, setEditorGuideTitle] = useState<string | undefined>(undefined);
  const [editorIsPublic, setEditorIsPublic] = useState<boolean | undefined>(undefined);
  const [editorBaseSteps, setEditorBaseSteps] = useState<GuideStepRaw[]>(rawSteps);
  const [editorBaseTierValues, setEditorBaseTierValues] = useState<TierValuesMap>(defaultTierValues);
  const [editorBaseCommonValues, setEditorBaseCommonValues] = useState<CommonValuesMap>(defaultCommonValues);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    source,
    activeSteps,
    activeTierValues,
    activeCommonValues,
    defaultSteps,
    defaultTierValues: resolvedDefaultTierValues,
    defaultCommonValues: resolvedDefaultCommonValues,
    refreshServerData,
    // Glossary
    adminGlossary,
    activeGuideGlossary,
    // Temp guide
    hasTempGuide,
    clearTempGuide,
    // Multi-guide support
    myGuides,
    activeGuideCode,
    selectGuide,
    fetchMyGuides,
  } = useCustomGuide(rawSteps, defaultTierValues, defaultCommonValues, user?.id ?? null);

  const steps = useMemo(
    () => resolveSteps(activeSteps, tier, activeTierValues, activeCommonValues),
    [activeSteps, tier, activeTierValues, activeCommonValues]
  );

  const mergedGlossary = useMemo(
    () => buildGlossary(adminGlossary, activeGuideGlossary),
    [adminGlossary, activeGuideGlossary]
  );

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

  const handleSelectDefault = () => {
    selectGuide(null);
  };

  const handleSelectTemp = () => {
    selectGuide(null);
  };

  const handleCreateGuide = () => {
    setPickerOpen(true);
  };

  const handleBaseSelected = (
    baseSteps: GuideStepRaw[],
    baseTierValues: TierValuesMap,
    baseCommonValues: CommonValuesMap
  ) => {
    setPickerOpen(false);
    setEditorMode("server");
    setEditorGuideCode(undefined);
    setEditorGuideTitle(undefined);
    setEditorIsPublic(false);
    setEditorBaseSteps(baseSteps);
    setEditorBaseTierValues(baseTierValues);
    setEditorBaseCommonValues(baseCommonValues);
    setEditorOpen(true);
  };

  const handleEditGuide = () => {
    if (source === "server" && activeGuideCode) {
      const guideInfo = myGuides.find((g) => g.code === activeGuideCode);
      setEditorMode("server");
      setEditorGuideCode(activeGuideCode);
      setEditorGuideTitle(guideInfo?.title || "");
      setEditorIsPublic(guideInfo?.isPublic ?? false);
      setEditorOpen(true);
    }
  };

  const handleAdminEdit = () => {
    setEditorMode("admin");
    setEditorGuideCode(undefined);
    setEditorGuideTitle(undefined);
    setEditorIsPublic(undefined);
    setEditorOpen(true);
  };

  const handleEditorSave = (
    _steps: GuideStepRaw[],
    _tierValues: TierValuesMap,
    _commonValues: CommonValuesMap
  ) => {
    if (editorMode === "server") {
      fetchMyGuides();
      if (activeGuideCode) {
        selectGuide(activeGuideCode);
      }
    } else {
      refreshServerData();
    }
  };

  // Auto-scroll to current step (compact/PiP mode only)
  useEffect(() => {
    if (compact && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStepId, compact]);

  // Compact mode (PiP overlay) - keep the original self-contained layout
  if (compact) {
    return (
      <div className="min-h-screen transition-colors bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <header className="sticky top-0 z-10 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold">S2 개척 가이드</h1>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={allExpanded ? collapseAll : expandAll}
                  className="px-1.5 py-0.5 text-[10px] rounded transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                >
                  {allExpanded ? "▲ 접기" : "▼ 펼치기"}
                </button>
              </div>
            </div>
            <TierSelector tier={tier} onChangeTier={setTier} compact={true} />
            <ProgressBar
              current={progressCount}
              total={steps.length}
              percent={progressPercent}
              compact={true}
            />
          </div>
        </header>

        <main className="px-2 py-2">
          <div className="space-y-1">
            {steps.map((step) => (
              <div key={step.id} ref={step.id === currentStepId ? currentRef : undefined}>
                <StepCard
                  step={step}
                  isCompleted={completed.has(step.id)}
                  isCurrent={step.id === currentStepId}
                  isExpanded={expandedIds.has(step.id)}
                  onToggle={toggle}
                  onToggleExpand={() => toggleExpand(step.id)}
                  compact={true}
                  glossary={mergedGlossary}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Normal mode - no outer header/background (AppShell provides that)
  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      {/* Guide controls bar */}
      <div className="sticky top-14 z-30 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Action buttons row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={allExpanded ? collapseAll : expandAll}
              className="px-3 py-1.5 text-xs rounded-md transition-colors bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            >
              {allExpanded ? "▲ 접기" : "▼ 펼치기"}
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-xs rounded-md transition-colors bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            >
              초기화
            </button>
            {user?.role === "admin" && (
              <button
                onClick={handleAdminEdit}
                className="px-2 py-1.5 text-xs rounded-md transition-colors bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                title="Admin 수정"
              >
                🔒
              </button>
            )}
          </div>

          {/* Guide source selector */}
          <GuideSourceSelector
            source={source}
            user={user}
            myGuides={myGuides}
            activeGuideCode={activeGuideCode}
            hasTempGuide={hasTempGuide}
            onSelectDefault={handleSelectDefault}
            onSelectGuide={(code) => selectGuide(code)}
            onSelectTemp={handleSelectTemp}
            onClearTemp={clearTempGuide}
            onCreateGuide={handleCreateGuide}
            onEditGuide={handleEditGuide}
          />

          {/* Share button */}
          {source === "server" && activeGuideCode && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setShareModalOpen(true)}
                className="px-3 py-1 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                🚀 커뮤니티에 공유
              </button>
            </div>
          )}

          {/* Tier & Progress */}
          <TierSelector tier={tier} onChangeTier={setTier} compact={false} />
          <ProgressBar
            current={progressCount}
            total={steps.length}
            percent={progressPercent}
            compact={false}
          />
        </div>
      </div>

      {/* Subtitle */}
      <div className="max-w-3xl mx-auto px-4 pt-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          S3 시즌(글로벌 S2) · 원문: slgguxi 古今工作室 · 번역: 3서버 담덕
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} ref={step.id === currentStepId ? currentRef : undefined}>
              <StepCard
                step={step}
                isCompleted={completed.has(step.id)}
                isCurrent={step.id === currentStepId}
                isExpanded={expandedIds.has(step.id)}
                onToggle={toggle}
                onToggleExpand={() => toggleExpand(step.id)}
                compact={false}
                glossary={mergedGlossary}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      {/* Base Guide Picker */}
      <BaseGuidePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleBaseSelected}
        defaultSteps={defaultSteps}
        defaultTierValues={resolvedDefaultTierValues}
        defaultCommonValues={resolvedDefaultCommonValues}
        myGuides={myGuides}
      />

      {editorOpen && (
        <GuideEditor
          steps={
            editorMode === "server" && editorGuideCode && source === "server" && activeGuideCode
              ? activeSteps
              : editorMode === "server" && !editorGuideCode
                ? editorBaseSteps
                : defaultSteps
          }
          tierValues={
            editorMode === "server" && editorGuideCode && source === "server" && activeGuideCode
              ? activeTierValues
              : editorMode === "server" && !editorGuideCode
                ? editorBaseTierValues
                : resolvedDefaultTierValues
          }
          commonValues={
            editorMode === "server" && editorGuideCode && source === "server" && activeGuideCode
              ? activeCommonValues
              : editorMode === "server" && !editorGuideCode
                ? editorBaseCommonValues
                : resolvedDefaultCommonValues
          }
          mode={editorMode}
          guideCode={editorGuideCode}
          guideTitle={editorGuideTitle}
          isPublic={editorIsPublic}
          adminGlossary={adminGlossary}
          guideGlossary={activeGuideGlossary}
          onSave={handleEditorSave}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {/* Share Modal */}
      <ShareGuideModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        steps={activeSteps}
        tierValues={activeTierValues}
        commonValues={activeCommonValues}
      />
    </div>
  );
}
