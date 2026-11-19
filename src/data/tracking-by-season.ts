// 시즌별 개척 트래킹 데이터.
// 공통(tracking-common.json)과 돌파별 행(tracking.json / tracking-high.json)을 병합한다.
// 시즌을 인자로 받으므로 클라이언트에서 선택된 시즌에 맞춰 고를 수 있다. (S2 는 트래킹 데이터가 없어 S3 사용)
import { TrackingCommon, TrackingData, TrackingRowsFile } from "@/types/tracking";
import type { SeasonId } from "./season";
import s3Common from "./s3/tracking-common.json";
import s3Low from "./s3/tracking.json";
import s3High from "./s3/tracking-high.json";
import s4Common from "./s4/tracking-common.json";
import s4Low from "./s4/tracking.json";
import s4High from "./s4/tracking-high.json";

export type TrackingTier = "low" | "high";

const S3_COMMON = s3Common as TrackingCommon;
const S4_COMMON = s4Common as TrackingCommon;

function merge(common: TrackingCommon, rows: unknown): TrackingData {
  return { ...common, ...(rows as TrackingRowsFile) };
}

const DATA: Record<"s3" | "s4", Record<TrackingTier, TrackingData>> = {
  s3: {
    low: merge(S3_COMMON, s3Low),
    high: merge(S3_COMMON, s3High),
  },
  s4: {
    // 토지 레벨별 경험치·누적 경험치 표는 S3와 같은 시나리오 수비대라 그대로 재사용
    low: merge({ landExp: S3_COMMON.landExp, cumulativeExp: S3_COMMON.cumulativeExp, ...S4_COMMON }, s4Low),
    high: merge({ landExp: S3_COMMON.landExp, cumulativeExp: S3_COMMON.cumulativeExp, ...S4_COMMON }, s4High),
  },
};

function trackingSeason(season: SeasonId): "s3" | "s4" {
  return season === "s4" ? "s4" : "s3";
}

export function getTrackingData(season: SeasonId, tier: TrackingTier): TrackingData {
  return DATA[trackingSeason(season)][tier];
}

/** 진행 체크 저장 키. S3 는 기존 키를 그대로 써서 저장된 진행 상황을 유지한다. */
export function getTrackingStorageKey(season: SeasonId, tier: TrackingTier): string {
  const s = trackingSeason(season);
  if (s === "s3") {
    return tier === "high" ? "s3-pioneer-tracking-high-progress" : "s3-pioneer-tracking-progress";
  }
  return tier === "high" ? "s4-pioneer-tracking-high-progress" : "s4-pioneer-tracking-progress";
}
