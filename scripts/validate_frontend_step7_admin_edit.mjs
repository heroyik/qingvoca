import { readFile } from "node:fs/promises";

const contextFile = await readFile("src/contexts/GamificationContext.tsx", "utf8");
const hookFile = await readFile("src/hooks/useGamification.ts", "utf8");
const pageFile = await readFile("src/app/page.tsx", "utf8");
const componentFile = await readFile("src/components/AdminEditTab.tsx", "utf8");
const adminUtilFile = await readFile("src/utils/adminEdit.ts", "utf8");
const packageFile = await readFile("package.json", "utf8");
const errors = [];

for (const [fileName, content, markers] of [
  [
    "GamificationContext.tsx",
    contextFile,
    [
      "adminVocabOverrides",
      "adminDeletedWords",
      "saveVocabOverride",
      "clearVocabOverride",
      "deleteWordsGlobally",
      "applyAdminEdit",
    ],
  ],
  ["useGamification.ts", hookFile, ["VocabOverridePatch"]],
  ["page.tsx", pageFile, ["AdminEditTab", "openAdminEdit"]],
  [
    "AdminEditTab.tsx",
    componentFile,
    ["word", "pinyin", "translations", "lessonId", "pos", "example", "saveVocabOverride", "deleteWordsGlobally"],
  ],
  ["adminEdit.ts", adminUtilFile, ["AdminEditPatch", "translations.ko", "lessonId", "getStepForLesson"]],
  ["package.json", packageFile, ["validate:frontend:step7"]],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

const blockedTerms = ["Cog" + "nite", "cog" + "nate", "cog" + "nates"];
for (const [fileName, content] of [
  ["GamificationContext.tsx", contextFile],
  ["AdminEditTab.tsx", componentFile],
  ["page.tsx", pageFile],
]) {
  for (const blocked of blockedTerms) {
    if (content.toLowerCase().includes(blocked.toLowerCase())) {
      errors.push(`${fileName} has removed-feature residue: ${blocked}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step7] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step7] validation complete");
  console.log("[frontend-step7] Admin EDIT UI, overrides, and delete wiring are present");
}
