// [배럴] 활성 시즌의 공통 값(JSON).
import { getActiveSeason } from "./season";
import s2Common from "./s2/common-values.json";
import s3Common from "./s3/common-values.json";

const COMMON_VALUES_JSON = getActiveSeason() === "s2" ? s2Common : s3Common;
export default COMMON_VALUES_JSON;
