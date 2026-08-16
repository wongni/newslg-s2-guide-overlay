"use client";

import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { GuidePanel } from "@/components/GuidePanel";
import { PipOverlayContent } from "@/components/PipOverlayContent";
import { References } from "@/components/References";
import Link from "next/link";

export default function Home() {
  const { isPipOpen, pipWindow, openPip, closePip } = usePictureInPicture();

  const handleOverlayClick = async () => {
    if (isPipOpen) {
      closePip();
    } else {
      await openPip({ width: 420, height: 680 });
    }
  };

  const extraActions = (
    <>
      <Link
        href="/giljak"
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white bg-green-600 hover:bg-green-500"
      >
        🛤️ 길작
      </Link>
      <Link
        href="/roi"
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white bg-purple-600 hover:bg-purple-500"
      >
        📈 ROI
      </Link>
      <Link
        href="/calculator"
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white bg-blue-600 hover:bg-blue-500"
      >
        🧮 계산기
      </Link>
      <button
        onClick={handleOverlayClick}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
          isPipOpen ? "bg-red-700 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-500"
        }`}
      >
        {isPipOpen ? "✕ 오버레이 닫기" : "🖥 오버레이"}
      </button>
    </>
  );

  return (
    <>
      <GuidePanel extraActions={extraActions} />
      <References />
      {isPipOpen && pipWindow && <PipOverlayContent pipWindow={pipWindow} />}
    </>
  );
}
