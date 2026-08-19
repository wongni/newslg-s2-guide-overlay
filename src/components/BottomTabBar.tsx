"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { TAB_ROUTES } from "./AppShell";

function isActiveTab(pathname: string, tabPath: string): boolean {
  if (tabPath === "/") return pathname === "/";
  return pathname.startsWith(tabPath);
}

interface BottomTabBarProps {
  pathname: string;
}

export function BottomTabBar({ pathname }: BottomTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const primaryTabs = TAB_ROUTES.filter((t) => t.primary);
  const secondaryTabs = TAB_ROUTES.filter((t) => !t.primary);

  // Is any secondary tab active?
  const secondaryActive = secondaryTabs.some((t) => isActiveTab(pathname, t.path));

  // Close 'more' popup on outside click
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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around h-16">
        {primaryTabs.map((tab) => {
          const active = isActiveTab(pathname, tab.path);
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-xs transition-colors ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.mobileLabel}</span>
            </Link>
          );
        })}

        {/* More button for secondary tabs */}
        {secondaryTabs.length > 0 && (
          <div className="relative flex-1 flex items-center justify-center" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs transition-colors w-full h-full ${
                secondaryActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <span className="text-lg leading-none">•••</span>
              <span className="font-medium">더보기</span>
            </button>

            {/* Popup for secondary tabs */}
            {moreOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-36 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700">
                {secondaryTabs.map((tab) => {
                  const active = isActiveTab(pathname, tab.path);
                  return (
                    <Link
                      key={tab.path}
                      href={tab.path}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
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
        )}
      </div>
    </nav>
  );
}
