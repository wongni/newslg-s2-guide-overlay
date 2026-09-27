"use client";

import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { GuidePanel } from "@/components/GuidePanel";
import { PipOverlayContent } from "@/components/PipOverlayContent";
import { References } from "@/components/References";
import { SeasonSwitcher } from "@/components/SeasonSwitcher";

export default function Home() {
  const { isPipOpen, pipWindow, openPip, closePip } = usePictureInPicture();

  const handleOverlayClick = async () => {
    if (isPipOpen) {
      closePip();
    } else {
      await openPip({ width: 420, height: 680 });
    }
  };

  return (
    <>
      {/* 시즌 선택 + PiP overlay toggle */}
      <div className="max-w-3xl mx-auto px-4 pt-3 flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={handleOverlayClick}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white ${
            isPipOpen ? "bg-red-700 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          {isPipOpen ? "✕ 오버레이 닫기" : "🖥 오버레이"}
        </button>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
          <SeasonSwitcher />
        </div>
      </div>

      <GuidePanel />
      <References />
      {isPipOpen && pipWindow && <PipOverlayContent pipWindow={pipWindow} />}
    </>
  );
}
