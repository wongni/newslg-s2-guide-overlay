// 시즌 정의 및 활성 시즌 리졸버
//
// 시즌별 데이터는 src/data/s2, src/data/s3 에 각각 존재한다.
// 기존 코드(@/data/matchup 등)는 이 파일이 결정한 "활성 시즌"의 데이터를
// re-export 하는 배럴을 통해 접근하므로, import 경로를 바꾸지 않아도 된다.
//
// 활성 시즌은 다음 우선순위로 결정된다.
//  1) (클라이언트) localStorage["activeSeason"]
//  2) 환경변수 NEXT_PUBLIC_DEFAULT_SEASON
//  3) DEFAULT_SEASON 상수
//
// 시즌을 바꾸면 정적 import 데이터를 다시 로드하기 위해 페이지를 새로고침한다.

export type SeasonId = "s2" | "s3";

export interface SeasonMeta {
  id: SeasonId;
  code: string; // 표시용 짧은 코드 (예: "S2")
  name: string; // 부제/시즌명
  description: string;
}

export const SEASONS: SeasonMeta[] = [
  {
    id: "s3",
    code: "S3",
    name: "업주산하",
    description: "삼국지 천하결전 시즌3 (업주산하) — 최신 시즌",
  },
  {
    id: "s2",
    code: "S2",
    name: "이전 시즌",
    description: "삼국지 천하결전 시즌2 — 이전 시즌 데이터",
  },
];

export const DEFAULT_SEASON: SeasonId =
  (process.env.NEXT_PUBLIC_DEFAULT_SEASON as SeasonId) || "s3";

export const SEASON_STORAGE_KEY = "activeSeason";

function isSeasonId(v: unknown): v is SeasonId {
  return v === "s2" || v === "s3";
}

/**
 * 활성 시즌을 반환한다.
 * - 서버(SSR)에서는 항상 DEFAULT_SEASON.
 * - 클라이언트에서는 localStorage 값을 우선한다.
 *
 * 모듈 로드 시점(정적 데이터 배럴)에서 호출되므로, 이 값은
 * "현재 페이지 로드 기준"의 시즌이다. 시즌 변경 후에는 새로고침이 필요하다.
 */
export function getActiveSeason(): SeasonId {
  if (typeof window !== "undefined") {
    try {
      const v = window.localStorage.getItem(SEASON_STORAGE_KEY);
      if (isSeasonId(v)) return v;
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) → 기본값
    }
  }
  return DEFAULT_SEASON;
}

/**
 * 활성 시즌을 저장한다. (실제 데이터 반영은 새로고침 시)
 */
export function setActiveSeason(id: SeasonId): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SEASON_STORAGE_KEY, id);
    } catch {
      // 무시
    }
  }
}

export function getSeasonMeta(id: SeasonId): SeasonMeta {
  return SEASONS.find((s) => s.id === id) ?? SEASONS[0];
}
