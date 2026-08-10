"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "s2-guide-progress";
const CHANNEL_NAME = "s2-guide-progress";

export function useProgress(totalSteps: number) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: number[] = JSON.parse(stored);
        setCompleted(new Set(parsed));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Sync across tabs via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const data: number[] = event.data;
      setCompleted(new Set(data));
    };
    return () => channel.close();
  }, []);

  const persist = useCallback((next: Set<number>) => {
    const arr = Array.from(next).sort((a, b) => a - b);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(arr);
      channel.close();
    } catch {
      // BroadcastChannel may not be available
    }
  }, []);

  const toggle = useCallback(
    (id: number) => {
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    setCompleted(new Set());
    persist(new Set());
  }, [persist]);

  const progressCount = completed.size;
  const progressPercent =
    totalSteps > 0 ? Math.round((progressCount / totalSteps) * 100) : 0;

  // Find the first uncompleted step
  const currentStepId = (() => {
    for (let i = 1; i <= totalSteps; i++) {
      if (!completed.has(i)) return i;
    }
    return null;
  })();

  return {
    completed,
    toggle,
    reset,
    progressCount,
    progressPercent,
    currentStepId,
  };
}
