// 적 정찰(scout)용 덱 판정 로직
//
// 핵심 아이디어:
//  - 내 덱과 적 덱이 모두 "표준 9개 덱"(matchup.ts)이면 → MATCHUP_MATRIX로 자동 판정
//  - 적 덱이 표준에 없는 "커스텀 덱"이면 → 등록 시 사용자가 상성을 직접 지정
//
// 게임 화면에 보이는 적 덱 이름 표기가 상성표 표기와 다를 수 있으므로
// 별칭(alias) 테이블로 흡수한다. (예: "사조순" → "조순사", "원소마초덱" → "태원마")

import {
  TEAMS,
  MATCHUP_MATRIX,
  MATCHUP_META,
  type TeamName,
  type MatchupResult,
} from "./matchup";
import { TEAM_GENERALS } from "./generals";

// 정찰 화면에서 사용하는 4단계 상성 판정
//  - 카운터: 내가 유리 (완승/우세)  → 적극 공격
//  - 미러:   같은 덱 (동일 구성)     → 실력·강화 싸움
//  - 비등:   호각 (비등)             → 신중
//  - 회피:   내가 불리 (열세/완패)   → 전투 회피 권장
export type Verdict = "카운터" | "미러" | "비등" | "회피";

// 적 플레이어가 가질 수 있는 최대 군(부대) 수
export const ARMY_COUNT = 5;

export interface VerdictMeta {
  label: Verdict;
  emoji: string;
  bg: string;
  text: string;
  advice: string;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  카운터: {
    label: "카운터",
    emoji: "⚔️",
    bg: "#5b8def",
    text: "#0b1c3f",
    advice: "유리한 상성. 적극 교전 가능.",
  },
  미러: {
    label: "미러",
    emoji: "🪞",
    bg: "#d8c9f5",
    text: "#3a2857",
    advice: "동일 덱. 강화 단계·조작 싸움.",
  },
  비등: {
    label: "비등",
    emoji: "⚖️",
    bg: "#f5f0d8",
    text: "#5c5738",
    advice: "호각. 상황·지형·강화 고려해 판단.",
  },
  회피: {
    label: "회피",
    emoji: "🛑",
    bg: "#ef9a9a",
    text: "#5c1c1c",
    advice: "불리한 상성. 가급적 교전 회피.",
  },
};

// 표준 덱 상성(MatchupResult) → 정찰 판정(Verdict) 변환
function resultToVerdict(result: MatchupResult): Verdict {
  switch (result) {
    case "완승":
    case "우세":
      return "카운터";
    case "비등":
      return "비등";
    case "열세":
    case "완패":
      return "회피";
  }
}

// 적 강화 단계 (표시 전용 — 판정에는 영향 없음)
export const REINFORCEMENTS = ["명함", "저돌파", "중돌파", "고돌파"] as const;
export type Reinforcement = (typeof REINFORCEMENTS)[number];

// 강화 단계별 상대적 세기 (내 단계와 비교해 "더 강함" 경고 표시용)
export const REINFORCEMENT_RANK: Record<Reinforcement, number> = {
  명함: 0,
  저돌파: 1,
  중돌파: 2,
  고돌파: 3,
};

// ---------------------------------------------------------------------------
// 병종 (표시/추측 전용 — 덱 상성 판정에는 반영하지 않음)
// ---------------------------------------------------------------------------
// 순환 상성: 방패병 > 궁병 > 창병 > 기병 > 방패병
export const TROOP_TYPES = ["방패병", "창병", "궁병", "기병"] as const;
export type TroopType = (typeof TROOP_TYPES)[number];

// 인게임에서 보이는 부대 아이콘(모양) 힌트
export const TROOP_META: Record<TroopType, { emoji: string; shape: string }> = {
  방패병: { emoji: "🛡️", shape: "방패" },
  창병: { emoji: "🔱", shape: "창" },
  궁병: { emoji: "🏹", shape: "활" },
  기병: { emoji: "🐎", shape: "말" },
};

// 순환 상성: key가 value를 이긴다 (한 단계 우위).
// 방 > 궁 > 창 > 기 > 방
const TROOP_BEATS: Record<TroopType, TroopType> = {
  방패병: "궁병",
  궁병: "창병",
  창병: "기병",
  기병: "방패병",
};

export type TroopAdvantage = "우위" | "불리" | "동일";

// 내 병종이 적 병종에 대해 우위/불리/동일인지
export function troopAdvantage(mine: TroopType, enemy: TroopType): TroopAdvantage {
  if (mine === enemy) return "동일";
  if (TROOP_BEATS[mine] === enemy) return "우위";
  if (TROOP_BEATS[enemy] === mine) return "불리";
  // 순환상 인접하지 않은 경우는 없음(4종 순환)이지만 안전망
  return "동일";
}

