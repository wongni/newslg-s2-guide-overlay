"use client";

import { useEffect, useState } from "react";
import { TacticsGate } from "@/components/tactics/TacticsGate";

/**
 * /tactics 이하 모든 페이지(허브 + 하위 전술)를 감싸는 접근 게이트.
 * 정찰과 동일한 패스코드/쿠키(SCOUT_PASSCODE, scout_pass)를 재사용한다.
 */
export default function TacticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/scout/gate")
      .then((r) => r.json())
      .then((j) => active && setAuthorized(Boolean(j.authorized)))
      .catch(() => active && setAuthorized(false));
    return () => {
      active = false;
    };
  }, []);

  if (authorized === null) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
        확인 중...
      </div>
    );
  }

  if (!authorized) {
    return <TacticsGate onSuccess={() => setAuthorized(true)} />;
  }

  return <>{children}</>;
}
