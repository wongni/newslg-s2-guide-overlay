"use client";

import { useEffect, useState, useCallback } from "react";
import { TierLevel } from "@/data/tier-config";

const STORAGE_KEY = "s2-guide-tier";
const CHANNEL_NAME = "s2-guide-tier";

export function useTier() {
  const [tier, setTierState] = useState<TierLevel>("명함");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["명함", "저돌파", "중돌파", "고돌파"].includes(stored)) {
        setTierState(stored as TierLevel);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync across tabs via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const data = event.data as TierLevel;
      setTierState(data);
    };
    return () => channel.close();
  }, []);

  const setTier = useCallback((newTier: TierLevel) => {
    setTierState(newTier);
    localStorage.setItem(STORAGE_KEY, newTier);
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(newTier);
      channel.close();
    } catch {
      // BroadcastChannel may not be available
    }
  }, []);

  return { tier, setTier };
}
