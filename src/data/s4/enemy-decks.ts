// 시즌4 (남만 개척) 적 정찰(scout)용 덱 목록/판정 로직
//
// 출처: docs/S4/티어덱1~3.png (S4 티어덱 표), docs/S4/상성표.png
//
// 판정 규칙 (judgeMatchup):
//  - 같은 표준 덱끼리 → 미러
//  - 두 덱이 모두 S4 상성표(s4/matchup.ts)에 있고 칸에 데이터가 있으면 → 상성표 판정
//  - 덱에 수동 상성(manualVerdict)이 있으면 → 그 값
//  - 그 외 → 미확인(비등)
//
// 판정 외 공통 요소(판정 메타, 강화 단계, 병종)는 S3와 동일하므로 그대로 재사용한다.

export {
  ARMY_COUNT,
  VERDICT_META,
  REINFORCEMENTS,
  REINFORCEMENT_RANK,
  TROOP_TYPES,
  TROOP_META,
  troopAdvantage,
} from "../s3/enemy-decks";
export type {
  Verdict,
  VerdictMeta,
  Reinforcement,
  TroopType,
  TroopAdvantage,
  VerdictOutcome,
} from "../s3/enemy-decks";

import type { Verdict, VerdictOutcome, TroopType } from "../s3/enemy-decks";
import { TEAMS, MATCHUP_MATRIX, MATCHUP_RATES, type MatchupResult } from "./matchup";

// ---------------------------------------------------------------------------
// 표준 덱 (티어덱 표 순서)
// ---------------------------------------------------------------------------
// "남만"과 "제남만"은 무장 3명(축융부인/맹획/SP제갈량)이 같고 배치 순서와 병종이 다르다.
// 그래서 덱 식별은 무장 순서가 정확히 일치하는 덱을 먼저 찾고, 없으면 구성만으로 찾는다.
export const SCOUT_DECKS = [
  "남만",
  "제남만",
  "태비연",
  "태손육",
  "쌍황육",
  "조제이",
  "조순이",
  "좌전여",
  "조조사",
  "조숭사",
  "돈숭술",
  "초숭술",
  "좌관관",
  "태우등",
  "조제순",
] as const;

export type S4DeckName = (typeof SCOUT_DECKS)[number];

// 덱별 무장 3명 (티어덱 표 표기 순서). 진영 표기(군/위/오/촉)는 무장 이름에서 뺐다.
export const SCOUT_DECK_GENERALS: Record<S4DeckName, string[]> = {
  남만: ["축융부인", "맹획", "sp 제갈량"],
  제남만: ["sp 제갈량", "맹획", "축융부인"],
  태비연: ["주태", "장비", "위연"],
  태손육: ["육손", "손권", "주태"],
  쌍황육: ["육손", "손권", "조조"],
  조제이: ["조조", "sp 제갈량", "왕이"],
  조순이: ["조조", "순욱", "왕이"],
  좌전여: ["좌자", "전풍", "여포"],
  조조사: ["사마의", "조비", "조조"],
  조숭사: ["사마의", "조조", "황보숭"],
  돈숭술: ["황보숭", "하후돈", "원술"],
  초숭술: ["초선", "황보숭", "원술"],
  좌관관: ["좌자", "관은병", "관우"],
  태우등: ["태사자", "등애", "우금"],
  조제순: ["제갈량", "순욱", "조조"],
};

// 덱별 기본 병종 (SCOUT_DECK_GENERALS 순서와 같은 위치). 덱을 고르면 이 값으로 채운다.
const 기: TroopType = "기병";
const 방: TroopType = "방패병";
const 창: TroopType = "창병";
const 궁: TroopType = "궁병";
export const SCOUT_DECK_TROOPS: Record<S4DeckName, TroopType[]> = {
  남만: [기, 방, 방],
  제남만: [기, 방, 방],
  태비연: [창, 방, 방],
  태손육: [창, 방, 궁],
  쌍황육: [창, 방, 궁],
  조제이: [창, 방, 방],
  조순이: [창, 방, 궁],
  좌전여: [기, 방, 궁],
  조조사: [방, 방, 궁],
  조숭사: [방, 방, 방],
  돈숭술: [기, 방, 방],
  초숭술: [기, 방, 방],
  좌관관: [기, 기, 방],
  태우등: [창, 방, 궁],
  조제순: [방, 궁, 궁],
};

// 별칭 (key = 공백 제거한 표기)
// 티어덱 표의 "추격 남만"은 SP제갈량이 앞에 오는 배치라 제남만으로 본다.
const RAW_ALIASES: Record<string, S4DeckName> = {
  추격남만: "제남만",
  남만덱: "남만",
  조손육: "쌍황육",
};

function normalizeName(s: string): string {
  return s.replace(/\s+/g, "").trim();
}

