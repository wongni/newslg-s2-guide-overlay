// 시즌3 (업주산하) 보유 장수 데이터 + 조합(상성표 팀)별 필요 장수 매핑
//
// 세력 분류와 장수 목록은 시즌3(업주산하) 티어덱/공존덱/도감에 등장하는 무장을 기준으로 정리했습니다.
// 조합(9개 상성 덱) → 필요 장수 매핑은 티어덱/공존덱 상세 라인업을 참조했습니다.

import type { TeamName } from "./matchup";

export type Faction = "위" | "촉" | "오" | "군웅";

export const FACTIONS: Faction[] = ["위", "촉", "오", "군웅"];

// 세력별 장수 목록 (가나다순)
// 주의: "연의 XXX"(연의 원소/공손찬/관우/장료/조인/감녕 등)는 별도 무장으로 취급합니다.
export const GENERALS_BY_FACTION: Record<Faction, string[]> = {
  위: [
    "가후",
    "등애",
    "사마의",
    "서황",
    "순욱",
    "악진",
    "왕이",
    "우금",
    "장료",
    "장춘화",
    "전위",
    "조비",
    "조조",
    "하후돈",
    "하후연",
    "황보숭",
  ],
  촉: [
    "강유",
    "관우",
    "관은병",
    "마운록",
    "마초",
    "sp 제갈량",
    "유비",
    "장비",
    "제갈량",
    "조운",
    "황월영",
  ],
  오: [
    "감녕",
    "노숙",
    "대교",
    "서성",
    "소교",
    "손권",
    "육손",
    "장소",
    "주태",
  ],
  군웅: [
    "감부인",
    "관은병",
    "마등",
    "보연사",
    "순유",
    "연의 감녕",
    "연의 공손찬",
    "연의 관우",
    "연의 원소",
    "연의 장료",
    "연의 조인",
    "왕이",
    "우길",
    "원소",
    "원술",
    "장녕",
    "장각",
    "전풍",
    "조순",
    "좌자",
    "주준",
    "채문희",
    "초선",
  ],
};

// 전체 장수 이름 목록 (중복 제거)
export const ALL_GENERALS: string[] = Array.from(
  new Set(FACTIONS.flatMap((f) => GENERALS_BY_FACTION[f]))
);

// 각 조합(상성표 9개 팀)을 조립하기 위해 필요한 핵심 장수
// (시즌3 티어덱/공존덱 상세 라인업 기준)
export const TEAM_GENERALS: Record<TeamName, string[]> = {
  월량마: ["마초", "sp 제갈량", "악진"],
  안공신화: ["강유", "유비", "sp 제갈량"],
  원손육: ["연의 원소", "손권", "육손"],
  추격체계: ["마운록", "연의 공손찬", "마등"],
  인왕창: ["조조", "전위", "연의 조인"],
  좌공관: ["좌자", "연의 공손찬", "연의 관우"],
  조감강: ["감부인", "조운", "강유"],
  대한방패: ["원술", "황보숭", "주준"],
  조순이: ["조조", "순욱", "왕이"],
};

// ---------------------------------------------------------------------------
// 전법(덱) 프리셋 — 게임 내 "전법 목록" 화면 표기 기준
// ---------------------------------------------------------------------------
// 게임 화면에는 표준 상성표 이름과 다른 별칭으로 전법이 표기되기도 하고,
// 장수도 표시명(예: "원소"=연의 원소, "조인"=연의 조인)으로 나온다.
// 여기서는 화면에 보이는 그대로의 이름/장수를 보존하되, 상성 판정을 위해
// 표준 덱(TeamName)에 연결한다. (displayGenerals = 화면 표기, team = 표준 덱)
export interface DeckPreset {
  name: string; // 게임 화면에 보이는 전법 이름
  team: TeamName; // 대응하는 표준 상성 덱
  displayGenerals: string[]; // 화면에 보이는 장수 표기 그대로
  category?: string; // 상위 분류 헤더 (예: "추격계열")
}

// 출처: 게임 내 전법 목록 화면 캡처 (시즌3 업주산하)
export const DECK_PRESETS: DeckPreset[] = [
  { name: "월량마", team: "월량마", displayGenerals: ["마초", "SP 제갈량", "악진"] },
  { name: "안공 신화창", team: "안공신화", displayGenerals: ["강유", "유비", "SP 제갈량"] },
  { name: "원손육", team: "원손육", displayGenerals: ["원소", "손권", "육손"] },
  { name: "인왕창", team: "인왕창", displayGenerals: ["조조", "전위", "조인"], category: "추격계열" },
  { name: "좌공관", team: "좌공관", displayGenerals: ["좌자", "공손찬", "관우"], category: "추격계열" },
  { name: "조감강", team: "조감강", displayGenerals: ["조운", "감부인", "강유"], category: "추격계열" },
  { name: "준숭술", team: "대한방패", displayGenerals: ["주준", "황보숭", "원술"], category: "추격계열" },
  { name: "조순이", team: "조순이", displayGenerals: ["조조", "순욱", "왕이"], category: "추격계열" },
];

// 보유 장수 집합으로 특정 조합을 조립 가능한지 판정
export function canBuildTeam(
  team: TeamName,
  owned: ReadonlySet<string>
): boolean {
  const need = TEAM_GENERALS[team];
  return need.every((g) => owned.has(g));
}

// 조합 조립에 부족한 장수 목록 반환
export function missingGenerals(
  team: TeamName,
  owned: ReadonlySet<string>
): string[] {
  return TEAM_GENERALS[team].filter((g) => !owned.has(g));
}
