"use client";

import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { GuidePanel } from "@/components/GuidePanel";
import { PipOverlayContent } from "@/components/PipOverlayContent";

export default function Home() {
  const { isPipOpen, pipWindow, openPip, closePip } = usePictureInPicture();

  const handleOverlayClick = async () => {
    if (isPipOpen) {
      closePip();
    } else {
      await openPip({ width: 420, height: 680 });
    }
  };

  const overlayButton = (
    <button
      onClick={handleOverlayClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
        isPipOpen ? "bg-red-700 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-500"
      }`}
    >
      {isPipOpen ? "✕ 오버레이 닫기" : "🖥 오버레이"}
    </button>
  );

  return (
    <>
      <GuidePanel extraActions={overlayButton} />
      {isPipOpen && pipWindow && <PipOverlayContent pipWindow={pipWindow} />}
    </>
  );
}
