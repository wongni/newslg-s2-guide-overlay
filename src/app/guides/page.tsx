"use client";

import { useState, useEffect } from "react";
import { GuideCard } from "@/components/GuideCard";

interface GuideListItem {
  code: string;
  title: string;
  description: string;
  authorNickname: string;
  authorServer?: string | null;
  likes: number;
  dislikes: number;
  createdAt: string;
}

type SortType = "recent" | "popular";

export default function GuidesPage() {
  const [guides, setGuides] = useState<GuideListItem[]>([]);
  const [sort, setSort] = useState<SortType>("recent");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/guides?sort=${sort}&page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setGuides(data.guides || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setGuides([]);
      })
      .finally(() => setLoading(false));
  }, [sort, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          커뮤니티 가이드
        </h1>
      </div>

      {/* Sort tabs */}
      <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden w-fit mb-6">
        <button
          onClick={() => { setSort("recent"); setPage(1); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            sort === "recent"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          최신순
        </button>
        <button
          onClick={() => { setSort("popular"); setPage(1); }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
            sort === "popular"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          인기순
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          불러오는 중...
        </div>
      )}

      {/* Empty state */}
      {!loading && guides.length === 0 && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          아직 공유된 가이드가 없습니다.
        </div>
      )}

      {/* Guide grid */}
      {!loading && guides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <GuideCard key={guide.code} guide={guide} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← 이전
          </button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
