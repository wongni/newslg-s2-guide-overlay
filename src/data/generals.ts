// [배럴] 활성 시즌의 generals 데이터를 re-export.
import { getActiveSeason } from "./season";
import * as s2 from "./s2/generals";
import * as s3 from "./s3/generals";

const active = getActiveSeason() === "s2" ? s2 : s3;

export type { Faction } from "./s3/generals";
export type { DeckPreset } from "./s3/generals";

export const FACTIONS = active.FACTIONS;
export const GENERALS_BY_FACTION = active.GENERALS_BY_FACTION;
export const ALL_GENERALS = active.ALL_GENERALS;
export const TEAM_GENERALS: Record<string, string[]> =
  active.TEAM_GENERALS as Record<string, string[]>;

// 전법(덱) 프리셋 — 활성 시즌에 정의되어 있으면 노출, 없으면 빈 배열.
export const DECK_PRESETS: import("./s3/generals").DeckPreset[] =
  (active as { DECK_PRESETS?: import("./s3/generals").DeckPreset[] }).DECK_PRESETS ?? [];

// 활성 시즌의 조합명(문자열)을 받아 판정. (시즌별 TeamName 합집합 호환)
export function canBuildTeam(
  team: string,
  owned: ReadonlySet<string>
): boolean {
  const need = (active.TEAM_GENERALS as Record<string, string[]>)[team];
  if (!need) return false;
  return need.every((g) => owned.has(g));
}

export function missingGenerals(
  team: string,
  owned: ReadonlySet<string>
): string[] {
  const need = (active.TEAM_GENERALS as Record<string, string[]>)[team];
  if (!need) return [];
  return need.filter((g) => !owned.has(g));
}