// ---------------------------------------------------------------------------
// 장수 필터 태그
// ---------------------------------------------------------------------------
// 덱 드롭다운 필터(AND)와 정찰 목록 장수 필터(OR)에 함께 쓴다.
// 티어덱에서 덱을 구분하는 핵심 장수 위주.
export const KEY_GENERAL_TAGS = [
  "맹획",
  "sp 제갈량",
  "주태",
  "위연",
  "육손",
  "손권",
  "조조",
  "왕이",
  "사마의",
  "좌자",
  "여포",
  "황보숭",
  "원술",
  "관우",
  "태사자",
] as const;

export type KeyGeneralTag = (typeof KEY_GENERAL_TAGS)[number];

// 덱의 무장 구성이 주어진 태그 장수들을 모두 포함하는지 (순서 무관, AND)
export function deckHasGenerals(
  generals: string[],
  tags: readonly string[]
): boolean {
  if (tags.length === 0) return true;
  const set = new Set(generals.map(normalizeName));
  return tags.every((t) => set.has(normalizeName(t)));
}

// 이름(별칭 포함) → 표준 덱 이름 | null
export function resolveStandardDeck(name: string): S4DeckName | null {
  const key = normalizeName(name);
  if ((SCOUT_DECKS as readonly string[]).includes(key)) return key as S4DeckName;
  return RAW_ALIASES[key] ?? null;
}

// 무장 3명 구성 → 표준 덱 이름 | null
// 순서까지 같은 덱을 먼저 찾고(남만/제남만 구분), 없으면 순서 무관으로 찾는다.
export function resolveDeckByGenerals(generals: string[]): S4DeckName | null {
  const ordered = generals.map(normalizeName);
  const set = new Set(ordered);
  if (set.size !== 3) return null;
  for (const deck of SCOUT_DECKS) {
    const need = SCOUT_DECK_GENERALS[deck].map(normalizeName);
    if (need.every((g, i) => ordered[i] === g)) return deck;
  }
  for (const deck of SCOUT_DECKS) {
    if (SCOUT_DECK_GENERALS[deck].every((g) => set.has(normalizeName(g)))) {
      return deck;
    }
  }
  return null;
}

// 덱 정규 키 (S3와 같은 규칙: 표준 → std:, 커스텀 → 정렬된 무장, 그 외 → 이름)
export function deckCanonicalKey(input: {
  name: string;
  generals: string[];
}): string {
  const byGenerals = resolveDeckByGenerals(input.generals);
  if (byGenerals) return `std:${byGenerals}`;

  const byName = resolveStandardDeck(input.name);
  if (byName) return `std:${byName}`;

  const gens = input.generals.map(normalizeName).filter(Boolean);
  if (gens.length === 3) {
    return `gen:${[...gens].sort().join("|")}`;
  }
  return `name:${normalizeName(input.name)}`;
}

export function isSameDeckCanonical(
  a: { name: string; generals: string[] },
  b: { name: string; generals: string[] }
): boolean {
  return deckCanonicalKey(a) === deckCanonicalKey(b);
}

/**
 * 내 덱 vs 적 덱 상성 판정 (S4).
 *  - 같은 덱 → 미러
 *  - 두 덱 모두 상성표(s4/matchup.ts)에 있고 데이터가 있으면 → 상성표 판정
 *  - 그 외 수동 상성이 있으면 → 수동, 없으면 미확인
 */
export function judgeMatchup(
  myDeck: string,
  enemyDeck: string,
  manualVerdict?: Verdict
): VerdictOutcome {
  const myStd = resolveStandardDeck(myDeck);
  const enemyStd = resolveStandardDeck(enemyDeck);

  if (myStd && enemyStd && myStd === enemyStd) {
    return { verdict: "미러", source: "matrix", detail: `${myStd} 미러전` };
  }

  if (myStd && enemyStd) {
    const ri = (TEAMS as readonly string[]).indexOf(myStd);
    const ci = (TEAMS as readonly string[]).indexOf(enemyStd);
    if (ri !== -1 && ci !== -1) {
      const verdict = resultToVerdict(MATCHUP_MATRIX[ri][ci]);
      if (verdict) {
        return {
          verdict,
          source: "matrix",
          detail: `${myStd}(공) vs ${enemyStd}(방) = 승률 ${MATCHUP_RATES[ri][ci]}`,
        };
      }
    }
  }

  if (manualVerdict) {
    return { verdict: manualVerdict, source: "manual", detail: "직접 지정한 상성" };
  }

  return {
    verdict: "비등",
    source: "unknown",
    detail: "상성표에 데이터 없음 — 상성 정보 없음",
  };
}

// 상성표 결과 → 정찰 판정 ("부족"은 판정 불가 → null)
function resultToVerdict(result: MatchupResult): Verdict | null {
  switch (result) {
    case "완승":
    case "우세":
      return "카운터";
    case "비등":
      return "비등";
    case "열세":
    case "완패":
      return "회피";
    case "부족":
      return null;
  }
}
