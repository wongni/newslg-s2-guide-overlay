// [배럴] 활성 시즌의 티어 값(JSON).
import { getActiveSeason } from "./season";
import s2Values from "./s2/tier-values.json";
import s3Values from "./s3/tier-values.json";
import s4Values from "./s4/tier-values.json";

const BY_SEASON = { s2: s2Values, s3: s3Values, s4: s4Values };
const TIER_VALUES_JSON = BY_SEASON[getActiveSeason()];
export default TIER_VALUES_JSON;
