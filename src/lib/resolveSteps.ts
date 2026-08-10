import { GuideStep, GuideStepRaw } from "@/types/guide";
import { TierLevel, TIER_VALUES } from "@/data/tier-config";

/**
 * {{key}} 형식의 플레이스홀더를 진급 상태별 값으로 치환
 */
function interpolate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\S+?)\}\}/g, (match, key: string) => {
    return values[key] ?? match;
  });
}

function interpolateArray(
  arr: string[] | undefined,
  values: Record<string, string>
): string[] | undefined {
  if (!arr) return undefined;
  return arr.map((s) => interpolate(s, values));
}

/**
 * 가이드 스텝 배열을 진급 상태에 맞게 동적으로 변환.
 * id는 배열 인덱스 기반(1-based)으로 자동 부여.
 */
export function resolveSteps(
  rawSteps: GuideStepRaw[],
  tier: TierLevel
): GuideStep[] {
  const values = TIER_VALUES[tier];
  return rawSteps.map((step, index) => ({
    id: index + 1,
    phase: step.phase,
    title: interpolate(step.title, values),
    tasks: step.tasks.map((t) => interpolate(t, values)),
    conditions: interpolateArray(step.conditions, values),
    warnings: interpolateArray(step.warnings, values),
    tips: interpolateArray(step.tips, values),
    rewards: interpolateArray(step.rewards, values),
  }));
}
