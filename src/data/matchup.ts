// [배럴] 활성 시즌의 matchup 데이터를 re-export 한다.
// 실제 데이터는 ./s2/matchup, ./s3/matchup, ./s4/matchup 에 있다.
//
// 시즌마다 조합(TeamName) 목록이 다르므로, UI 호환을 위해
// 배럴 레벨에서는 조합명을 넓은 문자열 기반 타입으로 노출한다.

import { getActiveSeason } from "./season";
import * as s2 from "./s2/matchup";
import * as s3 from "./s3/matchup";
import * as s4 from "./s4/matchup";
import type { MatchupResult, MatchupMeta } from "./s4/matchup";

const season = getActiveSeason();
const active = season === "s2" ? s2 : season === "s4" ? s4 : s3;

// S4 결과 타입("부족" 포함)이 S2/S3의 상위 집합이다.
export type { MatchupResult, MatchupMeta };

// 시즌별 조합명 합집합. (실제 데이터 정합성은 각 시즌 내부 모듈에서 보장)
export type TeamName = string;

// S2/S3에는 "부족" 키가 없지만, 그 시즌 매트릭스에는 "부족"이 나오지 않는다.
export const MATCHUP_META = active.MATCHUP_META as Record<MatchupResult, MatchupMeta>;
export const TEAMS: readonly TeamName[] = active.TEAMS;
export const DECK_SLUG: Record<TeamName, string | null> =
  active.DECK_SLUG as Record<TeamName, string | null>;
export const DECK_BASE_URL = active.DECK_BASE_URL;
export const MATCHUP_MATRIX: MatchupResult[][] = active.MATCHUP_MATRIX;
export const deckUrl = active.deckUrl as (team: TeamName) => string | null;

// 칸에 표시할 원본 표기 (S4: 승률 "60-70%" 등). 없는 시즌은 null.
export const MATCHUP_RATES: string[][] | null =
  season === "s4" ? s4.MATCHUP_RATES : null;

// 표시용 라벨 맵. 활성 시즌에 없으면 키를 그대로 라벨로 사용.
export const TEAM_DISPLAY: Record<TeamName, string> =
  (active as { TEAM_DISPLAY?: Record<string, string> }).TEAM_DISPLAY ?? {};

// 표준 덱 키 → 표시 라벨 (없으면 키 그대로)
export function teamLabel(team: TeamName): string {
  return TEAM_DISPLAY[team] ?? team;
}
