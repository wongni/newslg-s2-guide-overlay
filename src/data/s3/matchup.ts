// 시즌3 (업주산하) 조합 상성표 데이터
// 행 = 공격(attacker), 열 = 방어(defender)
//
// 출처: "S(업주산하) 주류 덱 상성표" 이미지 (삼국지 천하결전 정보 시트)
//  - 표기: 승(勝) / 우세(優) / 반반(平) / 열세(劣) / 패(敗)
//  - 본 프로젝트 표준 표기로 매핑: 승→완승, 우세→우세, 반반→비등, 열세→열세, 패→완패

export type MatchupResult = "완승" | "우세" | "비등" | "열세" | "완패";

export interface MatchupMeta {
  label: MatchupResult;
  hanja: string; // 勝 / 優 / 平 / 劣 / 敗
  score: number; // 상성 점수 (승률 계산용)
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

// 조합 목록 (상성표의 행/열 순서와 동일)
//  월량마 / 안공신화 / 원손육 / 추격체계 / 인왕창 / 좌공관 / 조감강 / 대한방패 / 조순이
export const TEAMS = [
  "월량마",
  "안공신화",
  "원손육",
  "추격체계",
  "인왕창",
  "좌공관",
  "조감강",
  "대한방패",
  "조순이",
] as const;

export type TeamName = (typeof TEAMS)[number];

// 상성표/화면에 보이는 표시용 라벨.
// 내부 키(TeamName)는 상성 로직·별칭·다른 페이지에서 그대로 쓰이므로 바꾸지 않고,
// 게임 내 전법 목록 표기(스샷 기준)에 맞춘 표시 이름만 여기서 매핑한다.
export const TEAM_DISPLAY: Record<TeamName, string> = {
  월량마: "월량마",
  안공신화: "안공 신화창",
  원손육: "원손육",
  추격체계: "추격체계",
  인왕창: "인왕창",
  좌공관: "좌공관",
  조감강: "조감강",
  대한방패: "준숭술",
  조순이: "조순이",
};

// 상성표 조합명 → cheonha-deck.xyz 덱 slug 매핑
// (시즌3 덱 페이지 slug는 미확인 → 모두 null로 두어 링크 비활성화)
export const DECK_SLUG: Record<TeamName, string | null> = {
  월량마: null,
  안공신화: null,
  원손육: null,
  추격체계: null,
  인왕창: null,
  좌공관: null,
  조감강: null,
  대한방패: null,
  조순이: null,
};

export const DECK_BASE_URL = "https://cheonha-deck.xyz/decks";

export function deckUrl(team: TeamName): string | null {
  const slug = DECK_SLUG[team];
  return slug ? `${DECK_BASE_URL}/${encodeURIComponent(slug)}` : null;
}

// matrix[공격][방어]
// (이미지에서 읽은 값: 승=완승, 우세=우세, 반반=비등, 열세=열세, 패=완패)
export const MATCHUP_MATRIX: MatchupResult[][] = [
  // 공격: 월량마
  ["비등", "우세", "우세", "열세", "열세", "우세", "열세", "열세", "우세"],
  // 공격: 안공신화
  ["열세", "비등", "비등", "열세", "비등", "열세", "우세", "완승", "열세"],
  // 공격: 원손육
  ["열세", "비등", "비등", "열세", "완승", "열세", "완승", "완승", "열세"],
  // 공격: 추격체계
  ["우세", "우세", "우세", "비등", "완패", "우세", "열세", "열세", "우세"],
  // 공격: 인왕창
  ["우세", "비등", "완패", "완승", "비등", "열세", "우세", "완패", "우세"],
  // 공격: 좌공관
  ["열세", "우세", "우세", "열세", "우세", "비등", "우세", "열세", "열세"],
  // 공격: 조감강
  ["우세", "열세", "열세", "우세", "열세", "열세", "비등", "열세", "열세"],
  // 공격: 대한방패
  ["우세", "완패", "완패", "우세", "완승", "우세", "우세", "비등", "완패"],
  // 공격: 조순이
  ["열세", "우세", "우세", "열세", "열세", "우세", "우세", "완승", "비등"],
];