// ---------------------------------------------------------------------------
// 표준 덱 별칭 테이블
// ---------------------------------------------------------------------------
// key = 정규화된 별칭(공백 제거), value = 표준 TeamName
// 게임/커뮤니티에서 쓰는 다양한 표기를 표준 9개 덱으로 흡수한다.
const RAW_ALIASES: Record<string, TeamName> = {
  // 조감초 (감부인/조운/초선)
  조감초: "조감초",
  조운감부인: "조감초",
  조운감부인덱: "조감초",
  감초조: "조감초",
  // 여진악 (여포/진궁/악진)
  여진악: "여진악",
  // 악순주 (주유/악진/순욱)
  악순주: "악순주",
  주순악: "악순주",
  // 태황유 (주유/악진/주태)
  태황유: "태황유",
  태황어: "태황유",
  // 태원마 (원소/주태/마초)
  태원마: "태원마",
  마원주: "태원마",
  원소마초: "태원마",
  원소마초덱: "태원마",
  // 쌍황육 (조조/손권/육손)
  쌍황육: "쌍황육",
  쌍황륙: "쌍황육",
  조손육: "쌍황육",
  조손륙: "쌍황육",
  // 손노육 (손권/노숙/육손)
  손노육: "손노육",
  손로륙: "손노육",
  // 조순사 (조조/순욱/사마의)
  조순사: "조순사",
  사조순: "조순사",
  사마의덱: "조순사",
  // 유관장 (유비/관우/장비)
  유관장: "유관장",
  장서각도원: "유관장",
  도원방: "유관장",
  도원결의: "유관장",
};

function normalizeName(s: string): string {
  return s.replace(/\s+/g, "").trim();
}

// 이름(별칭 포함) → 표준 TeamName | null
export function resolveStandardDeck(name: string): TeamName | null {
  const key = normalizeName(name);
  if ((TEAMS as readonly string[]).includes(key)) return key as TeamName;
  return RAW_ALIASES[key] ?? null;
}

// 무장 3명 구성 → 표준 TeamName | null (순서 무관)
export function resolveDeckByGenerals(generals: string[]): TeamName | null {
  const set = new Set(generals.map(normalizeName));
  if (set.size !== 3) return null;
  for (const team of TEAMS) {
    const need = TEAM_GENERALS[team];
    if (need.length === 3 && need.every((g) => set.has(normalizeName(g)))) {
      return team;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 덱 정규 키 (순서·별칭·표기 흔들림 흡수용 dedup 키)
// ---------------------------------------------------------------------------
// 같은 덱인지 판정할 때 이 키가 같으면 동일 덱으로 취급한다.
//  1) 무장 3명 구성이 표준 덱이면 → "std:<표준명>" (순서 무관)
//  2) 이름이 표준 별칭으로 해석되면 → "std:<표준명>"
//  3) 그 외 커스텀이면 → 무장 이름을 정규화·정렬한 "gen:a|b|c"
//     (무장이 3명이 아니면 이름 기반 "name:<정규화이름>")
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

// 두 덱이 같은 덱인지 (순서·별칭 무관)
export function isSameDeckCanonical(
  a: { name: string; generals: string[] },
  b: { name: string; generals: string[] }
): boolean {
  return deckCanonicalKey(a) === deckCanonicalKey(b);
}

// ---------------------------------------------------------------------------
// 판정 결과
// ---------------------------------------------------------------------------
export interface VerdictOutcome {
  verdict: Verdict;
  source: "matrix" | "manual" | "unknown";
  detail: string; // 판정 근거 설명
}

/**
 * 내 덱 vs 적 덱 상성 판정.
 *
 * @param myDeck       내 덱 이름 (표준 덱 이름/별칭)
 * @param enemyDeck    적 덱 이름 (표준 덱 이름/별칭 또는 커스텀)
 * @param manualVerdict 커스텀 적 덱에 대해 사용자가 지정한 상성 (있으면 우선)
 */
export function judgeMatchup(
  myDeck: string,
  enemyDeck: string,
  manualVerdict?: Verdict
): VerdictOutcome {
  const myStd = resolveStandardDeck(myDeck);
  const enemyStd = resolveStandardDeck(enemyDeck);

  // 같은 덱이면 미러 (표준끼리 완전히 동일할 때)
  if (myStd && enemyStd && myStd === enemyStd) {
    return {
      verdict: "미러",
      source: "matrix",
      detail: `${myStd} 미러전`,
    };
  }

  // 둘 다 표준 덱 → 매트릭스 자동 판정 (내 덱=공격 행, 적 덱=방어 열)
  if (myStd && enemyStd) {
    const ri = TEAMS.indexOf(myStd);
    const ci = TEAMS.indexOf(enemyStd);
    const result = MATCHUP_MATRIX[ri][ci];
    return {
      verdict: resultToVerdict(result),
      source: "matrix",
      detail: `${myStd}(공) vs ${enemyStd}(방) = ${MATCHUP_META[result].label}`,
    };
  }

  // 적 덱이 커스텀 → 사용자가 지정한 수동 상성 사용
  if (manualVerdict) {
    return {
      verdict: manualVerdict,
      source: "manual",
      detail: "직접 지정한 상성",
    };
  }

  // 판정 불가 (커스텀인데 수동 상성도 없음)
  return {
    verdict: "비등",
    source: "unknown",
    detail: "미확인 덱 — 상성 정보 없음",
  };
}
