import { readFile } from "node:fs/promises";

const css = await readFile("src/app/globals.css", "utf8");
const home = await readFile("src/app/page.tsx", "utf8");
const quiz = await readFile("src/components/Quiz.tsx", "utf8");
const admin = await readFile("src/components/AdminEditTab.tsx", "utf8");
const packageFile = await readFile("package.json", "utf8");
const errors = [];

for (const marker of [
  ".footer-nav",
  "max-width: 600px",
  ".aura-bar",
  "@media (max-width: 719px)",
  "overflow-wrap: anywhere",
  ".admin-word-row span",
  ".review-card-modern",
  "border-radius: 8px",
]) {
  if (!css.includes(marker)) errors.push(`globals.css missing marker: ${marker}`);
}

for (const [fileName, content, markers] of [
  ["page.tsx", home, ["AdminEditTab", "Leaderboard", "unit-node"]],
  ["Quiz.tsx", quiz, ["quiz-layout", "option-card", "feedback-bar"]],
  ["AdminEditTab.tsx", admin, ["admin-edit-grid", "admin-word-row", "grid-2"]],
  ["package.json", packageFile, ["validate:frontend:step9"]],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

const blockedTerms = ["Cog" + "nite", "cog" + "nate", "cog" + "nates"];
for (const blocked of blockedTerms) {
  if (css.toLowerCase().includes(blocked.toLowerCase())) {
    errors.push(`globals.css has removed-feature residue: ${blocked}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step9] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step9] validation complete");
  console.log("[frontend-step9] responsive layout, overflow guards, and removed-feature CSS cleanup are present");
}
