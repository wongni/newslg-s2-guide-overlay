"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GuideStepRaw, GuideStep } from "@/types/guide";
import { TierValuesMap, CommonValuesMap, TierLevel } from "@/data/tier-config";
import { resolveSteps } from "@/lib/resolveSteps";
import { StepCard } from "@/components/StepCard";
import { buildGlossary } from "@/components/TooltipText";
import { GuideEditor } from "@/components/GuideEditor";

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

interface GuideData {
  id: string;
  code: string;
  authorId: string;
  title: string;
  description: string;
  steps: GuideStepRaw[];
  tierValues?: TierValuesMap;
  commonValues?: CommonValuesMap;
  glossary?: Record<string, string>;
  isPublic: boolean;
  likes: number;
  dislikes: number;
  createdAt: string;
}

interface AuthorInfo {
  nickname: string;
  server: string | null;
  alliance: string | null;
}

interface CurrentUser {
  id: string;
  role: string;
}

const REPORT_REASONS = [
  "부적절한 내용",
  "스팸",
  "잘못된 정보",
  "기타",
];

const TEMP_STEPS_KEY = "s2-temp-guide-steps";
const TEMP_TIER_VALUES_KEY = "s2-temp-guide-tier-values";
const TEMP_COMMON_VALUES_KEY = "s2-temp-guide-common-values";

