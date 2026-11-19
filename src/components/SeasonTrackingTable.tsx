"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SEASON, getActiveSeason, type SeasonId } from "@/data/season";
import {
  getTrackingData,
  getTrackingStorageKey,
  type TrackingTier,
} from "@/data/tracking-by-season";
import { TrackingTable } from "@/components/TrackingTable";

/**
 * 선택된 시즌(localStorage)에 맞는 트래킹 표를 보여준다.
 * 서버 렌더에서는 기본 시즌으로 그리고, 마운트 후 저장된 시즌으로 바꿔 hydration 불일치를 피한다.
 */
export function SeasonTrackingTable({ tier }: { tier: TrackingTier }) {
  const [season, setSeason] = useState<SeasonId>(DEFAULT_SEASON);

  useEffect(() => {
    setSeason(getActiveSeason());
  }, []);

  const storageKey = getTrackingStorageKey(season, tier);
  return (
    <TrackingTable
      key={storageKey}
      data={getTrackingData(season, tier)}
      storageKey={storageKey}
    />
  );
}
