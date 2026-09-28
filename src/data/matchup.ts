// [배럴] 활성 시즌의 matchup 데이터를 re-export 한다.
// 실제 데이터는 ./s2/matchup, ./s3/matchup 에 있다.
//
// 시즌마다 조합(TeamName) 목록이 다르므로, UI 호환을 위해
// 배럴 레벨에서는 조합명을 넓은 문자열 기반 타입으로 노출한다.

import { getActiveSeason } from "./season";
import * as s2 from "./s2/matchup";
import * as s3 from "./s3/matchup";

const active = getActiveSeason() === "s2" ? s2 : s3;

export type { MatchupResult, MatchupMeta } from "./s3/matchup";

// 시즌별 조합명 합집합. (실제 데이터 정합성은 각 시즌 내부 모듈에서 보장)
export type TeamName = string;

export const MATCHUP_META = active.MATCHUP_META;
export const TEAMS: readonly TeamName[] = active.TEAMS;
export const DECK_SLUG: Record<TeamName, string | null> =
  active.DECK_SLUG as Record<TeamName, string | null>;
export const DECK_BASE_URL = active.DECK_BASE_URL;
export const MATCHUP_MATRIX = active.MATCHUP_MATRIX;
export const deckUrl = active.deckUrl as (team: TeamName) => string | null;

// 표시용 라벨 맵. 활성 시즌에 없으면 키를 그대로 라벨로 사용.
export const TEAM_DISPLAY: Record<TeamName, string> =
  (active as { TEAM_DISPLAY?: Record<string, string> }).TEAM_DISPLAY ?? {};

// 표준 덱 키 → 표시 라벨 (없으면 키 그대로)
export function teamLabel(team: TeamName): string {
  return TEAM_DISPLAY[team] ?? team;
}
