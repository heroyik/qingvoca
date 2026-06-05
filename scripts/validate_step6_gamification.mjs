import { readFile } from "node:fs/promises";

const gamificationSource = await readFile("src/utils/gamification.ts", "utf8");
const expectedKeys = [
  ["locale", "LOCALE_STORAGE_KEY"],
  ["progress", "qingvoca:zh:progress"],
  ["review", "qingvoca:zh:review"],
  ["score", "qingvoca:zh:score"],
  ["rank", "qingvoca:zh:rank"],
];

const errors = [];

for (const [name, marker] of expectedKeys) {
  if (!gamificationSource.includes(marker)) errors.push(`missing storage key ${name}:${marker}`);
}

for (const required of ['DATASET_LANGUAGE = "zh"', 'DATASET_VERSION = "zh-HSK4-v1"', "CHINESE_DATASET_LEVEL"]) {
  if (!gamificationSource.includes(required)) errors.push(`missing dataset marker ${required}`);
}

for (const requiredType of ["ProgressState", "ReviewQueueState", "ScoreState", "LeaderboardDocument"]) {
  if (!gamificationSource.includes(requiredType)) errors.push(`missing type ${requiredType}`);
}

for (const requiredFunction of [
  "createInitialProgressState",
  "createInitialReviewQueueState",
  "createInitialScoreState",
  "createLeaderboardDocument",
  "isChineseLeaderboardDocument",
  "getCompletedWordCount",
  "addReviewWord",
  "removeReviewWord",
]) {
  if (!gamificationSource.includes(requiredFunction)) errors.push(`missing function ${requiredFunction}`);
}

const localeIndex = gamificationSource.indexOf("qingvoca:zh:locale");
const progressIndex = gamificationSource.indexOf("qingvoca:zh:progress");
const reviewIndex = gamificationSource.indexOf("qingvoca:zh:review");

if (localeIndex === progressIndex || localeIndex === reviewIndex) {
  errors.push("locale storage key must be distinct from progress and review keys");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step6] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step6] validation complete");
  console.log(`[step6] storage keys: ${expectedKeys.map(([name, marker]) => `${name}:${marker}`).join(", ")}`);
  console.log("[step6] leaderboard namespace: language=zh, hsk=HSK4, datasetVersion=zh-HSK4-v1");
  console.log("[step6] locale is separated from progress and review state");
}
