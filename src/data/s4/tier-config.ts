import tierValuesJson from "./tier-values.json";
import commonValuesJson from "./common-values.json";

export type TierLevel = "명함" | "저돌파" | "중돌파" | "고돌파";

// S4 타임라인 원문의 구분과 앱 티어의 연결:
//   풀돌 → 고돌파 / 중돌(중·고돌파) → 중돌파 / 저돌 → 저돌파 / 명함 → 명함
export const TIER_LEVELS: { id: TierLevel; label: string; description: string }[] = [
  { id: "명함", label: "명함", description: "무진급 (백판)" },
  { id: "저돌파", label: "저돌파", description: "1~2진급 (저홍)" },
  { id: "중돌파", label: "중돌파", description: "3진급 (중홍)" },
  { id: "고돌파", label: "고돌파", description: "4진급+ (고홍·만홍) · S4 원문의 '풀돌' 기준" },
];

export type TierValuesMap = Record<TierLevel, Record<string, string>>;
export type CommonValuesMap = Record<string, string>;

/** 공통 값 (티어 무관). 수비대 목록, 최적 부대 등. */
export const COMMON_VALUES: CommonValuesMap = commonValuesJson;

/** 진급 상태별 동적 값. guide-steps.json 텍스트의 {{key}} 로 참조. */
export const TIER_VALUES: TierValuesMap = tierValuesJson as TierValuesMap;

/** common + tier-specific 병합. 같은 key면 tier-specific 우선. */
export function getMergedValues(
  tier: TierLevel,
  tierValues?: TierValuesMap,
  commonValues?: CommonValuesMap
): Record<string, string> {
  const tv = tierValues || TIER_VALUES;
  const cv = commonValues || COMMON_VALUES;
  return { ...cv, ...tv[tier] };
}
