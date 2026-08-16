"use client";

import { useEffect, useRef } from "react";

type AdSlotSize = "banner" | "rectangle" | "leaderboard";

interface AdSlotProps {
  /** 광고 위치 식별자 (analytics용) */
  slot: string;
  /** 광고 크기 */
  size?: AdSlotSize;
  className?: string;
}

/**
 * 광고 슬롯 컴포넌트
 *
 * 현재는 placeholder를 표시합니다.
 * 실제 광고를 넣으려면 아래 중 하나를 선택하세요:
 *
 * 1. Google AdSense:
 *    - layout.tsx에 AdSense 스크립트 추가
 *    - 이 컴포넌트에서 <ins className="adsbygoogle" ...> 렌더링
 *
 * 2. 카카오 애드핏:
 *    - layout.tsx에 애드핏 스크립트 추가
 *    - 이 컴포넌트에서 <ins className="kakao_ad_area" ...> 렌더링
 *
 * TODO: 광고 계정 승인 후 아래 상수를 교체하세요
 */
const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXX"; // ← AdSense Publisher ID
const ADSENSE_ENABLED = false; // ← 승인 후 true로 변경

const SIZE_MAP: Record<AdSlotSize, { width: number; height: number }> = {
  banner: { width: 320, height: 50 },
  rectangle: { width: 300, height: 250 },
  leaderboard: { width: 728, height: 90 },
};

export function AdSlot({ slot, size = "banner", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = SIZE_MAP[size];

  useEffect(() => {
    if (ADSENSE_ENABLED && containerRef.current) {
      try {
        // @ts-expect-error AdSense global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded
      }
    }
  }, []);

  if (!ADSENSE_ENABLED) {
    // Placeholder - 광고 승인 전에는 빈 공간 또는 자체 홍보 배너
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 text-xs ${className}`}
        style={{ width: "100%", maxWidth: width, height }}
      >
        <span>광고 영역 ({size})</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width, height }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
