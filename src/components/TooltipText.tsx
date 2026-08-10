"use client";

import { ReactNode } from "react";
import { GLOSSARY } from "@/data/glossary";

// Build regex from glossary keys, longest first to avoid partial matches
const glossaryKeys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const glossaryRegex = new RegExp(`(${glossaryKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})`, "g");

/**
 * 텍스트 내 용어 사전 키워드를 툴팁이 붙은 <span>으로 변환
 */
export function renderWithTooltips(text: string): ReactNode {
  const parts = text.split(glossaryRegex);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const tooltip = GLOSSARY[part];
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
