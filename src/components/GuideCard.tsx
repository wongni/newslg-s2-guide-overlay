"use client";

import Link from "next/link";

function relativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "방금 전";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;

  const years = Math.floor(months / 12);
  return `${years}년 전`;
}

interface GuideCardProps {
  guide: {
    code: string;
    title: string;
    description: string;
    authorNickname: string;
    authorServer?: string | null;
    likes: number;
    dislikes: number;
    createdAt: string;
  };
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link href={`/guides/${guide.code}`}>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer">
        {/* Title */}
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {guide.title}
        </h3>

        {/* Author */}
        <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{guide.authorNickname}</span>
          {guide.authorServer && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              {guide.authorServer}
            </span>
          )}
        </div>

        {/* Description */}
        {guide.description && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {guide.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span>👍 {guide.likes}</span>
            <span>👎 {guide.dislikes}</span>
          </div>
          <span>{relativeDate(guide.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
