"use client";

import { TierLevel, TIER_LEVELS } from "@/data/tier-config";

interface TierSelectorProps {
  tier: TierLevel;
  onChangeTier: (tier: TierLevel) => void;
  compact?: boolean;
  supportedTiers?: TierLevel[];
}

export function TierSelector({ tier, onChangeTier, compact = false, supportedTiers }: TierSelectorProps) {
  const visibleTiers = supportedTiers
    ? TIER_LEVELS.filter((t) => supportedTiers.includes(t.id))
    : TIER_LEVELS;

  return (
    <div className={`flex items-center gap-1 ${compact ? "px-0 py-1.5" : "mt-2"}`}>
      <span className={`mr-1 text-zinc-600 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}>
        돌파:
      </span>
      {visibleTiers.map((t) => (
        <button
          key={t.id}
          onClick={() => onChangeTier(t.id)}
          title={t.description}
          className={`rounded font-medium transition-colors ${
            compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
          } ${
            tier === t.id
              ? "bg-amber-600 text-white"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
