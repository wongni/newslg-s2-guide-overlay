import tierValuesJson from "./tier-values.json";
import commonValuesJson from "./common-values.json";

export type TierLevel = "명함" | "저돌파" | "중돌파" | "고돌파";

export const TIER_LEVELS: { id: TierLevel; label: string; description: string }[] = [
  { id: "명함", label: "명함", description: "무진급 (백판)" },
  { id: "저돌파", label: "저돌파", description: "1~2진급 (저홍)" },
  { id: "중돌파", label: "중돌파", description: "3진급 (중홍)" },
  { id: "고돌파", label: "고돌파", description: "4진급+ (고홍·만홍)" },
];

export type TierValuesMap = Record<TierLevel, Record<string, string>>;
export type CommonValuesMap = Record<string, string>;

/**
 * 공통 값 (티어 무관). 예: 수비군 난이도.
 * 한 번 수정하면 모든 티어에 동일 적용.
 */
export const COMMON_VALUES: CommonValuesMap = commonValuesJson;

/**
 * 진급 상태별 동적 값.
 * guide-steps.json 내 텍스트에 {{key}} 플레이스홀더로 참조됨.
 */
export const TIER_VALUES: TierValuesMap = tierValuesJson as TierValuesMap;

/**
 * 최종 resolve 시 사용할 병합된 값 (common + tier-specific).
 * 동일 key가 있을 경우 tier-specific이 우선.
 */
export function getMergedValues(
  tier: TierLevel,
  tierValues?: TierValuesMap,
  commonValues?: CommonValuesMap
): Record<string, string> {
  const tv = tierValues || TIER_VALUES;
  const cv = commonValues || COMMON_VALUES;
  return { ...cv, ...tv[tier] };
}
