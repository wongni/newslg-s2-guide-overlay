"use client";

import { ReactNode } from "react";

/**
 * Merge admin glossary with per-guide glossary.
 * Guide glossary overrides admin glossary.
 * If guide sets a key to empty string "", that keyword is disabled for that guide.
 */
export function buildGlossary(
  adminGlossary: Record<string, string>,
  guideGlossary?: Record<string, string>
): Record<string, string> {
  if (!guideGlossary) return adminGlossary;

  const merged = { ...adminGlossary, ...guideGlossary };

  // Remove keys with empty string (disabled by guide)
  for (const key of Object.keys(merged)) {
    if (merged[key] === "") {
      delete merged[key];
    }
  }

  return merged;
}

/**
 * 텍스트 내 용어 사전 키워드를 툴팁이 붙은 <span>으로 변환
 */
export function renderWithTooltips(text: string, glossary: Record<string, string>): ReactNode {
  const keys = Object.keys(glossary);
  if (keys.length === 0) return text;

  // Sort by length (longest first) to avoid partial matches
  const sortedKeys = keys.sort((a, b) => b.length - a.length);
  const regex = new RegExp(
    `(${sortedKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );

  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const tooltip = glossary[part];
    if (tooltip) {
      return (
        <span
          key={i}
          className="relative group/tip cursor-help border-b border-dotted border-amber-500/50 font-medium text-amber-700 dark:text-amber-300"
        >
          {part}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 bg-zinc-800 dark:bg-zinc-700 text-zinc-100">
            {tooltip}
          </span>
        </span>
      );
    }
    return part;
  });
}
