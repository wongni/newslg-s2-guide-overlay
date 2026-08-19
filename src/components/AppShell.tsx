"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { UserMenu } from "./UserMenu";
import { BottomTabBar } from "./BottomTabBar";

export interface TabRoute {
  path: string;
  label: string;
  mobileLabel: string;
  icon: string;
  primary: boolean;
}

export const TAB_ROUTES: TabRoute[] = [
  { path: "/", label: "가이드", mobileLabel: "가이드", icon: "📋", primary: true },
  { path: "/my-guides", label: "나의", mobileLabel: "나의", icon: "✏️", primary: true },
  { path: "/guides", label: "커뮤니티", mobileLabel: "커뮤", icon: "🌐", primary: true },
  { path: "/giljak", label: "길작", mobileLabel: "길작", icon: "🛤️", primary: true },
  { path: "/matchup", label: "상성", mobileLabel: "상성", icon: "⚔️", primary: true },
  { path: "/roi", label: "ROI", mobileLabel: "ROI", icon: "📈", primary: false },
  { path: "/calculator", label: "계산기", mobileLabel: "계산기", icon: "🧮", primary: false },
  { path: "/leveling", label: "레벨업", mobileLabel: "레벨업", icon: "🎯", primary: false },
];

function isActiveTab(pathname: string, tabPath: string): boolean {
  if (tabPath === "/") return pathname === "/";
  return pathname.startsWith(tabPath);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const themeIcon = mounted ? (resolvedTheme === "dark" ? "☀️" : "🌙") : "🌙";

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
            <span className="hidden md:inline">S2 개척 가이드</span>
            <span className="md:hidden">S2 가이드</span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
            {TAB_ROUTES.map((tab) => {
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
          </nav>

          {/* Right side: theme toggle + user menu */}
          <div className="flex items-center gap-2 ml-auto">
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
