"use client";

/**
 * 쿠팡 파트너스 배너 컴포넌트
 *
 * 쿠팡 파트너스 가입 후:
 * 1. https://partners.coupang.com 에서 배너/링크 생성
 * 2. 아래 AFFILIATE_LINKS에 실제 링크를 추가
 *
 * 주의: 쿠팡 파트너스 링크에는 반드시 "이 포스팅은 쿠팡 파트너스 활동의 일환으로,
 * 이에 따른 일정액의 수수료를 제공받습니다" 문구가 필요합니다.
 */

interface AffiliateItem {
  title: string;
  description: string;
  url: string;
  emoji: string;
}

// TODO: 실제 쿠팡 파트너스 링크로 교체
const AFFILIATE_LINKS: AffiliateItem[] = [
  {
    title: "게이밍 마우스 베스트",
    description: "정밀 조작에 최적화",
    url: "https://link.coupang.com/YOUR_LINK_1",
    emoji: "🖱️",
  },
  {
    title: "게이밍 모니터 추천",
    description: "144Hz 이상 모니터",
    url: "https://link.coupang.com/YOUR_LINK_2",
    emoji: "🖥️",
  },
  {
    title: "게이밍 키보드",
    description: "기계식 저소음",
    url: "https://link.coupang.com/YOUR_LINK_3",
    emoji: "⌨️",
  },
];

const ENABLED = false; // ← 쿠팡 파트너스 승인 후 true로 변경

interface CoupangBannerProps {
  className?: string;
  maxItems?: number;
}

export function CoupangBanner({ className = "", maxItems = 2 }: CoupangBannerProps) {
  if (!ENABLED) return null;

  const items = AFFILIATE_LINKS.slice(0, maxItems);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          추천 게이밍 기어
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group"
          >
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                {item.title}
              </div>
              <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                {item.description}
              </div>
            </div>
            <span className="text-xs text-zinc-400">→</span>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
}
