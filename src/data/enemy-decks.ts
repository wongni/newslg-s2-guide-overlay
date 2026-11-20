// [배럴] 활성 시즌의 enemy-decks(정찰 판정) 로직/데이터를 re-export.
import { getActiveSeason } from "./season";
import * as s2 from "./s2/enemy-decks";
import * as s3 from "./s3/enemy-decks";
import * as s4 from "./s4/enemy-decks";
import { TEAMS } from "./matchup";
import { TEAM_GENERALS } from "./generals";
import type { TroopType } from "./s3/enemy-decks";

const season = getActiveSeason();
const active = season === "s2" ? s2 : season === "s4" ? s4 : s3;

export type {
  Verdict,
  VerdictMeta,
  Reinforcement,
  TroopType,
  TroopAdvantage,
  KeyGeneralTag,
  VerdictOutcome,
} from "./s3/enemy-decks";

export const ARMY_COUNT = active.ARMY_COUNT;
export const VERDICT_META = active.VERDICT_META;
export const REINFORCEMENTS = active.REINFORCEMENTS;
export const REINFORCEMENT_RANK = active.REINFORCEMENT_RANK;
export const TROOP_TYPES = active.TROOP_TYPES;
export const TROOP_META = active.TROOP_META;
export const troopAdvantage = active.troopAdvantage;
export const KEY_GENERAL_TAGS: readonly string[] = active.KEY_GENERAL_TAGS;
export const deckHasGenerals = active.deckHasGenerals;
export const resolveStandardDeck = active.resolveStandardDeck as (
  name: string
) => string | null;
export const resolveDeckByGenerals = active.resolveDeckByGenerals as (
  generals: string[]
) => string | null;
export const deckCanonicalKey = active.deckCanonicalKey;
export const isSameDeckCanonical = active.isSameDeckCanonical;
export const judgeMatchup = active.judgeMatchup;

// 정찰 화면의 표준 덱 목록과 덱별 무장.
// S4는 정찰 전용 티어덱 목록, S2/S3는 상성표 조합(TEAMS)을 그대로 쓴다.
export const SCOUT_DECKS: readonly string[] =
  season === "s4" ? s4.SCOUT_DECKS : TEAMS;
export const SCOUT_DECK_GENERALS: Record<string, string[]> =
  season === "s4" ? s4.SCOUT_DECK_GENERALS : TEAM_GENERALS;
// 표준 덱별 기본 병종 (무장 순서와 같은 위치). S2/S3는 정의 없음.
export const SCOUT_DECK_TROOPS: Record<string, TroopType[]> =
  season === "s4" ? s4.SCOUT_DECK_TROOPS : {};
