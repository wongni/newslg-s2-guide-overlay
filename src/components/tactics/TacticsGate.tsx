"use client";

import { useState } from "react";

interface TacticsGateProps {
  onSuccess: () => void;
}

/**
 * 전술 페이지 접근 게이트.
 * 정찰(scout)과 동일한 패스코드(SCOUT_PASSCODE)/쿠키를 재사용한다.
 * 즉, 정찰에서 이미 인증했다면 전술도 바로 열린다.
 */
export function TacticsGate({ onSuccess }: TacticsGateProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scout/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "인증에 실패했습니다.");
        return;
      }
      onSuccess();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="text-3xl">🔐</div>
          <h1 className="text-lg font-bold">전술 (동맹 전용)</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            동맹에서 공유한 패스코드를 입력하세요.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="패스코드"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "확인 중..." : "입장"}
          </button>
        </form>
      </div>
    </div>
  );
}
