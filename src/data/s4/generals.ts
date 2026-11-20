// 시즌4 장수 데이터 + 상성표 조합별 필요 장수
//
// 장수 목록은 S4 정찰앱 덱(티어덱 docs/S4/티어덱1~3.png)에 나오는 무장 기준.
// 세력은 티어덱 카드의 진영 표기를 따른다.

import type { TeamName } from "./matchup";
export type { Faction, DeckPreset } from "../s3/generals";
import type { Faction } from "../s3/generals";

export const FACTIONS: Faction[] = ["위", "촉", "오", "군웅"];

export const GENERALS_BY_FACTION: Record<Faction, string[]> = {
  위: ["등애", "사마의", "순욱", "왕이", "우금", "조비", "조조", "하후돈"],
  촉: ["sp 제갈량", "관우", "관은병", "위연", "장비", "제갈량"],
  오: ["손권", "육손", "주태", "태사자"],
  군웅: ["맹획", "여포", "원술", "전풍", "좌자", "초선", "축융부인", "황보숭"],
};

export const ALL_GENERALS: string[] = Array.from(
  new Set(FACTIONS.flatMap((f) => GENERALS_BY_FACTION[f]))
);

// 상성표 조합별 장수 (정찰앱에 있는 덱은 정찰앱과 같은 순서)
export const TEAM_GENERALS: Record<TeamName, string[]> = {
  제남만: ["sp 제갈량", "맹획", "축융부인"],
  태비연: ["주태", "장비", "위연"],
  조조사: ["사마의", "조비", "조조"],
  좌전여: ["좌자", "전풍", "여포"],
  조제이: ["조조", "sp 제갈량", "왕이"],
  쌍황육: ["육손", "손권", "조조"],
  태손육: ["육손", "손권", "주태"],
  남만: ["축융부인", "맹획", "sp 제갈량"],
  조순이: ["조조", "순욱", "왕이"],
  조숭사: ["사마의", "조조", "황보숭"],
  돈숭술: ["황보숭", "하후돈", "원술"],
  초숭술: ["초선", "황보숭", "원술"],
  좌관관: ["좌자", "관은병", "관우"],
  태우등: ["태사자", "등애", "우금"],
  조제순: ["제갈량", "순욱", "조조"],
};

export function canBuildTeam(team: TeamName, owned: ReadonlySet<string>): boolean {
  return TEAM_GENERALS[team].every((g) => owned.has(g));
}

export function missingGenerals(team: TeamName, owned: ReadonlySet<string>): string[] {
  return TEAM_GENERALS[team].filter((g) => !owned.has(g));
}
