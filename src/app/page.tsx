"use client";

import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { GuidePanel } from "@/components/GuidePanel";
import { PipOverlayContent } from "@/components/PipOverlayContent";
import { References } from "@/components/References";

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
      {/* PiP overlay toggle button */}
      <div className="max-w-3xl mx-auto px-4 pt-3">
        <button
          onClick={handleOverlayClick}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white ${
            isPipOpen ? "bg-red-700 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          {isPipOpen ? "✕ 오버레이 닫기" : "🖥 오버레이"}
        </button>
      </div>

      <GuidePanel />
      <References />
      {isPipOpen && pipWindow && <PipOverlayContent pipWindow={pipWindow} />}
    </>
  );
}
