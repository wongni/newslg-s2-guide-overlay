"use client";

/**
 * 참고 자료 링크 섹션
 */

interface ReferenceLink {
  title: string;
  url: string;
  description: string;
}

const REFERENCES: ReferenceLink[] = [
  {
    title: "S2 개척 가이드 원문",
    url: "https://docs.google.com/document/d/1H07F5rDxqtYH3nvE5l938Q7Jjk6Zlscx/edit",
    description: "slgguxi 古今工作室 작성 개척 가이드 (번역: 3서버 담덕)",
  },
  {
    title: "급지별 수비군 데이터",
    url: "https://docs.google.com/spreadsheets/d/1jPqmQ5erftKfuXkwb_Rr53DIxRiev08C4z3vTyD_ZU0/htmlview?gid=0&pru=AAABn0YGbpE*715q18IPqdjZqX3a-0Jkhg#gid=609043170",
    description: "급지별 수비군 구성, 레벨, 병영 요구사항 스프레드시트",
  },
];

export function References({ className = "" }: { className?: string }) {
  return (
    <section className={`max-w-3xl mx-auto px-4 py-4 ${className}`}>
      <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
        📚 참고 자료
      </h2>
      <div className="space-y-2">
        {REFERENCES.map((ref, i) => (
          <a
            key={i}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-0.5 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group"
          >
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {ref.title} ↗
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {ref.description}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
