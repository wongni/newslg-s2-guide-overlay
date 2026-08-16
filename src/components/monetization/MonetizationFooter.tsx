"use client";

import { SupportButton } from "@/components/monetization/SupportButton";
import { AdSlot } from "@/components/monetization/AdSlot";
import { CoupangBanner } from "@/components/monetization/CoupangBanner";

/**
 * 전역 수익화 푸터
 * layout.tsx에서 렌더링되므로 모든 페이지 하단에 자동 표시됩니다.
 */
export function MonetizationFooter() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* 후원 */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            가이드가 도움이 되셨다면 응원 부탁드려요 🙏
          </p>
          <SupportButton />
        </div>

        {/* 광고 슬롯 (승인 후 활성화) */}
        <div className="flex justify-center">
          <AdSlot slot="footer-banner" size="banner" />
        </div>

        {/* 쿠팡 파트너스 (승인 후 활성화) */}
        <CoupangBanner maxItems={2} />
      </div>
    </footer>
  );
}
