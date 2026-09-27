"use client";

import { useEffect, useState } from "react";
import {
  SEASONS,
  type SeasonId,
  getActiveSeason,
  setActiveSeason,
} from "@/data/season";

/**
 * 시즌 선택 드롭다운.
 *
 * 활성 시즌 데이터는 정적 import로 로드되므로, 시즌을 바꾸면
 * localStorage 저장 후 페이지를 새로고침해 새 시즌 데이터를 반영한다.
 */
export function SeasonSwitcher({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [season, setSeason] = useState<SeasonId>("s3");

  useEffect(() => {
    setSeason(getActiveSeason());
    setMounted(true);
  }, []);

  const handleChange = (id: SeasonId) => {
    if (id === season) return;
    setActiveSeason(id);
    // 정적 데이터 재로드를 위해 새로고침
    window.location.reload();
  };

  // SSR/hydration mismatch 방지 — 마운트 전에는 기본 표시
  const current = mounted ? season : "s3";

  return (
    <label
      className={`inline-flex items-center gap-1.5 ${
        compact ? "text-xs" : "text-sm"
      }`}
      title="시즌 선택"
    >
      <span className="text-zinc-500 dark:text-zinc-400">시즌</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value as SeasonId)}
        className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SEASONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.code} · {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
