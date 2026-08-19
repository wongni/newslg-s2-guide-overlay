"use client";

import { GuideSource, MyGuideInfo } from "@/hooks/useCustomGuide";

interface GuideSourceSelectorProps {
  source: GuideSource;
  user: { id: string } | null;
  myGuides: MyGuideInfo[];
  activeGuideCode: string | null;
  hasTempGuide: boolean;
  onSelectDefault: () => void;
  onSelectGuide: (code: string) => void;
  onSelectTemp: () => void;
  onClearTemp: () => void;
  onCreateGuide: () => void;
  onEditGuide: () => void;
}

export function GuideSourceSelector({
  source,
  user,
  myGuides,
  activeGuideCode,
  hasTempGuide,
  onSelectDefault,
  onSelectGuide,
  onSelectTemp,
  onClearTemp,
  onCreateGuide,
  onEditGuide,
}: GuideSourceSelectorProps) {
  const maxGuides = 10;

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          {/* Default tab */}
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={onSelectDefault}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                source === "default"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              📋 기본 가이드
            </button>
            {hasTempGuide && (
              <button
                onClick={onSelectTemp}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                  source === "temp"
                    ? "bg-amber-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                👁 임시 가이드
              </button>
            )}
          </div>
          {hasTempGuide && (
            <button
              onClick={onClearTemp}
              className="px-2 py-1 text-xs rounded transition-colors bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
              title="임시 가이드 삭제"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          로그인하면 나만의 가이드를 만들 수 있습니다
        </p>
      </div>
    );
  }

  // Logged in, no server guides
  if (myGuides.length === 0) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <button
            onClick={onSelectDefault}
            className="px-3 py-1 text-xs font-medium transition-colors bg-blue-600 text-white"
          >
            📋 기본 가이드
          </button>
        </div>
        <button
          onClick={onCreateGuide}
          className="px-3 py-1 text-xs font-medium rounded transition-colors bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"
        >
          + 나만의 가이드 만들기
        </button>
      </div>
    );
  }

  // Logged in, has server guides
  const handleGuideSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__default__") {
      onSelectDefault();
    } else {
      onSelectGuide(value);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {/* Default tab */}
      <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <button
          onClick={onSelectDefault}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            source === "default"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          📋 기본 가이드
        </button>
      </div>

      {/* Server guides dropdown */}
      <select
        value={activeGuideCode || "__default__"}
        onChange={handleGuideSelect}
        className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="__default__">— 서버 가이드 선택 —</option>
        {myGuides.map((g) => (
          <option key={g.code} value={g.code}>
            {g.title} {g.isPublic ? "🌐" : "🔒"}
          </option>
        ))}
      </select>

      {/* New guide button (if under limit) */}
      {myGuides.length < maxGuides && (
        <button
          onClick={onCreateGuide}
          className="px-2 py-1 text-xs rounded transition-colors bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"
          title="새 가이드 만들기"
        >
          + 새 가이드
        </button>
      )}

      {/* Edit button (only when a server guide is selected) */}
      {source === "server" && activeGuideCode && (
        <button
          onClick={onEditGuide}
          className="px-2 py-1 text-xs rounded transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          title="가이드 수정"
        >
          ⚙️ 수정
        </button>
      )}
    </div>
  );
}
