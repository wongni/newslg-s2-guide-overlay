// [배럴] 활성 시즌의 공통 값(JSON).
import { getActiveSeason } from "./season";
import s2Common from "./s2/common-values.json";
import s3Common from "./s3/common-values.json";
import s4Common from "./s4/common-values.json";

const BY_SEASON = { s2: s2Common, s3: s3Common, s4: s4Common };
const COMMON_VALUES_JSON = BY_SEASON[getActiveSeason()];
export default COMMON_VALUES_JSON;
