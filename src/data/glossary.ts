// [배럴] 활성 시즌의 용어 사전(JSON).
import { getActiveSeason } from "./season";
import s2Glossary from "./s2/glossary.json";
import s3Glossary from "./s3/glossary.json";

const GLOSSARY = getActiveSeason() === "s2" ? s2Glossary : s3Glossary;
export default GLOSSARY;
