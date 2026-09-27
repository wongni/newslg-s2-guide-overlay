// [배럴] 활성 시즌의 티어 값(JSON).
import { getActiveSeason } from "./season";
import s2Values from "./s2/tier-values.json";
import s3Values from "./s3/tier-values.json";

const TIER_VALUES_JSON = getActiveSeason() === "s2" ? s2Values : s3Values;
export default TIER_VALUES_JSON;
