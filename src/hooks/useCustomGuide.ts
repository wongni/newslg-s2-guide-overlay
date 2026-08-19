"use client";

import { useState, useEffect, useCallback } from "react";
import { GuideStepRaw } from "@/types/guide";
import { TierValuesMap, CommonValuesMap } from "@/data/tier-config";

const TEMP_STEPS_KEY = "s2-temp-guide-steps";
const TEMP_TIER_VALUES_KEY = "s2-temp-guide-tier-values";
const TEMP_COMMON_VALUES_KEY = "s2-temp-guide-common-values";

export type GuideSource = "default" | "server" | "temp";

export interface MyGuideInfo {
  code: string;
  title: string;
  isPublic: boolean;
  updatedAt: string;
}

export function useCustomGuide(
  bundledSteps: GuideStepRaw[],
  bundledTierValues: TierValuesMap,
  bundledCommonValues: CommonValuesMap,
  userId: string | null
) {
  // Server-side default data (fetched from API, may differ from bundled if admin edited)
  const [serverSteps, setServerSteps] = useState<GuideStepRaw[] | null>(null);
  const [serverTierValues, setServerTierValues] = useState<TierValuesMap | null>(null);
  const [serverCommonValues, setServerCommonValues] = useState<CommonValuesMap | null>(null);
  const [adminGlossary, setAdminGlossary] = useState<Record<string, string>>({});

  // Temp guide (sessionStorage, for non-logged-in imports)
  const [tempSteps, setTempSteps] = useState<GuideStepRaw[] | null>(null);
  const [tempTierValues, setTempTierValues] = useState<TierValuesMap | null>(null);
  const [tempCommonValues, setTempCommonValues] = useState<CommonValuesMap | null>(null);

  // Multi-guide support (server guides for logged-in users)
  const [myGuides, setMyGuides] = useState<MyGuideInfo[]>([]);
  const [activeGuideCode, setActiveGuideCode] = useState<string | null>(null);
  const [serverGuideSteps, setServerGuideSteps] = useState<GuideStepRaw[] | null>(null);
  const [serverGuideTierValues, setServerGuideTierValues] = useState<TierValuesMap | null>(null);
  const [serverGuideCommonValues, setServerGuideCommonValues] = useState<CommonValuesMap | null>(null);
  const [serverGuideGlossary, setServerGuideGlossary] = useState<Record<string, string> | undefined>(undefined);

  const [loaded, setLoaded] = useState(false);

  // Fetch latest default data from server
  const fetchServerData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guide");
      if (res.ok) {
        const data = await res.json();
        setServerSteps(data.steps);
        setServerTierValues(data.tierValues);
        setServerCommonValues(data.commonValues);
        if (data.glossary) {
          setAdminGlossary(data.glossary);
        }
      }
    } catch {
      // Use bundled defaults on failure
    }
  }, []);

  // Fetch user's guides from server
  const fetchMyGuides = useCallback(async () => {
    if (!userId) {
      setMyGuides([]);
      return;
    }
    try {
      const res = await fetch("/api/guides?mine=true");
      if (res.ok) {
        const data = await res.json();
        const guides: MyGuideInfo[] = (data.guides || []).map(
          (g: { code: string; title: string; isPublic: boolean; updatedAt: string }) => ({
            code: g.code,
            title: g.title,
            isPublic: g.isPublic,
            updatedAt: g.updatedAt,
          })
        );
        setMyGuides(guides);
      }
    } catch {
      // Ignore fetch errors
    }
  }, [userId]);

  // Load a server guide's full data by code
  const loadServerGuide = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/guides/${code}`);
      if (res.ok) {
        const data = await res.json();
        const guide = data.guide;
        setServerGuideSteps(guide.steps as GuideStepRaw[]);
        setServerGuideTierValues((guide.tierValues as TierValuesMap) || null);
        setServerGuideCommonValues((guide.commonValues as CommonValuesMap) || null);
        setServerGuideGlossary(guide.glossary as Record<string, string> | undefined);
      }
    } catch {
      // Fallback to default
      setActiveGuideCode(null);
      setServerGuideSteps(null);
      setServerGuideTierValues(null);
      setServerGuideCommonValues(null);
      setServerGuideGlossary(undefined);
    }
  }, []);

  // Select a guide (null = use default)
  const selectGuide = useCallback(
    (code: string | null) => {
      setActiveGuideCode(code);
      if (code) {
        loadServerGuide(code);
      } else {
        setServerGuideSteps(null);
        setServerGuideTierValues(null);
        setServerGuideCommonValues(null);
        setServerGuideGlossary(undefined);
      }
    },
    [loadServerGuide]
  );

  // Temp guide management (sessionStorage)
  const setTempGuide = useCallback(
    (steps: GuideStepRaw[], tierValues: TierValuesMap, commonValues: CommonValuesMap) => {
      setTempSteps(steps);
      setTempTierValues(tierValues);
      setTempCommonValues(commonValues);
      try {
        sessionStorage.setItem(TEMP_STEPS_KEY, JSON.stringify(steps));
        sessionStorage.setItem(TEMP_TIER_VALUES_KEY, JSON.stringify(tierValues));
        sessionStorage.setItem(TEMP_COMMON_VALUES_KEY, JSON.stringify(commonValues));
      } catch {
        // ignore
      }
    },
    []
  );

  const clearTempGuide = useCallback(() => {
    setTempSteps(null);
    setTempTierValues(null);
    setTempCommonValues(null);
    try {
      sessionStorage.removeItem(TEMP_STEPS_KEY);
      sessionStorage.removeItem(TEMP_TIER_VALUES_KEY);
      sessionStorage.removeItem(TEMP_COMMON_VALUES_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Load temp guide from sessionStorage + fetch server data on mount
  useEffect(() => {
    try {
      const storedSteps = sessionStorage.getItem(TEMP_STEPS_KEY);
      if (storedSteps) {
        setTempSteps(JSON.parse(storedSteps));
      }
      const storedTierValues = sessionStorage.getItem(TEMP_TIER_VALUES_KEY);
      if (storedTierValues) {
        setTempTierValues(JSON.parse(storedTierValues));
      }
      const storedCommonValues = sessionStorage.getItem(TEMP_COMMON_VALUES_KEY);
      if (storedCommonValues) {
        setTempCommonValues(JSON.parse(storedCommonValues));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
    fetchServerData();
  }, [fetchServerData]);

  // When userId changes, fetch user guides
  useEffect(() => {
    if (userId) {
      fetchMyGuides();
    } else {
      setMyGuides([]);
      // Clear server guide selection if logged out
      if (activeGuideCode) {
        setActiveGuideCode(null);
        setServerGuideSteps(null);
        setServerGuideTierValues(null);
        setServerGuideCommonValues(null);
        setServerGuideGlossary(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchMyGuides]);

  // Load server guide data on mount if we have an active code and user is logged in
  useEffect(() => {
    if (userId && activeGuideCode) {
      loadServerGuide(activeGuideCode);
    }
  }, [userId, activeGuideCode, loadServerGuide]);

  // Default data = server data if available, otherwise bundled
  const defaultSteps = serverSteps || bundledSteps;
  const defaultTierValues = serverTierValues || bundledTierValues;
  const defaultCommonValues = serverCommonValues || bundledCommonValues;

  // Resolve source
  const hasTempGuide = tempSteps !== null;

  let source: GuideSource;
  if (userId && activeGuideCode && serverGuideSteps) {
    source = "server";
  } else if (!userId && hasTempGuide) {
    source = "temp";
  } else {
    source = "default";
  }

  // Active data based on source
  let activeSteps: GuideStepRaw[];
  let activeTierValues: TierValuesMap;
  let activeCommonValues: CommonValuesMap;

  if (source === "server") {
    activeSteps = serverGuideSteps!;
    activeTierValues = serverGuideTierValues || defaultTierValues;
    activeCommonValues = serverGuideCommonValues || defaultCommonValues;
  } else if (source === "temp") {
    activeSteps = tempSteps!;
    activeTierValues = tempTierValues || defaultTierValues;
    activeCommonValues = tempCommonValues || defaultCommonValues;
  } else {
    activeSteps = defaultSteps;
    activeTierValues = defaultTierValues;
    activeCommonValues = defaultCommonValues;
  }

  // Active guide glossary (per-guide glossary from server guide)
  const activeGuideGlossary: Record<string, string> | undefined =
    source === "server" ? serverGuideGlossary : undefined;

  // Refresh server data (called after admin save)
  const refreshServerData = useCallback(() => {
    fetchServerData();
  }, [fetchServerData]);

  return {
    source,
    activeSteps,
    activeTierValues,
    activeCommonValues,
    defaultSteps,
    defaultTierValues,
    defaultCommonValues,
    loaded,
    refreshServerData,
    // Glossary
    adminGlossary,
    activeGuideGlossary,
    // Temp guide
    hasTempGuide,
    setTempGuide,
    clearTempGuide,
    // Multi-guide support
    myGuides,
    activeGuideCode,
    selectGuide,
    fetchMyGuides,
  };
}
