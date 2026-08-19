"use client";

import { useState, useEffect } from "react";
import { GuideStepRaw } from "@/types/guide";
import { TierValuesMap, CommonValuesMap } from "@/data/tier-config";

interface BaseGuideOption {
  type: "default" | "my" | "community";
  code?: string;
  title: string;
  author?: string;
}

interface BaseGuidePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (steps: GuideStepRaw[], tierValues: TierValuesMap, commonValues: CommonValuesMap) => void;
  defaultSteps: GuideStepRaw[];
  defaultTierValues: TierValuesMap;
  defaultCommonValues: CommonValuesMap;
  myGuides: { code: string; title: string }[];
}

export function BaseGuidePicker({
  isOpen,
  onClose,
  onSelect,
  defaultSteps,
  defaultTierValues,
  defaultCommonValues,
  myGuides,
}: BaseGuidePickerProps) {
  const [communityGuides, setCommunityGuides] = useState<
    { code: string; title: string; authorNickname: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");

  // Fetch popular community guides
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await fetch("/api/guides?sort=popular&limit=10");
        if (res.ok) {
          const data = await res.json();
          setCommunityGuides(
            data.guides.map((g: { code: string; title: string; authorNickname: string }) => ({
              code: g.code,
              title: g.title,
              authorNickname: g.authorNickname,
            }))
          );
        }
      } catch {
        // ignore
      }
    })();
  }, [isOpen]);

  const loadGuide = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/guides/${code}`);
      if (!res.ok) {
        setError("가이드를 찾을 수 없습니다");
        return;
      }
      const data = await res.json();
      const guide = data.guide;
      onSelect(guide.steps, guide.tierValues, guide.commonValues);
    } catch {
      setError("불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) {
      setError("6자리 코드를 입력하세요");
      return;
    }
    loadGuide(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            기반 가이드 선택
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            어떤 가이드를 기반으로 새 가이드를 만드시겠습니까?
          </p>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Option 1: Default guide */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              📋 기본 가이드
            </h3>
            <button
              onClick={() => onSelect(defaultSteps, defaultTierValues, defaultCommonValues)}
              className="w-full text-left px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
            >
              <div className="font-medium text-zinc-800 dark:text-zinc-200">기본 개척 가이드</div>
              <div className="text-xs text-zinc-500">서버에서 제공하는 기본 가이드를 복사</div>
            </button>
          </div>

          {/* Option 2: My guides */}
          {myGuides.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                ✏️ 내 가이드
              </h3>
              <div className="space-y-1">
                {myGuides.map((g) => (
                  <button
                    key={g.code}
                    onClick={() => loadGuide(g.code)}
                    disabled={loading}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{g.title}</div>
                    <div className="text-xs text-zinc-500">코드: {g.code}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option 3: Community guides */}
          {communityGuides.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                🌐 인기 커뮤니티 가이드
              </h3>
              <div className="space-y-1">
                {communityGuides.map((g) => (
                  <button
                    key={g.code}
                    onClick={() => loadGuide(g.code)}
                    disabled={loading}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{g.title}</div>
                    <div className="text-xs text-zinc-500">by {g.authorNickname}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option 4: Enter code manually */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              🔗 코드로 가져오기
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                placeholder="6자리 코드 입력"
                maxLength={6}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 uppercase tracking-widest font-mono"
              />
              <button
                onClick={handleCodeSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
              >
                불러오기
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {loading && (
            <p className="text-sm text-zinc-500">불러오는 중...</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
