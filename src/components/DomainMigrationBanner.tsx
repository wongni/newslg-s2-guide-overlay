"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 도메인 이전 안내 배너
 *
 * 기존 도메인(sam.wongni.xyz)에서 접속한 사용자에게만 표시되며,
 * 새 도메인(cheonha.samgukji.top)으로 이동을 안내합니다.
 * 새 도메인에서 접속한 사용자에게는 표시되지 않습니다.
 *
 * - 호스트명을 클라이언트에서 감지하므로 앱은 어느 도메인에서든 동일하게 동작합니다.
 * - 닫기 상태는 localStorage에 저장되어 재방문 시 다시 뜨지 않습니다.
 */

// 기존(만료 예정) 도메인 호스트명
const OLD_HOST = "sam.wongni.xyz";
// 새 도메인 URL
const NEW_URL = "https://cheonha.samgukji.top";
const NEW_HOST = "cheonha.samgukji.top";
// 기존 도메인 만료일 (안내 문구용)
const OLD_DOMAIN_EOL = "2026년 9월 24일";
// 닫기 상태 저장 키
const DISMISS_KEY = "domain-migration-banner-dismissed";

// storage 이벤트 구독자 관리 (다른 탭/컴포넌트에서 닫아도 반영)
const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
function notify() {
  for (const l of listeners) l();
}

// 클라이언트에서만 실제 노출 여부를 계산한다.
// - 기존 도메인(OLD_HOST)에서 접속했고, 아직 닫지 않았을 때만 true
function getSnapshot() {
  const onOldHost = window.location.hostname === OLD_HOST;
  if (!onOldHost) return false;
  return window.localStorage.getItem(DISMISS_KEY) !== "1";
}
// SSR/최초 하이드레이션 시점에는 항상 숨김 (하이드레이션 불일치 방지)
function getServerSnapshot() {
  return false;
}

export function DomainMigrationBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage 사용 불가 환경은 조용히 무시
    }
    notify();
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="w-full bg-yellow-100 dark:bg-yellow-900/40 border-b border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200"
    >
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
        <span aria-hidden="true" className="text-base leading-none">
          📢
        </span>
        <p className="flex-1 leading-snug">
          이 사이트는 새 주소로 이동합니다:{" "}
          <a
            href={NEW_URL}
            className="font-semibold underline underline-offset-2 hover:text-yellow-700 dark:hover:text-yellow-100"
          >
            {NEW_HOST}
          </a>{" "}
          <span className="text-yellow-700 dark:text-yellow-300/80">
            (기존 주소는 {OLD_DOMAIN_EOL} 이후 종료됩니다)
          </span>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="안내 배너 닫기"
          className="shrink-0 rounded-md px-2 py-1 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
