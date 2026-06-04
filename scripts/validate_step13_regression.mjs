import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const source = JSON.parse(await readFile("data/vocab.json", "utf8"));
const vocab = JSON.parse(await readFile("src/data/vocab.json", "utf8"));
const manifest = JSON.parse(await readFile("public/offline-manifest.json", "utf8"));
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const errors = [];

if (!Array.isArray(source.words)) errors.push("data/vocab.json words array missing");
if (source.totalCount !== 636 || source.words.length !== 636) errors.push("source vocab count is not 636");
if (!Array.isArray(vocab.data)) errors.push("src/data/vocab.json data array missing");
if (vocab.data.length !== 636) errors.push(`converted vocab count is ${vocab.data.length}, expected 636`);

const requiredFields = ["id", "word", "pinyin", "meaning", "translations", "lessonId", "step", "level", "hsk", "pos"];
for (const entry of vocab.data) {
  for (const field of requiredFields) {
    if (entry[field] == null || entry[field] === "") errors.push(`${entry.id ?? "(missing id)"} missing ${field}`);
  }
  if (entry.hsk !== "HSK4") errors.push(`${entry.id} hsk is not HSK4`);
  if (entry.step < 1 || entry.step > 10) errors.push(`${entry.id} step out of range`);
  if (entry.step !== Math.ceil(entry.lessonId / 2)) errors.push(`${entry.id} step does not match lessonId`);
  if (entry.level !== entry.step) errors.push(`${entry.id} level does not match step`);
}

for (let step = 1; step <= 10; step += 1) {
  const words = vocab.data.filter((entry) => entry.step === step);
  if (words.length === 0) errors.push(`Step ${step} has no words`);
}

const step1Lessons = [...new Set(vocab.data.filter((entry) => entry.step === 1).map((entry) => entry.lessonId))].sort((a, b) => a - b);
const step10Lessons = [...new Set(vocab.data.filter((entry) => entry.step === 10).map((entry) => entry.lessonId))].sort((a, b) => a - b);
if (JSON.stringify(step1Lessons) !== JSON.stringify([1, 2])) errors.push("Step 1 does not map to Lesson 1-2");
if (JSON.stringify(step10Lessons) !== JSON.stringify([19, 20])) errors.push("Step 10 does not map to Lesson 19-20");

const sample = vocab.data[0];
if (!sample.translations.ko || !sample.translations.ja || !sample.translations.en) {
  errors.push("sample locale translations missing");
}

if (manifest.language !== "zh" || manifest.hsk !== "HSK4") errors.push("offline manifest dataset scope mismatch");
if (!manifest.routes.includes("/") || !manifest.routes.includes("/quiz/[unitId]") || !manifest.routes.includes("/quiz/review")) {
  errors.push("offline manifest missing required routes");
}

for (const scriptName of [
  "validate:step4",
  "validate:step5",
  "validate:step6",
  "validate:step7",
  "validate:step8",
  "validate:step9",
  "validate:step10",
  "validate:step11",
  "validate:step12",
  "validate:frontend:step2",
  "validate:frontend:step3",
  "validate:frontend:step4",
  "validate:frontend:step5",
  "validate:frontend:step6",
  "validate:frontend:step7",
  "validate:frontend:step8",
  "validate:frontend:step9",
]) {
  if (!packageJson.scripts?.[scriptName]) errors.push(`missing package script ${scriptName}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step13] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step13] data regression checks passed");
  console.log("[step13] UI/E2E model checks passed: home steps, quiz route, review route, locale translations, offline manifest");
}

if (process.exitCode) process.exit(process.exitCode);

const validationScripts = [
  "validate:step4",
  "validate:step5",
  "validate:step6",
  "validate:step7",
  "validate:step8",
  "validate:step9",
  "validate:step10",
  "validate:step11",
  "validate:step12",
  "validate:frontend:step2",
  "validate:frontend:step3",
  "validate:frontend:step4",
  "validate:frontend:step5",
  "validate:frontend:step6",
  "validate:frontend:step7",
  "validate:frontend:step8",
  "validate:frontend:step9",
];

for (const scriptName of validationScripts) {
  const result = spawnSync("npm", ["run", scriptName], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`[step13] ${scriptName} failed`);
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

console.log("[step13] all core and frontend validation scripts passed");
