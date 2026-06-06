import { readFile } from "node:fs/promises";

const contextFile = await readFile("src/contexts/GamificationContext.tsx", "utf8");
const hookFile = await readFile("src/hooks/useGamification.ts", "utf8");
const layoutFile = await readFile("src/app/layout.tsx", "utf8");
const homeFile = await readFile("src/app/page.tsx", "utf8");
const quizFile = await readFile("src/components/Quiz.tsx", "utf8");
const reviewTabFile = await readFile("src/components/ReviewTab.tsx", "utf8");
const reviewLoaderFile = await readFile("src/components/ReviewQuizLoader.tsx", "utf8");
const errors = [];

for (const [fileName, content, markers] of [
  [
    "GamificationContext.tsx",
    contextFile,
    ["qingvoca:zh:progress", "localStorage", "completeUnit", "recordMistake", "clearAllMistakes", "adminEditEnabled"],
  ],
  ["useGamification.ts", hookFile, ["useGamification"]],
  ["layout.tsx", layoutFile, ["GamificationProvider"]],
  ["page.tsx", homeFile, ["useGamification", "stats.completedUnits", "ReviewTab", "unlockAllLevels", "adminEditEnabled"]],
  ["Quiz.tsx", quizFile, ["useGamification", "recordMistake", "completeUnit", "addXP", "addGem", "speechEnabled", "soundEffectsEnabled", "hapticsEnabled", "navigator.vibrate"]],
  ["ReviewTab.tsx", reviewTabFile, ["useGamification", "stats.mistakes", "removeMistake", "clearAllMistakes", "zhGlobalMistakes", "getDocsFromCache"]],
  ["ReviewQuizLoader.tsx", reviewLoaderFile, ["useGamification", "getReviewWordsByIds", "stats.mistakes"]],
  ["quiz.ts", await readFile("src/utils/quiz.ts", "utf8"), ["entryByWordKey", "normalizeVocabWordKey(id)"]],
  ["GamificationContext.tsx", contextFile, ["keys.add(entry.id)", "keys.add(normalizeVocabWordKey(entry.word))"]],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

if (reviewLoaderFile.includes("slice(0, 20)")) {
  errors.push("ReviewQuizLoader.tsx still uses the temporary review word slice");
}

const blockedTerms = ["Cog" + "nite", "cog" + "nate", "cog" + "nates"];
for (const [fileName, content] of [
  ["GamificationContext.tsx", contextFile],
  ["useGamification.ts", hookFile],
  ["page.tsx", homeFile],
  ["Quiz.tsx", quizFile],
  ["ReviewTab.tsx", reviewTabFile],
  ["ReviewQuizLoader.tsx", reviewLoaderFile],
]) {
  for (const blocked of blockedTerms) {
    if (content.toLowerCase().includes(blocked.toLowerCase())) {
      errors.push(`${fileName} has removed-feature residue: ${blocked}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step5] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step5] validation complete");
  console.log("[frontend-step5] local progress, quiz rewards, and review queue are connected");
}
