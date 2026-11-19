// [배럴] 활성 시즌의 개척 가이드 스텝(JSON).
import { getActiveSeason } from "./season";
import s2Steps from "./s2/guide-steps.json";
import s3Steps from "./s3/guide-steps.json";
import s4Steps from "./s4/guide-steps.json";

const BY_SEASON = { s2: s2Steps, s3: s3Steps, s4: s4Steps };
const GUIDE_STEPS = BY_SEASON[getActiveSeason()];
export default GUIDE_STEPS;
