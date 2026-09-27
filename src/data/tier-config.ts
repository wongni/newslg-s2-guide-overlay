// [배럴] 활성 시즌의 tier-config(진급 티어 값/공통 값) 로직·데이터.
import { getActiveSeason } from "./season";
import * as s2 from "./s2/tier-config";
import * as s3 from "./s3/tier-config";

const active = getActiveSeason() === "s2" ? s2 : s3;

export type TierLevel = "명함" | "저돌파" | "중돌파" | "고돌파";
export type TierValuesMap = Record<TierLevel, Record<string, string>>;
export type CommonValuesMap = Record<string, string>;

export const TIER_LEVELS = active.TIER_LEVELS;
export const COMMON_VALUES: CommonValuesMap = active.COMMON_VALUES;
export const TIER_VALUES: TierValuesMap = active.TIER_VALUES as TierValuesMap;

export function getMergedValues(
  tier: TierLevel,
  tierValues?: TierValuesMap,
  commonValues?: CommonValuesMap
): Record<string, string> {
  const tv = tierValues || TIER_VALUES;
  const cv = commonValues || COMMON_VALUES;
  return { ...cv, ...tv[tier] };
}
