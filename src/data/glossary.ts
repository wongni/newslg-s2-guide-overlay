// [배럴] 활성 시즌의 용어 사전(JSON).
import { getActiveSeason } from "./season";
import s2Glossary from "./s2/glossary.json";
import s3Glossary from "./s3/glossary.json";
import s4Glossary from "./s4/glossary.json";

const BY_SEASON = { s2: s2Glossary, s3: s3Glossary, s4: s4Glossary };
const GLOSSARY = BY_SEASON[getActiveSeason()];
export default GLOSSARY;
