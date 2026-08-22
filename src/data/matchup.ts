// 조합 상성표 데이터
// 행 = 공격(attacker), 열 = 방어(defender)

export type MatchupResult = "완승" | "우세" | "비등" | "열세" | "완패";

export interface MatchupMeta {
  label: MatchupResult;
  hanja: string; // 勝 / 優 / 平 / 劣 / 敗
  score: number; // 상성 점수 (승률 계산용)
  // 배경색 / 텍스트색 (라이트/다크 공통, 셀 위 가독성 고려)
  bg: string;
  text: string;
}

export const MATCHUP_META: Record<MatchupResult, MatchupMeta> = {
  완승: { label: "완승", hanja: "勝", score: 2, bg: "#5b8def", text: "#0b1c3f" },
  우세: { label: "우세", hanja: "優", score: 1, bg: "#a9c9f5", text: "#1a3157" },
  비등: { label: "비등", hanja: "平", score: 0, bg: "#f5f0d8", text: "#5c5738" },
  열세: { label: "열세", hanja: "劣", score: -1, bg: "#f7c9a8", text: "#5c3418" },
  완패: { label: "완패", hanja: "敗", score: -2, bg: "#ef9a9a", text: "#5c1c1c" },
};

// 조합 목록 (매트릭스의 행/열 순서와 동일)
export const TEAMS = [
  "조감초",
  "여진악",
  "악순주",
  "태황유",
  "태원마",
  "쌍황육",
  "손노육",
  "조순사",
  "유관장",
] as const;

export type TeamName = (typeof TEAMS)[number];

// 상성표 조합명 → cheonha-deck.xyz 덱 slug 매핑
// (URL: https://cheonha-deck.xyz/decks/{slug})
// null = 대응되는 덱 페이지가 없음 (링크 비활성화)
export const DECK_SLUG: Record<TeamName, string | null> = {
  조감초: "조감초",
  여진악: "여진악",
  악순주: "주순악",
  태황유: "태황어",
  태원마: "마원주",
  쌍황육: "쌍황륙",
  손노육: "손로륙",
  조순사: "조순사",
  유관장: "도원결의-낭만덱",
};

export const DECK_BASE_URL = "https://cheonha-deck.xyz/decks";

export function deckUrl(team: TeamName): string | null {
  const slug = DECK_SLUG[team];
  return slug ? `${DECK_BASE_URL}/${encodeURIComponent(slug)}` : null;
}

// matrix[공격][방어]
export const MATCHUP_MATRIX: MatchupResult[][] = [
  // 조감초
  ["비등", "완승", "우세", "우세", "완승", "완패", "완패", "완패", "우세"],
  // 여진악
  ["완패", "비등", "우세", "비등", "비등", "우세", "우세", "비등", "우세"],
  // 악순주
  ["열세", "열세", "비등", "완승", "완승", "열세", "열세", "열세", "우세"],
  // 태황유
  ["열세", "비등", "완패", "비등", "우세", "비등", "비등", "열세", "우세"],
  // 태원마
  ["완패", "비등", "완패", "열세", "비등", "우세", "우세", "완승", "우세"],
  // 쌍황육
  ["완승", "열세", "우세", "비등", "열세", "비등", "우세", "우세", "완패"],
  // 손노육
  ["완승", "열세", "우세", "비등", "열세", "열세", "비등", "우세", "완패"],
  // 조순사
  ["완승", "비등", "우세", "우세", "완패", "열세", "열세", "비등", "완패"],
  // 유관장
  ["열세", "열세", "열세", "열세", "열세", "완승", "완승", "완승", "비등"],
];
