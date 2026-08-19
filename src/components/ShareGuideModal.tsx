"use client";

import { useState, useEffect } from "react";
import { GuideStepRaw } from "@/types/guide";
import { TierValuesMap, CommonValuesMap } from "@/data/tier-config";

interface ShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: GuideStepRaw[];
  tierValues: TierValuesMap;
  commonValues: CommonValuesMap;
}

interface CurrentUser {
  id: string;
  role: string;
}

export function ShareGuideModal({
  isOpen,
  onClose,
  steps,
  tierValues,
  commonValues,
}: ShareGuideModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [successCode, setSuccessCode] = useState<string | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth on open
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser({ id: data.user.id, role: data.user.role });
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecked(true));
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setIsPublic(true);
      setError(null);
      setSuccessCode(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }
    if (title.length > 50) {
      setError("제목은 50자 이하여야 합니다");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          steps,
          tierValues,
          commonValues,
          isPublic,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessCode(data.code);
      } else {
        setError(data.error || "공유에 실패했습니다");
      }
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = successCode
    ? `https://cheonha.samgukji.top/guides/${successCode}`
    : "";

  const copyCode = async () => {
    if (!successCode) return;
    try {
      await navigator.clipboard.writeText(successCode);
      alert("코드가 복사되었습니다!");
    } catch {
      // fallback
      prompt("코드를 복사하세요:", successCode);
    }
  };

  const copyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("URL이 복사되었습니다!");
    } catch {
      prompt("URL을 복사하세요:", shareUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              가이드 공유하기
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* Not logged in */}
          {authChecked && !currentUser && (
            <div className="text-center py-6">
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                로그인이 필요합니다
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                가이드를 공유하려면 먼저 로그인해주세요.
              </p>
            </div>
          )}

          {/* Success state */}
          {successCode && (
            <div className="text-center py-4">
              <div className="mb-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  가이드가 공유되었습니다!
                </p>
                <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest">
                  {successCode}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={copyCode}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  📋 클립보드에 복사
                </button>

                <div className="text-xs text-zinc-500 dark:text-zinc-400 break-all px-2">
                  {shareUrl}
                </div>

                <button
                  onClick={copyUrl}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  🔗 URL 복사
                </button>
              </div>

              <button
                onClick={onClose}
                className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                닫기
              </button>
            </div>
          )}

          {/* Form (only when logged in and not yet succeeded) */}
          {authChecked && currentUser && !successCode && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  placeholder="예: 초보용 명함 가이드"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-1 text-xs text-zinc-400 text-right">
                  {title.length}/50
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="가이드에 대한 간단한 설명"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-1 text-xs text-zinc-400 text-right">
                  {description.length}/200
                </div>
              </div>

              {/* Public/Private toggle */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  공개 설정
                </label>
                <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      isPublic
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    🌐 공개
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                      !isPublic
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    🔒 비공개
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {isPublic
                    ? "커뮤니티에 공개됩니다"
                    : "나만 볼 수 있습니다 (다른 기기 동기화용)"}
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "공유 중..." : "공유하기"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
