"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "./AuthProvider";
import { LoginModal } from "./LoginModal";
import { ProfileModal } from "./ProfileModal";

export function UserMenu() {
  const { user, loading, logout } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          로그인
        </button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          aria-label="사용자 메뉴"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user.nickname.charAt(0)}
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">
            {user.nickname}
          </span>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
            <button
              onClick={() => {
                setShowDropdown(false);
                setShowProfileModal(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              프로필
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                // Navigate to my guides - placeholder
                window.location.href = "/?tab=my-guides";
              }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              내 가이드
            </button>
            <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
            <button
              onClick={() => {
                setShowDropdown(false);
                logout();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
