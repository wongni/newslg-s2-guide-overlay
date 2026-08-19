"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { BaseGuidePicker } from "@/components/BaseGuidePicker";
import { GuideEditor } from "@/components/GuideEditor";
import { GuideStepRaw } from "@/types/guide";
import { TierValuesMap, CommonValuesMap, TIER_VALUES, COMMON_VALUES } from "@/data/tier-config";
import guideSteps from "@/data/guide-steps.json";
import Link from "next/link";

const defaultSteps: GuideStepRaw[] = guideSteps;
const defaultTierValues: TierValuesMap = TIER_VALUES;
const defaultCommonValues: CommonValuesMap = COMMON_VALUES;

interface MyGuide {
  code: string;
  title: string;
  description?: string;
  isPublic: boolean;
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

export default function MyGuidesPage() {
  const { user, loading } = useAuthContext();
  const [guides, setGuides] = useState<MyGuide[]>([]);
  const [fetching, setFetching] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorBaseSteps, setEditorBaseSteps] = useState<GuideStepRaw[]>(defaultSteps);
  const [editorBaseTierValues, setEditorBaseTierValues] = useState<TierValuesMap>(defaultTierValues);
  const [editorBaseCommonValues, setEditorBaseCommonValues] = useState<CommonValuesMap>(defaultCommonValues);

  const fetchMyGuides = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/guides?mine=true");
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyGuides();
    }
  }, [user, fetchMyGuides]);

  const handleCreateClick = () => {
    setPickerOpen(true);
  };

  const handleBaseSelected = (
    steps: GuideStepRaw[],
    tierValues: TierValuesMap,
    commonValues: CommonValuesMap
  ) => {
    setPickerOpen(false);
    setEditorBaseSteps(steps);
    setEditorBaseTierValues(tierValues);
    setEditorBaseCommonValues(commonValues);
    setEditorOpen(true);
  };

  const handleEditorSave = () => {
    fetchMyGuides();
  };

  const handleDelete = async (code: string) => {
    if (!confirm("이 가이드를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/guides/${code}`, { method: "DELETE" });
      if (res.ok) {
        fetchMyGuides();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-zinc-600 dark:text-zinc-400">
        <p className="text-lg font-medium mb-2">로그인이 필요합니다</p>
        <p className="text-sm">내 가이드를 관리하려면 먼저 로그인해주세요.</p>
      </div>
    );
  }

  const publicGuides = guides.filter((g) => g.isPublic);
  const privateGuides = guides.filter((g) => !g.isPublic);
  const canCreate = publicGuides.length < 5 || privateGuides.length < 5;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">내 가이드</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            공개 {publicGuides.length}/5 · 비공개 {privateGuides.length}/5
          </span>
          {canCreate && (
            <button
              onClick={handleCreateClick}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              + 새 가이드
            </button>
          )}
        </div>
      </div>

      {fetching && guides.length === 0 && (
        <div className="text-center py-8 text-zinc-500">불러오는 중...</div>
      )}

      {!fetching && guides.length === 0 && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p className="text-lg mb-2">아직 가이드가 없습니다</p>
          <p className="text-sm mb-4">
            기본 가이드 또는 커뮤니티 가이드를 기반으로 나만의 가이드를 만들어보세요.
          </p>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            + 새 가이드 만들기
          </button>
        </div>
      )}

      {guides.length > 0 && (
        <div className="space-y-3">
          {guides.map((guide) => (
            <div
              key={guide.code}
              className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                    {guide.isPublic ? "🌐 공개" : "🔒 비공개"}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {guide.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>코드: {guide.code}</span>
                  {guide.isPublic && (
                    <span>👍 {guide.likes} · 👎 {guide.dislikes}</span>
                  )}
                  <span>{relativeDate(guide.updatedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Link
                  href={`/guides/${guide.code}`}
                  className="px-3 py-1.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                >
                  보기
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://cheonha.samgukji.top/guides/${guide.code}`
                    );
                    alert("URL이 복사되었습니다!");
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                >
                  공유
                </button>
                <button
                  onClick={() => handleDelete(guide.code)}
                  className="px-3 py-1.5 text-xs rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Base Guide Picker */}
      <BaseGuidePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleBaseSelected}
        defaultSteps={defaultSteps}
        defaultTierValues={defaultTierValues}
        defaultCommonValues={defaultCommonValues}
        myGuides={guides.map((g) => ({ code: g.code, title: g.title }))}
      />

      {/* Guide Editor */}
      {editorOpen && (
        <GuideEditor
          steps={editorBaseSteps}
          tierValues={editorBaseTierValues}
          commonValues={editorBaseCommonValues}
          mode="server"
          onSave={handleEditorSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
