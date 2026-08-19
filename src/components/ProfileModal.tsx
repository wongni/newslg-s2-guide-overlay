"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "./AuthProvider";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuthContext();
  const [nickname, setNickname] = useState("");
  const [server, setServer] = useState("");
  const [alliance, setAlliance] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname);
      setServer(user.server || "");
      setAlliance(user.alliance || "");
      setError("");
      setSuccess("");
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    // Force IME composition to commit before reading state
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise((r) => setTimeout(r, 0));

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateProfile({
        nickname: nickname.trim(),
        server: server.trim() || undefined,
        alliance: alliance.trim() || undefined,
      });
      setSuccess("프로필이 저장되었습니다.");
      setTimeout(() => onClose(), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          프로필 수정
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              이메일
            </label>
            <div className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-500 dark:text-zinc-400">
              {user.email}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label
              htmlFor="profile-nickname"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            />
          </div>

          {/* Server */}
          <div>
            <label
              htmlFor="profile-server"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              서버
            </label>
            <input
              id="profile-server"
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="예: 3서버"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            />
          </div>

          {/* Alliance */}
          <div>
            <label
              htmlFor="profile-alliance"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              동맹
            </label>
            <input
              id="profile-alliance"
              type="text"
              value={alliance}
              onChange={(e) => setAlliance(e.target.value)}
              placeholder="동맹 이름"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
