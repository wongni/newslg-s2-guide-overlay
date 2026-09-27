// [배럴] 활성 시즌의 enemy-decks(정찰 판정) 로직/데이터를 re-export.
import { getActiveSeason } from "./season";
import * as s2 from "./s2/enemy-decks";
import * as s3 from "./s3/enemy-decks";

const active = getActiveSeason() === "s2" ? s2 : s3;

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
