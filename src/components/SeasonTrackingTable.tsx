"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SEASON, getActiveSeason, type SeasonId } from "@/data/season";
import {
  getTrackingData,
  getTrackingStorageKey,
  type TrackingTier,
} from "@/data/tracking-by-season";
import { TrackingTable } from "@/components/TrackingTable";
import { PipPortal } from "@/components/PipOverlayContent";
import { usePictureInPicture } from "@/hooks/usePictureInPicture";

/**
 * 선택된 시즌(localStorage)에 맞는 트래킹 표를 보여준다.
 * 서버 렌더에서는 기본 시즌으로 그리고, 마운트 후 저장된 시즌으로 바꿔 hydration 불일치를 피한다.
 * 오버레이 버튼을 누르면 같은 진행 체크를 공유하는 단계 카드를 PiP 창에 띄운다.
 */
export function SeasonTrackingTable({ tier }: { tier: TrackingTier }) {
  const [season, setSeason] = useState<SeasonId>(DEFAULT_SEASON);
  const { isSupported, isPipOpen, pipWindow, openPip, closePip } = usePictureInPicture();

  useEffect(() => {
    setSeason(getActiveSeason());
  }, []);

  const storageKey = getTrackingStorageKey(season, tier);
  const data = getTrackingData(season, tier);

  const handleOverlayClick = async () => {
    if (isPipOpen) {
      closePip();
      return;
    }
    if (!isSupported) {
      alert("오버레이는 Chrome / Edge 116 이상에서 사용할 수 있습니다.");
      return;
    }
    await openPip({ width: 440, height: 720 });
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 pt-3">
        <button
          onClick={handleOverlayClick}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white ${
            isPipOpen ? "bg-red-700 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          {isPipOpen ? "✕ 오버레이 닫기" : "🖥 오버레이"}
        </button>
      </div>
      <TrackingTable key={storageKey} data={data} storageKey={storageKey} />
      {isPipOpen && pipWindow && (
        <PipPortal pipWindow={pipWindow}>
          <TrackingTable key={`pip-${storageKey}`} data={data} storageKey={storageKey} compact />
        </PipPortal>
      )}
    </>
  );
}
