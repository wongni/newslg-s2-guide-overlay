"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// --- 상수 ---
const MOVE_SEC = 10; // 타일 이동 시간
const BATTLE_SEC = 1; // 수비군 전투 시간
const CAPTURE_NORMAL_SEC = 180; // 평시 점령 시간 (3분)
const CAPTURE_NIGHT_SEC = 540; // 심야 점령 시간 (9분)
const NIGHT_START_HOUR = 2; // 심야 시작 (KST 새벽 2시)
const NIGHT_END_HOUR = 7; // 심야 끝 (KST 오전 7시)
const MAX_TILES = 9;

// KST 기준 현재 심야인지 확인
function isNightTime(date: Date): boolean {
  // KST = UTC+9
  const kstHour = (date.getUTCHours() + 9) % 24;
  return kstHour >= NIGHT_START_HOUR && kstHour < NIGHT_END_HOUR;
}

// 특정 시각부터 n칸 길작의 각 단계 종료 시각 계산
function calculateTimeline(startTime: Date, tiles: number) {
  const steps: { label: string; endTime: Date; durationSec: number }[] = [];
  let current = new Date(startTime);

  for (let i = 1; i <= tiles; i++) {
    // 1. 이동
    const moveEnd = new Date(current.getTime() + MOVE_SEC * 1000);
    steps.push({ label: `${i}칸 이동`, endTime: moveEnd, durationSec: MOVE_SEC });
    current = moveEnd;

    // 2. 전투
    const battleEnd = new Date(current.getTime() + BATTLE_SEC * 1000);
    steps.push({ label: `${i}칸 전투`, endTime: battleEnd, durationSec: BATTLE_SEC });
    current = battleEnd;

    // 3. 점령 (심야 여부는 점령 시작 시점 기준)
    const captureSec = isNightTime(current) ? CAPTURE_NIGHT_SEC : CAPTURE_NORMAL_SEC;
    const captureEnd = new Date(current.getTime() + captureSec * 1000);
    const timeLabel = isNightTime(current) ? "심야" : "평시";
    steps.push({
      label: `${i}칸 점령 (${timeLabel})`,
      endTime: captureEnd,
      durationSec: captureSec,
    });
    current = captureEnd;
  }

  return steps;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
}

export default function GiljakTimerPage() {
  const [tiles, setTiles] = useState(9);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 타이머 tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setNow(new Date()), 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStart = useCallback(() => {
    const start = new Date();
    setStartTime(start);
    setNow(start);
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setStartTime(null);
  }, []);

  // 타임라인 계산
  const timeline = startTime ? calculateTimeline(startTime, tiles) : null;
  const totalDurationSec = timeline
    ? timeline.reduce((sum, s) => sum + s.durationSec, 0)
    : (MOVE_SEC + BATTLE_SEC + CAPTURE_NORMAL_SEC) * tiles;
  const endTime = timeline ? timeline[timeline.length - 1].endTime : null;

  // 현재 진행 중인 단계
  let currentStepIndex = -1;
  if (timeline && isRunning) {
    for (let i = 0; i < timeline.length; i++) {
      if (now < timeline[i].endTime) {
        currentStepIndex = i;
        break;
      }
    }
    if (currentStepIndex === -1) currentStepIndex = timeline.length; // 완료
  }

  // 전체 남은 시간
  const totalRemaining = endTime ? endTime.getTime() - now.getTime() : 0;

  // 현재 심야 여부
  const currentlyNight = isNightTime(now);

  // 미리보기 계산 (시작 전)
  const previewTimeline = !isRunning ? calculateTimeline(new Date(), tiles) : null;
  const previewTotal = previewTimeline
    ? previewTimeline.reduce((sum, s) => sum + s.durationSec, 0)
    : 0;

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Page title */}
        <h1 className="text-lg font-bold">🛤️ 길작 타이머</h1>

        {/* 현재 상태 */}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            현재 시간대:{" "}
            <span
              className={
                currentlyNight
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-amber-600 dark:text-amber-400 font-bold"
              }
            >
              {currentlyNight ? "🌙 심야 (점령 9분)" : "☀️ 평시 (점령 3분)"}
            </span>
          </span>
          <span>이동 10초 · 전투 1초</span>
        </div>

        {/* 칸 수 선택 */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">길작 칸 수:</label>
          <div className="flex gap-1">
            {Array.from({ length: MAX_TILES }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => !isRunning && setTiles(n)}
                disabled={isRunning}
                className={`w-8 h-8 rounded text-sm font-bold transition-colors ${
                  tiles === n
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 예상 시간 (시작 전) */}
        {!isRunning && (
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                예상 총 소요 시간 ({tiles}칸)
              </span>
              <span className="font-bold">{formatDuration(previewTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-zinc-500 dark:text-zinc-400">예상 완료 시각</span>
              <span className="font-bold">
                {previewTimeline
                  ? formatTime(previewTimeline[previewTimeline.length - 1].endTime)
                  : "-"}
              </span>
            </div>
          </div>
        )}

        {/* 시작/중지 버튼 */}
        <button
          onClick={isRunning ? handleStop : handleStart}
          className={`w-full py-3 rounded-lg text-sm font-bold transition-colors ${
            isRunning
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}
        >
          {isRunning ? "⏹ 타이머 중지" : "▶️ 길작 시작"}
        </button>

        {/* 실행 중 카운트다운 */}
        {isRunning && timeline && (
          <div className="space-y-3">
            {/* 전체 남은 시간 */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                전체 남은 시간
              </div>
              <div className="text-3xl font-mono font-bold text-amber-700 dark:text-amber-300">
                {totalRemaining > 0 ? formatCountdown(totalRemaining) : "✅ 완료!"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                완료 예정: {formatTime(endTime!)}
              </div>
            </div>

            {/* 단계별 타임라인 */}
            <div className="space-y-1">
              {timeline.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isDone = i < currentStepIndex;
                const remaining = step.endTime.getTime() - now.getTime();

                // 3단계씩 그룹핑 (이동/전투/점령)
                const tileNum = Math.floor(i / 3) + 1;
                const isCapture = i % 3 === 2;
                const isTileStart = i % 3 === 0;

                return (
                  <div key={i}>
                    {isTileStart && (
                      <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-2 mb-0.5">
                        — {tileNum}칸째 —
                      </div>
                    )}
                    <div
                      className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                        isActive
                          ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700"
                          : isDone
                            ? "bg-green-50 dark:bg-green-950/20 text-zinc-400 dark:text-zinc-600"
                            : "bg-zinc-50 dark:bg-zinc-900/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xs">
                          {isDone ? "✅" : isActive ? "⏳" : "⬜"}
                        </span>
                        <span className={isDone ? "line-through" : ""}>
                          {step.label}
                        </span>
                        {isCapture && (
                          <span className="text-[10px] text-zinc-400">
                            ({formatDuration(step.durationSec)})
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-xs">
                        {isDone
                          ? formatTime(step.endTime)
                          : isActive
                            ? formatCountdown(remaining)
                            : formatTime(step.endTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 참고 정보 */}
        <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <p>• 타일 이동: 10초 / 수비군 전투: 1초</p>
          <p>• 평시 점령: 3분 / 심야 점령: 9분 (KST 01:00~07:00)</p>
          <p>• 심야 여부는 각 점령 시작 시점 기준으로 판단됩니다</p>
          <p>• 최대 9칸까지 길작 가능</p>
        </div>
      </main>
    </div>
  );
}
