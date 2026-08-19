"use client";

import { useState, useCallback } from "react";
import { GuideStepRaw } from "@/types/guide";
import { TierValuesMap, CommonValuesMap, TierLevel, TIER_LEVELS } from "@/data/tier-config";

type EditorTab = "steps" | "tierValues" | "commonValues" | "glossary";

interface GuideEditorProps {
  steps: GuideStepRaw[];
  tierValues: TierValuesMap;
  commonValues: CommonValuesMap;
  mode: "server" | "admin";
  guideCode?: string;
  guideTitle?: string;
  isPublic?: boolean;
  supportedTiers?: TierLevel[];
  adminGlossary?: Record<string, string>;
  guideGlossary?: Record<string, string>;
  onSave: (steps: GuideStepRaw[], tierValues: TierValuesMap, commonValues: CommonValuesMap) => void;
  onClose: () => void;
}

export function GuideEditor({
  steps,
  tierValues,
  commonValues,
  mode,
  guideCode,
  guideTitle: initialTitle = "",
  isPublic: initialIsPublic = false,
  supportedTiers: initialSupportedTiers,
  adminGlossary: initialAdminGlossary = {},
  guideGlossary: initialGuideGlossary = {},
  onSave,
  onClose,
}: GuideEditorProps) {
  const allTierIds = TIER_LEVELS.map((t) => t.id);
  const [activeTab, setActiveTab] = useState<EditorTab>("steps");
  const [editSteps, setEditSteps] = useState<GuideStepRaw[]>(
    () => JSON.parse(JSON.stringify(steps))
  );
  const [editTierValues, setEditTierValues] = useState<TierValuesMap>(
    () => JSON.parse(JSON.stringify(tierValues))
  );
  const [editCommonValues, setEditCommonValues] = useState<CommonValuesMap>(
    () => JSON.parse(JSON.stringify(commonValues))
  );
  const [editAdminGlossary, setEditAdminGlossary] = useState<Record<string, string>>(
    () => JSON.parse(JSON.stringify(initialAdminGlossary))
  );
  const [editGuideGlossary, setEditGuideGlossary] = useState<Record<string, string>>(
    () => JSON.parse(JSON.stringify(initialGuideGlossary))
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedTier, setSelectedTier] = useState<TierLevel>("명함");
  const [title, setTitle] = useState(initialTitle);
  const [isPublicState, setIsPublicState] = useState(initialIsPublic);
  const [supportedTiersState, setSupportedTiersState] = useState<TierLevel[]>(
    initialSupportedTiers || allTierIds
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const currentStep = editSteps[selectedIdx];

  // Mark as dirty on any edit action
  const markDirty = useCallback(() => setIsDirty(true), []);

  // Wrap state setters to auto-mark dirty
  const setEditStepsDirty = useCallback((updater: React.SetStateAction<GuideStepRaw[]>) => {
    setEditSteps(updater);
    setIsDirty(true);
  }, []);

  const setEditTierValuesDirty = useCallback((updater: React.SetStateAction<TierValuesMap>) => {
    setEditTierValues(updater);
    setIsDirty(true);
  }, []);

  const setEditCommonValuesDirty = useCallback((updater: React.SetStateAction<CommonValuesMap>) => {
    setEditCommonValues(updater);
    setIsDirty(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (confirm("저장되지 않은 변경사항이 있습니다. 닫으시겠습니까?")) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const toggleSupportedTier = useCallback((tier: TierLevel) => {
    setSupportedTiersState((prev) => {
      let next: TierLevel[];
      if (prev.includes(tier)) {
        if (prev.length <= 1) return prev; // 최소 1개
        next = prev.filter((t) => t !== tier);
      } else {
        next = [...prev, tier];
      }
      // 현재 selectedTier가 지원 범위 밖이면 첫 번째로 이동
      if (!next.includes(selectedTier)) {
        setSelectedTier(next[0]);
      }
      return next;
    });
  }, [selectedTier]);

  const updateCurrentStep = useCallback(
    (field: keyof GuideStepRaw, value: string | string[]) => {
      setEditStepsDirty((prev) => {
        const next = [...prev];
        next[selectedIdx] = { ...next[selectedIdx], [field]: value };
        return next;
      });
    },
    [selectedIdx]
  );

  const updateArrayField = useCallback(
    (field: keyof GuideStepRaw, index: number, value: string) => {
      setEditStepsDirty((prev) => {
        const next = [...prev];
        const arr = [...((next[selectedIdx][field] as string[]) || [])];
        arr[index] = value;
        next[selectedIdx] = { ...next[selectedIdx], [field]: arr };
        return next;
      });
    },
    [selectedIdx]
  );

  const addArrayItem = useCallback(
    (field: keyof GuideStepRaw) => {
      setEditStepsDirty((prev) => {
        const next = [...prev];
        const arr = [...((next[selectedIdx][field] as string[]) || []), ""];
        next[selectedIdx] = { ...next[selectedIdx], [field]: arr };
        return next;
      });
    },
    [selectedIdx]
  );

  const removeArrayItem = useCallback(
    (field: keyof GuideStepRaw, index: number) => {
      setEditStepsDirty((prev) => {
        const next = [...prev];
        const arr = [...((next[selectedIdx][field] as string[]) || [])];
        arr.splice(index, 1);
        next[selectedIdx] = {
          ...next[selectedIdx],
          [field]: arr.length > 0 ? arr : (undefined as unknown as string[]),
        };
        return next;
      });
    },
    [selectedIdx]
  );

  const addStep = useCallback(() => {
    const newStep: GuideStepRaw = {
      phase: "새 단계",
      title: "새 스텝",
      tasks: ["할 일을 입력하세요"],
    };
    setEditStepsDirty((prev) => {
      const next = [...prev];
      next.splice(selectedIdx + 1, 0, newStep);
      return next;
    });
    setSelectedIdx(selectedIdx + 1);
  }, [selectedIdx]);

  const deleteStep = useCallback(() => {
    if (editSteps.length <= 1) return;
    if (!confirm(`"${currentStep.title}" 스텝을 삭제하시겠습니까?`)) return;
    setEditStepsDirty((prev) => {
      const next = [...prev];
      next.splice(selectedIdx, 1);
      return next;
    });
    setSelectedIdx(Math.min(selectedIdx, editSteps.length - 2));
  }, [editSteps.length, selectedIdx, currentStep?.title]);

  const moveStep = useCallback(
    (direction: -1 | 1) => {
      const newIdx = selectedIdx + direction;
      if (newIdx < 0 || newIdx >= editSteps.length) return;
      setEditStepsDirty((prev) => {
        const next = [...prev];
        [next[selectedIdx], next[newIdx]] = [next[newIdx], next[selectedIdx]];
        return next;
      });
      setSelectedIdx(newIdx);
    },
    [selectedIdx, editSteps.length]
  );

  // Tier values editing
  const updateTierValue = useCallback(
    (tier: TierLevel, key: string, value: string) => {
      setEditTierValuesDirty((prev) => ({
        ...prev,
        [tier]: { ...prev[tier], [key]: value },
      }));
    },
    []
  );

  const addTierKey = useCallback((key: string) => {
    if (!key.trim()) return;
    setEditTierValuesDirty((prev) => {
      const next = { ...prev };
      for (const tier of TIER_LEVELS) {
        next[tier.id] = { ...next[tier.id], [key]: "" };
      }
      return next;
    });
  }, []);

  const removeTierKey = useCallback((key: string) => {
    if (!confirm(`"{{${key}}}" 템플릿 변수를 모든 티어에서 삭제하시겠습니까?`)) return;
    setEditTierValuesDirty((prev) => {
      const next = { ...prev };
      for (const tier of TIER_LEVELS) {
        const tierCopy = { ...next[tier.id] };
        delete tierCopy[key];
        next[tier.id] = tierCopy;
      }
      return next;
    });
  }, []);

  // Common values editing
  const updateCommonValue = useCallback((key: string, value: string) => {
    setEditCommonValuesDirty((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addCommonKey = useCallback((key: string) => {
    if (!key.trim()) return;
    setEditCommonValuesDirty((prev) => ({ ...prev, [key]: "" }));
  }, []);

  const removeCommonKey = useCallback((key: string) => {
    if (!confirm(`"{{${key}}}" 공통 변수를 삭제하시겠습니까?`)) return;
    setEditCommonValuesDirty((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSave = async () => {
    // Clean up empty optional arrays
    const cleanedSteps = editSteps.map((step) => {
      const cleaned: GuideStepRaw = {
        phase: step.phase,
        title: step.title,
        tasks: step.tasks.filter((t) => t.trim() !== ""),
      };
      if (step.conditions && step.conditions.filter((c) => c.trim()).length > 0) {
        cleaned.conditions = step.conditions.filter((c) => c.trim());
      }
      if (step.warnings && step.warnings.filter((w) => w.trim()).length > 0) {
        cleaned.warnings = step.warnings.filter((w) => w.trim());
      }
      if (step.tips && step.tips.filter((t) => t.trim()).length > 0) {
        cleaned.tips = step.tips.filter((t) => t.trim());
      }
      if (step.rewards && step.rewards.filter((r) => r.trim()).length > 0) {
        cleaned.rewards = step.rewards.filter((r) => r.trim());
      }
      return cleaned;
    });

    if (mode === "admin") {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steps: cleanedSteps,
            tierValues: editTierValues,
            commonValues: editCommonValues,
            glossary: editAdminGlossary,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "저장 실패");
          return;
        }
        onSave(cleanedSteps, editTierValues, editCommonValues);
        setIsDirty(false);
        setSuccessMsg("저장되었습니다");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch {
        setError("서버 연결 실패");
      } finally {
        setSaving(false);
      }
    } else {
      // Server mode: save via API
      if (!title.trim()) {
        setError("가이드 제목을 입력하세요");
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const url = guideCode ? `/api/guides/${guideCode}` : "/api/guides";
        const method = guideCode ? "PUT" : "POST";
        // Only include guide glossary if it has entries
        const glossaryPayload = Object.keys(editGuideGlossary).length > 0
          ? editGuideGlossary
          : undefined;
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            steps: cleanedSteps,
            tierValues: editTierValues,
            commonValues: editCommonValues,
            glossary: glossaryPayload,
            isPublic: isPublicState,
            supportedTiers: supportedTiersState,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "저장 실패");
          return;
        }
        onSave(cleanedSteps, editTierValues, editCommonValues);
        setIsDirty(false);
        setSuccessMsg("저장되었습니다");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch {
        setError("서버 연결 실패");
      } finally {
        setSaving(false);
      }
    }
  };

  // Collect all unique keys across tiers
  const allTierKeys = Array.from(
    new Set(Object.values(editTierValues).flatMap((v) => Object.keys(v)))
  ).sort();

  const allCommonKeys = Object.keys(editCommonValues).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden" onInput={markDirty}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">
              {mode === "admin"
                ? "🔒 Admin 수정"
                : guideCode
                  ? "✏️ 가이드 수정"
                  : "✨ 새 가이드 만들기"}
            </h2>
            {/* Tabs */}
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <button
                onClick={() => setActiveTab("steps")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === "steps"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                📝 스텝
              </button>
              <button
                onClick={() => setActiveTab("tierValues")}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                  activeTab === "tierValues"
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                🔧 티어별 값
              </button>
              <button
                onClick={() => setActiveTab("commonValues")}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                  activeTab === "commonValues"
                    ? "bg-orange-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                🌐 공통 값
              </button>
              <button
                onClick={() => setActiveTab("glossary")}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                  activeTab === "glossary"
                    ? "bg-amber-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                📖 키워드
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="px-4 py-1.5 text-sm font-medium rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "저장 중..." : "💾 저장"}
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-sm rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              ✕ 닫기
            </button>
          </div>
        </div>

        {/* Server mode: title, visibility, supported tiers */}
        {mode === "server" && (
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="가이드 제목 (필수)"
                className="w-full px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPublicState(false)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    !isPublicState
                      ? "bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  🔒 비공개
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublicState(true)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                    isPublicState
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  🌐 공개
                </button>
              </div>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">대상 티어:</span>
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {TIER_LEVELS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => toggleSupportedTier(tier.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      tier.id !== "명함" ? "border-l border-zinc-200 dark:border-zinc-700" : ""
                    } ${
                      supportedTiersState.includes(tier.id)
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                    title={tier.description}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-5 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="px-5 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
            ✓ {successMsg}
          </div>
        )}

        {/* Tab content */}
        {activeTab === "steps" && (
          <StepsEditor
            editSteps={editSteps}
            selectedIdx={selectedIdx}
            setSelectedIdx={setSelectedIdx}
            currentStep={currentStep}
            updateCurrentStep={updateCurrentStep}
            updateArrayField={updateArrayField}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            addStep={addStep}
            deleteStep={deleteStep}
            moveStep={moveStep}
          />
        )}
        {activeTab === "tierValues" && (
          <TierValuesEditor
            editTierValues={editTierValues}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            allTierKeys={allTierKeys}
            updateTierValue={updateTierValue}
            addTierKey={addTierKey}
            removeTierKey={removeTierKey}
            supportedTiers={mode === "server" ? supportedTiersState : undefined}
          />
        )}
        {activeTab === "commonValues" && (
          <CommonValuesEditor
            editCommonValues={editCommonValues}
            allCommonKeys={allCommonKeys}
            updateCommonValue={updateCommonValue}
            addCommonKey={addCommonKey}
            removeCommonKey={removeCommonKey}
          />
        )}
        {activeTab === "glossary" && (
          <GlossaryEditor
            mode={mode}
            adminGlossary={editAdminGlossary}
            guideGlossary={editGuideGlossary}
            onUpdateAdminGlossary={setEditAdminGlossary}
            onUpdateGuideGlossary={setEditGuideGlossary}
          />
        )}
      </div>
    </div>
  );
}

// Steps Editor Panel
function StepsEditor({
  editSteps,
  selectedIdx,
  setSelectedIdx,
  currentStep,
  updateCurrentStep,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
  addStep,
  deleteStep,
  moveStep,
}: {
  editSteps: GuideStepRaw[];
  selectedIdx: number;
  setSelectedIdx: (idx: number) => void;
  currentStep: GuideStepRaw;
  updateCurrentStep: (field: keyof GuideStepRaw, value: string | string[]) => void;
  updateArrayField: (field: keyof GuideStepRaw, index: number, value: string) => void;
  addArrayItem: (field: keyof GuideStepRaw) => void;
  removeArrayItem: (field: keyof GuideStepRaw, index: number) => void;
  addStep: () => void;
  deleteStep: () => void;
  moveStep: (direction: -1 | 1) => void;
}) {
  if (!currentStep) return null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Step list */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto">
        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex gap-1">
          <button
            onClick={addStep}
            className="flex-1 px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"
          >
            + 추가
          </button>
          <button
            onClick={() => moveStep(-1)}
            disabled={selectedIdx === 0}
            className="px-2 py-1 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
          >
            ▲
          </button>
          <button
            onClick={() => moveStep(1)}
            disabled={selectedIdx === editSteps.length - 1}
            className="px-2 py-1 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
          >
            ▼
          </button>
          <button
            onClick={deleteStep}
            disabled={editSteps.length <= 1}
            className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 disabled:opacity-30"
          >
            🗑️
          </button>
        </div>
        {editSteps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`w-full text-left px-3 py-2 text-xs border-b border-zinc-100 dark:border-zinc-800 transition-colors ${
              idx === selectedIdx
                ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="font-medium text-zinc-500 dark:text-zinc-500">
              {idx + 1}. {step.phase}
            </div>
            <div className="truncate text-zinc-800 dark:text-zinc-200">{step.title}</div>
          </button>
        ))}
      </div>

      {/* Right: Step editor */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">단계 (Phase)</label>
            <input
              type="text"
              value={currentStep.phase}
              onChange={(e) => updateCurrentStep("phase", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">제목 (Title)</label>
            <input
              type="text"
              value={currentStep.title}
              onChange={(e) => updateCurrentStep("title", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
            />
          </div>
        </div>

        <p className="text-xs text-zinc-400 italic">
          💡 {"{{변수명}}"} 형식으로 템플릿 사용 가능. 티어별 값은 &quot;🔧 티어별 값&quot; 탭, 공통 값은 &quot;🌐 공통 값&quot; 탭에서 수정.
        </p>

        <ArrayFieldEditor
          label="할 일 (Tasks)"
          items={currentStep.tasks}
          field="tasks"
          onUpdate={updateArrayField}
          onAdd={addArrayItem}
          onRemove={removeArrayItem}
        />
        <ArrayFieldEditor
          label="조건 (Conditions)"
          items={currentStep.conditions || []}
          field="conditions"
          onUpdate={updateArrayField}
          onAdd={addArrayItem}
          onRemove={removeArrayItem}
          optional
        />
        <ArrayFieldEditor
          label="⚠ 주의 (Warnings)"
          items={currentStep.warnings || []}
          field="warnings"
          onUpdate={updateArrayField}
          onAdd={addArrayItem}
          onRemove={removeArrayItem}
          optional
        />
        <ArrayFieldEditor
          label="💡 팁 (Tips)"
          items={currentStep.tips || []}
          field="tips"
          onUpdate={updateArrayField}
          onAdd={addArrayItem}
          onRemove={removeArrayItem}
          optional
        />
        <ArrayFieldEditor
          label="🎁 보상 (Rewards)"
          items={currentStep.rewards || []}
          field="rewards"
          onUpdate={updateArrayField}
          onAdd={addArrayItem}
          onRemove={removeArrayItem}
          optional
        />
      </div>
    </div>
  );
}

// Tier Values Editor Panel
function TierValuesEditor({
  editTierValues,
  selectedTier,
  setSelectedTier,
  allTierKeys,
  updateTierValue,
  addTierKey,
  removeTierKey,
  supportedTiers,
}: {
  editTierValues: TierValuesMap;
  selectedTier: TierLevel;
  setSelectedTier: (tier: TierLevel) => void;
  allTierKeys: string[];
  updateTierValue: (tier: TierLevel, key: string, value: string) => void;
  addTierKey: (key: string) => void;
  removeTierKey: (key: string) => void;
  supportedTiers?: TierLevel[];
}) {
  const [newKeyName, setNewKeyName] = useState("");
  const visibleTiers = supportedTiers
    ? TIER_LEVELS.filter((t) => supportedTiers.includes(t.id))
    : TIER_LEVELS;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">티어 선택:</span>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {visibleTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTier === tier.id
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                } ${tier.id !== visibleTiers[0]?.id ? "border-l border-zinc-200 dark:border-zinc-700" : ""}`}
              >
                {tier.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-400 ml-2">
            {TIER_LEVELS.find((t) => t.id === selectedTier)?.description}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-2 italic">
          티어마다 다른 값을 설정합니다 (예: 레벨, 병영, 병력). 동일 키가 공통 값에도 있으면 티어별 값이 우선됩니다.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-2">
          {allTierKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <code className="w-48 flex-shrink-0 px-2 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded font-mono truncate" title={key}>
                {`{{${key}}}`}
              </code>
              <input
                type="text"
                value={editTierValues[selectedTier]?.[key] || ""}
                onChange={(e) => updateTierValue(selectedTier, key, e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                placeholder={`${selectedTier}에서의 값`}
              />
              <button
                onClick={() => removeTierKey(key)}
                className="px-2 py-1.5 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                title="모든 티어에서 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newKeyName.trim()) {
                  addTierKey(newKeyName.trim());
                  setNewKeyName("");
                }
              }}
              placeholder="새 변수명 (예: 13급지_레벨)"
              className="flex-1 px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
            />
            <button
              onClick={() => {
                if (newKeyName.trim()) {
                  addTierKey(newKeyName.trim());
                  setNewKeyName("");
                }
              }}
              className="px-4 py-2 text-sm rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-medium"
            >
              + 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Common Values Editor Panel
function CommonValuesEditor({
  editCommonValues,
  allCommonKeys,
  updateCommonValue,
  addCommonKey,
  removeCommonKey,
}: {
  editCommonValues: CommonValuesMap;
  allCommonKeys: string[];
  updateCommonValue: (key: string, value: string) => void;
  addCommonKey: (key: string) => void;
  removeCommonKey: (key: string) => void;
}) {
  const [newKeyName, setNewKeyName] = useState("");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
          🌐 공통 값 — 모든 티어에 동일하게 적용
        </p>
        <p className="text-xs text-zinc-400 mt-1 italic">
          수비군 난이도처럼 티어에 무관한 값을 관리합니다. 한 번 수정하면 모든 티어에 반영됩니다.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-2">
          {allCommonKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <code className="w-48 flex-shrink-0 px-2 py-1.5 text-xs bg-orange-50 dark:bg-orange-900/20 rounded font-mono truncate border border-orange-200 dark:border-orange-800" title={key}>
                {`{{${key}}}`}
              </code>
              <input
                type="text"
                value={editCommonValues[key] || ""}
                onChange={(e) => updateCommonValue(key, e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                placeholder="값 입력"
              />
              <button
                onClick={() => removeCommonKey(key)}
                className="px-2 py-1.5 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newKeyName.trim()) {
                  addCommonKey(newKeyName.trim());
                  setNewKeyName("");
                }
              }}
              placeholder="새 공통 변수명 (예: 13급지_수비군)"
              className="flex-1 px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
            />
            <button
              onClick={() => {
                if (newKeyName.trim()) {
                  addCommonKey(newKeyName.trim());
                  setNewKeyName("");
                }
              }}
              className="px-4 py-2 text-sm rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-medium"
            >
              + 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Glossary Editor Panel
function GlossaryEditor({
  mode,
  adminGlossary,
  guideGlossary,
  onUpdateAdminGlossary,
  onUpdateGuideGlossary,
}: {
  mode: "server" | "admin";
  adminGlossary: Record<string, string>;
  guideGlossary: Record<string, string>;
  onUpdateAdminGlossary: (glossary: Record<string, string>) => void;
  onUpdateGuideGlossary: (glossary: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  if (mode === "admin") {
    // Admin mode: single editable list
    const keys = Object.keys(adminGlossary).sort();

    const updateEntry = (key: string, value: string) => {
      onUpdateAdminGlossary({ ...adminGlossary, [key]: value });
    };

    const removeEntry = (key: string) => {
      const next = { ...adminGlossary };
      delete next[key];
      onUpdateAdminGlossary(next);
    };

    const addEntry = () => {
      if (!newKey.trim()) return;
      onUpdateAdminGlossary({ ...adminGlossary, [newKey.trim()]: newValue });
      setNewKey("");
      setNewValue("");
    };

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            📖 Admin 키워드 사전
          </p>
          <p className="text-xs text-zinc-400 mt-1 italic">
            모든 가이드에 적용되는 기본 키워드입니다. 텍스트에서 키워드가 등장하면 자동으로 툴팁이 표시됩니다.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-2">
            {keys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="w-32 flex-shrink-0 px-2 py-1.5 text-sm bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800 font-medium"
                />
                <input
                  type="text"
                  value={adminGlossary[key]}
                  onChange={(e) => updateEntry(key, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                  placeholder="설명"
                />
                <button
                  onClick={() => removeEntry(key)}
                  className="px-2 py-1.5 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="키워드"
                className="w-32 px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addEntry();
                }}
                placeholder="설명 (툴팁에 표시)"
                className="flex-1 px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              />
              <button
                onClick={addEntry}
                className="px-4 py-2 text-sm rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-medium"
              >
                + 추가
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Server mode: two sections
  const adminKeys = Object.keys(adminGlossary).sort();
  const guideKeys = Object.keys(guideGlossary).sort();

  const updateGuideEntry = (key: string, value: string) => {
    onUpdateGuideGlossary({ ...guideGlossary, [key]: value });
  };

  const removeGuideEntry = (key: string) => {
    const next = { ...guideGlossary };
    delete next[key];
    onUpdateGuideGlossary(next);
  };

  const addGuideEntry = () => {
    if (!newKey.trim()) return;
    onUpdateGuideGlossary({ ...guideGlossary, [newKey.trim()]: newValue });
    setNewKey("");
    setNewValue("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          📖 키워드 사전
        </p>
        <p className="text-xs text-zinc-400 mt-1 italic">
          가이드 전용 키워드는 Admin 키워드를 덮어씁니다. 설명을 비워두면 해당 키워드의 툴팁이 비활성화됩니다.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Admin glossary (read-only) */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            Admin 기본 키워드 (읽기 전용)
          </h3>
          <div className="space-y-1.5">
            {adminKeys.length === 0 && (
              <p className="text-xs text-zinc-400 italic">Admin 키워드 없음</p>
            )}
            {adminKeys.map((key) => (
              <div key={key} className="flex items-center gap-2 opacity-60">
                <span className="w-32 flex-shrink-0 px-2 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded font-medium">
                  {key}
                </span>
                <span className="flex-1 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {adminGlossary[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Guide-specific glossary (editable) */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
            가이드 전용 키워드 (편집 가능)
          </h3>
          <p className="text-xs text-zinc-400 italic mb-3">
            Admin 키워드를 덮어쓰려면 같은 키워드를 추가하세요. 설명을 비워두면 툴팁이 비활성화됩니다.
          </p>
          <div className="space-y-2">
            {guideKeys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="w-32 flex-shrink-0 px-2 py-1.5 text-sm bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800 font-medium"
                />
                <input
                  type="text"
                  value={guideGlossary[key]}
                  onChange={(e) => updateGuideEntry(key, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                  placeholder="설명 (비워두면 비활성화)"
                />
                <button
                  onClick={() => removeGuideEntry(key)}
                  className="px-2 py-1.5 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="키워드"
                className="w-32 px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addGuideEntry();
                }}
                placeholder="설명 (비워두면 비활성화)"
                className="flex-1 px-3 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              />
              <button
                onClick={addGuideEntry}
                className="px-4 py-2 text-sm rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-medium"
              >
                + 추가
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for editing array fields
function ArrayFieldEditor({
  label,
  items,
  field,
  onUpdate,
  onAdd,
  onRemove,
  optional = false,
}: {
  label: string;
  items: string[];
  field: keyof GuideStepRaw;
  onUpdate: (field: keyof GuideStepRaw, index: number, value: string) => void;
  onAdd: (field: keyof GuideStepRaw) => void;
  onRemove: (field: keyof GuideStepRaw, index: number) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-zinc-500">{label}</label>
        <button
          onClick={() => onAdd(field)}
          className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
        >
          + 추가
        </button>
      </div>
      {items.length === 0 && optional && (
        <p className="text-xs text-zinc-400 italic">항목 없음</p>
      )}
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(field, idx, e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              placeholder={`${label} ${idx + 1}`}
            />
            <button
              onClick={() => onRemove(field, idx)}
              className="px-2 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
