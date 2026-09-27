"use client";

// 정찰 목록을 특정 장수 기준으로 거르는 필터 칩.
// 여러 장수를 동시에 선택할 수 있고, 선택된 장수 중 하나라도 적 덱에
// 포함되면(OR 조건) 해당 적을 표시한다.

// 필터에 노출할 장수 목록 (요청 순서 유지)
export const FILTER_GENERALS: string[] = [
  "조운",
  "사마의",
  "마초",
  "악진",
  "여포",
  "주유",
  "관우",
  "조조",
  "유비",
  "주태",
  "손권",
  "육손",
];

interface GeneralFilterProps {
  selected: ReadonlySet<string>;
  onToggle: (general: string) => void;
  onClear: () => void;
}

export function GeneralFilter({ selected, onToggle, onClear }: GeneralFilterProps) {
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          <span>🎯</span> 장수 필터
        </h2>
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-zinc-400 hover:text-blue-500"
          >
            초기화
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTER_GENERALS.map((g) => {
          const active = selected.has(g);
          return (
            <button
              key={g}
              onClick={() => onToggle(g)}
              aria-pressed={active}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          선택한 장수가 덱에 포함된 적만 표시합니다.
        </p>
      )}
    </section>
  );
}
