// [배럴] 저돌파 개척 트래킹 데이터.
// 공통(tracking-common.json)과 저돌파 고유(s3/tracking.json)를 병합.
import { TrackingCommon, TrackingData, TrackingRowsFile } from "@/types/tracking";
import common from "./s3/tracking-common.json";
import rows from "./s3/tracking.json";

const c = common as TrackingCommon;
const r = rows as TrackingRowsFile;

const TRACKING_DATA: TrackingData = { ...c, ...r };
export default TRACKING_DATA;
