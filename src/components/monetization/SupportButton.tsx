"use client";

/**
 * 후원 버튼 컴포넌트 (Buy Me a Coffee 전용)
 */
const BMC_LINK = "https://buymeacoffee.com/wongni";

interface SupportButtonProps {
  className?: string;
  compact?: boolean;
}

export function SupportButton({ className = "", compact = false }: SupportButtonProps) {
  if (compact) {
    return (
      <a
        href={BMC_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors ${className}`}
      >
        ☕ 후원
      </a>
    );
  }

  return (
    <a
      href={BMC_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors border border-yellow-200 dark:border-yellow-800 ${className}`}
    >
      ☕ 커피 한잔 사주기
    </a>
  );
}