export default function GuideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [guide, setGuide] = useState<GuideData | null>(null);
  const [author, setAuthor] = useState<AuthorInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [adminGlossary, setAdminGlossary] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);

  // Preview tier (default 명함)
  const [previewTier, setPreviewTier] = useState<TierLevel>("명함");

  // Fetch guide data
  const fetchGuide = useCallback(() => {
    if (!code) return;
    Promise.all([
      fetch(`/api/guides/${code}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/admin/guide").then((r) => r.json()),
    ])
      .then(([guideData, authData, adminData]) => {
        if (guideData.error) {
          setError(guideData.error);
        } else {
          setGuide(guideData.guide);
          setAuthor(guideData.author);
          setLikes(guideData.guide.likes);
          setDislikes(guideData.guide.dislikes);
        }
        if (authData.user) {
          setCurrentUser({ id: authData.user.id, role: authData.user.role });
        }
        if (adminData.glossary) {
          setAdminGlossary(adminData.glossary);
        }
      })
      .catch(() => setError("서버 오류가 발생했습니다"))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  // Show toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Handle reaction
  const handleReaction = async (type: "like" | "dislike") => {
    if (!currentUser) {
      showToast("로그인이 필요합니다");
      return;
    }

    try {
      const res = await fetch(`/api/guides/${code}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserReaction(data.userReaction);
      } else {
        showToast(data.error || "오류가 발생했습니다");
      }
    } catch {
      showToast("서버 오류가 발생했습니다");
    }
  };

  // Handle import (가져오기)
  const handleImport = async () => {
    if (!guide) return;

    if (currentUser) {
      // Logged in: save as a new private guide via API
      setImportSaving(true);
      try {
        const res = await fetch("/api/guides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: guide.title,
            steps: guide.steps,
            tierValues: guide.tierValues || {},
            commonValues: guide.commonValues || {},
            isPublic: false,
          }),
        });
        if (res.ok) {
          showToast("내 가이드로 저장되었습니다! 메인 페이지에서 확인하세요.");
        } else {
          const data = await res.json();
          showToast(data.error || "저장에 실패했습니다");
        }
      } catch {
        showToast("서버 오류가 발생했습니다");
      } finally {
        setImportSaving(false);
      }
    } else {
      // Not logged in: save to sessionStorage as temp guide
      try {
        sessionStorage.setItem(TEMP_STEPS_KEY, JSON.stringify(guide.steps));
        if (guide.tierValues) {
          sessionStorage.setItem(TEMP_TIER_VALUES_KEY, JSON.stringify(guide.tierValues));
        }
        if (guide.commonValues) {
          sessionStorage.setItem(TEMP_COMMON_VALUES_KEY, JSON.stringify(guide.commonValues));
        }
        showToast("임시 가이드로 저장되었습니다.\n💡 로그인하면 영구 저장됩니다.");
      } catch {
        showToast("가이드 가져오기에 실패했습니다");
      }
    }
  };

  // Handle report
  const handleReport = async () => {
    if (!currentUser) {
      showToast("로그인이 필요합니다");
      return;
    }

    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/guides/${code}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("신고가 접수되었습니다");
        setShowReportForm(false);
      } else {
        showToast(data.error || "오류가 발생했습니다");
      }
    } catch {
      showToast("서버 오류가 발생했습니다");
    } finally {
      setReportSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("정말 이 가이드를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/guides/${code}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/guides");
      } else {
        const data = await res.json();
        showToast(data.error || "삭제에 실패했습니다");
      }
    } catch {
      showToast("서버 오류가 발생했습니다");
    }
  };

  // Toggle step expand
  const toggleExpand = (id: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Resolve steps for preview
  const resolvedSteps: GuideStep[] = guide
    ? resolveSteps(
        guide.steps,
        previewTier,
        guide.tierValues,
        guide.commonValues
      )
    : [];

  // Merge glossaries for tooltip display
  const mergedGlossary = guide
    ? buildGlossary(adminGlossary, guide.glossary)
    : adminGlossary;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">
            {error || "가이드를 찾을 수 없습니다"}
          </p>
          <Link
            href="/guides"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.id === guide.authorId;
  const isAdmin = currentUser && currentUser.role === "admin";
  const canManage = isOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 shadow-lg text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/guides"
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm"
        >
          ← 목록으로
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {guide.title}
        </h1>

        {/* Author info */}
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{author?.nickname || "알 수 없음"}</span>
          {author?.server && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
              {author.server}
            </span>
          )}
          {author?.alliance && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
              {author.alliance}
            </span>
          )}
        </div>

        {/* Description */}
        {guide.description && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {guide.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>👍 {likes}</span>
          <span>👎 {dislikes}</span>
          <span>📅 {relativeDate(guide.createdAt)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          onClick={() => handleReaction("like")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            userReaction === "like"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          👍 좋아요
        </button>
        <button
          onClick={() => handleReaction("dislike")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            userReaction === "dislike"
              ? "bg-red-600 text-white border-red-600"
              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          👎 싫어요
        </button>
        <button
          onClick={handleImport}
          disabled={importSaving}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
        >
          {importSaving ? "저장 중..." : currentUser ? "📋 내 가이드로 저장" : "📋 임시로 가져오기"}
        </button>
        <button
          onClick={() => {
            if (!currentUser) {
              showToast("로그인이 필요합니다");
              return;
            }
            setShowReportForm((v) => !v);
          }}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          🚨 신고
        </button>
        {canManage && (
          <>
            <button
              onClick={() => setEditorOpen(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              🗑️ 삭제
            </button>
          </>
        )}
      </div>

      {/* Report form */}
      {showReportForm && (
        <div className="mb-6 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
            🚨 신고 사유 선택
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                  reportReason === reason
                    ? "bg-red-600 text-white border-red-600"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={reportSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {reportSubmitting ? "처리 중..." : "신고하기"}
            </button>
            <button
              onClick={() => setShowReportForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Preview section */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            가이드 미리보기
          </h2>
          {/* Tier selector for preview */}
          <select
            value={previewTier}
            onChange={(e) => setPreviewTier(e.target.value as TierLevel)}
            className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <option value="명함">명함</option>
            <option value="저돌파">저돌파</option>
            <option value="중돌파">중돌파</option>
            <option value="고돌파">고돌파</option>
          </select>
        </div>

        <div className="space-y-3">
          {resolvedSteps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isCompleted={false}
              isCurrent={false}
              isExpanded={expandedSteps.has(step.id)}
              onToggle={() => {}}
              onToggleExpand={() => toggleExpand(step.id)}
              glossary={mergedGlossary}
            />
          ))}
        </div>

        {resolvedSteps.length === 0 && (
          <p className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
            스텝이 없습니다.
          </p>
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen && guide && (
        <GuideEditor
          steps={guide.steps}
          tierValues={guide.tierValues || {} as TierValuesMap}
          commonValues={guide.commonValues || {} as CommonValuesMap}
          mode="server"
          guideCode={code as string}
          guideTitle={guide.title}
          isPublic={guide.isPublic}
          adminGlossary={adminGlossary}
          guideGlossary={guide.glossary}
          onSave={() => {
            setEditorOpen(false);
            fetchGuide();
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
