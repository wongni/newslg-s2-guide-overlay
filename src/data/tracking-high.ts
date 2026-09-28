// [배럴] 고돌파 개척 트래킹 데이터.
// 공통(tracking-common.json)과 고돌파 고유(s3/tracking-high.json)를 병합.
import { TrackingCommon, TrackingData, TrackingRowsFile } from "@/types/tracking";
import common from "./s3/tracking-common.json";
import rows from "./s3/tracking-high.json";

const c = common as TrackingCommon;
const r = rows as TrackingRowsFile;

const TRACKING_DATA_HIGH: TrackingData = { ...c, ...r };
export default TRACKING_DATA_HIGH;
