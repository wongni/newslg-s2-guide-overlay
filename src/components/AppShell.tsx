"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { UserMenu } from "./UserMenu";
import { BottomTabBar } from "./BottomTabBar";
import { SeasonSwitcher } from "./SeasonSwitcher";
import { getActiveSeason, getSeasonMeta } from "@/data/season";

export interface TabRoute {
  path: string;
  label: string;
  mobileLabel: string;
  icon: string;
  primary: boolean;
}

export const TAB_ROUTES: TabRoute[] = [
  { path: "/", label: "가이드", mobileLabel: "가이드", icon: "📋", primary: true },
  { path: "/pioneer", label: "트래킹(저돌)", mobileLabel: "저돌", icon: "🧭", primary: true },
  { path: "/pioneer-high", label: "트래킹(고돌)", mobileLabel: "고돌", icon: "🧭", primary: true },
  { path: "/my-guides", label: "나의", mobileLabel: "나의", icon: "✏️", primary: false },
  { path: "/guides", label: "커뮤니티", mobileLabel: "커뮤", icon: "🌐", primary: false },
  { path: "/giljak", label: "길작", mobileLabel: "길작", icon: "🛤️", primary: false },
  { path: "/matchup", label: "상성", mobileLabel: "상성", icon: "⚔️", primary: false },
  { path: "/scout", label: "정찰", mobileLabel: "정찰", icon: "🕵️", primary: false },
  { path: "/tactics", label: "전술", mobileLabel: "전술", icon: "🎓", primary: false },
  { path: "/roi", label: "ROI", mobileLabel: "ROI", icon: "📈", primary: false },
  { path: "/calculator", label: "계산기", mobileLabel: "계산기", icon: "🧮", primary: false },
  { path: "/leveling", label: "레벨업", mobileLabel: "레벨업", icon: "🎯", primary: false },
];

function isActiveTab(pathname: string, tabPath: string): boolean {
  if (tabPath === "/") return pathname === "/";
  return pathname === tabPath || pathname.startsWith(tabPath + "/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 데스크톱 '더보기' 팝업 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreOpen]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const themeIcon = mounted ? (resolvedTheme === "dark" ? "☀️" : "🌙") : "🌙";

  // 활성 시즌 코드 (마운트 전에는 기본 S3 표기 — hydration mismatch 방지용으로 mounted 후 갱신)
  const seasonCode = mounted ? getSeasonMeta(getActiveSeason()).code : "S3";

  // Don't render AppShell on guide detail pages (they have their own layout)
  const isDetailPage = pathname.startsWith("/guides/") && pathname !== "/guides";
  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Title */}
          <Link href="/" className="shrink-0 font-bold text-base text-zinc-900 dark:text-zinc-100">
            <span className="hidden md:inline">{seasonCode} 개척 가이드</span>
            <span className="md:hidden">{seasonCode} 가이드</span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
            {TAB_ROUTES.filter((t) => t.primary).map((tab) => {
              const active = isActiveTab(pathname, tab.path);
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.icon} {tab.label}
                </Link>
              );
            })}

            {/* More dropdown for secondary tabs */}
            {(() => {
              const secondaryTabs = TAB_ROUTES.filter((t) => !t.primary);
              if (secondaryTabs.length === 0) return null;
              const secondaryActive = secondaryTabs.some((t) =>
                isActiveTab(pathname, t.path)
              );
              return (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen((v) => !v)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      secondaryActive
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    ••• 더보기
                  </button>
                  {moreOpen && (
                    <div className="absolute top-full mt-1 left-0 w-40 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
                      {secondaryTabs.map((tab) => {
                        const active = isActiveTab(pathname, tab.path);
                        return (
                          <Link
                            key={tab.path}
                            href={tab.path}
                            onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              active
                                ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            }`}
                          >
                            <span>{tab.icon}</span>
                            <span className="font-medium">{tab.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </nav>

          {/* Right side: season switcher + theme toggle + user menu */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:block">
              <SeasonSwitcher compact />
            </div>
            <button
              onClick={toggleTheme}
              className="px-2 py-2 rounded-md text-sm transition-colors bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title={mounted && resolvedTheme === "dark" ? "라이트 모드" : "다크 모드"}
            >
              {themeIcon}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content area - add bottom padding on mobile for bottom bar */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar pathname={pathname} />
    </div>
  );
}
