// [배럴] 활성 시즌의 개척 가이드 스텝(JSON).
import { getActiveSeason } from "./season";
import s2Steps from "./s2/guide-steps.json";
import s3Steps from "./s3/guide-steps.json";

const GUIDE_STEPS = getActiveSeason() === "s2" ? s2Steps : s3Steps;
export default GUIDE_STEPS;
