// 보유 장수 데이터 + 조합(상성표 팀)별 필요 장수 매핑
//
// 세력 분류와 장수 목록은 cheonha-deck.xyz 의 보유 장수 선택 UI를 기준으로 하되,
// 상성표(9개 조합)에서 실제로 사용되는 장수는 모두 포함되도록 보강했습니다.
//
// 조합 → 필요 장수 매핑은 각 덱 상세 페이지의 "장수" 라인업을 확인해 정리했습니다.
// (예: 조감초 = 감부인/조운/초선, 태황유 = 주유/악진/주태)

import type { TeamName } from "./matchup";

export type Faction = "위" | "촉" | "오" | "군웅";

export const FACTIONS: Faction[] = ["위", "촉", "오", "군웅"];

// 세력별 장수 목록 (가나다순)
export const GENERALS_BY_FACTION: Record<Faction, string[]> = {
  위: [
    "가후",
    "견희",
    "곽가",
    "등애",
    "사마의",
    "서황",
    "순욱",
    "악진",
    "우금",
    "장료",
    "장합",
    "전위",
    "정욱",
    "조인",
    "조조",
    "하후돈",
    "하후연",
    "허저",
  ],
  촉: [
    "감부인",
    "관우",
    "관평",
    "마운록",
    "마초",
    "방통",
    "법정",
    "서서",
    "유비",
    "장비",
    "제갈량",
    "조운",
    "주창",
    "황월영",
    "황충",
  ],
  오: [
    "감녕",
    "노숙",
    "대교",
    "서성",
    "소교",
    "손견",
    "손권",
    "손상향",
    "손책",
    "여몽",
    "육손",
    "정보",
    "주유",
    "주태",
    "태사자",
    "황개",
  ],
  군웅: [
    "공손찬",
    "동탁",
    "문추",
    "방덕",
    "안량",
    "여포",
    "원소",
    "이유",
    "장각",
    "장량",
    "장보",
    "전풍",
    "진궁",
    "채문희",
    "초선",
    "추씨",
    "화웅",
    "화타",
  ],
};

// 전체 장수 이름 목록 (중복 없음)
export const ALL_GENERALS: string[] = FACTIONS.flatMap(
  (f) => GENERALS_BY_FACTION[f]
);

// 각 조합(상성표 팀)을 조립하기 위해 필요한 핵심 장수
// (cheonha-deck.xyz 각 덱 상세 페이지의 장수 라인업 기준)
export const TEAM_GENERALS: Record<TeamName, string[]> = {
  조감초: ["감부인", "조운", "초선"],
  여진악: ["여포", "진궁", "악진"],
  악순주: ["주유", "악진", "순욱"],
  태황유: ["주유", "악진", "주태"],
  태원마: ["원소", "주태", "마초"],
  쌍황육: ["조조", "손권", "육손"],
  손노육: ["손권", "노숙", "육손"],
  조순사: ["조조", "순욱", "사마의"],
  장서각도원: ["유비", "장비", "관우"],
};

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
