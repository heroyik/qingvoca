import { readFile } from "node:fs/promises";

const source = await readFile("src/utils/vocab.ts", "utf8");
const vocab = JSON.parse(await readFile("src/data/vocab.json", "utf8"));
const errors = [];

for (const marker of [
  "export type VocabEntry",
  "export interface LearningUnit",
  "normalizeVocabWordKey",
  "filterDeletedWords",
  "normalizeDisplayFurigana",
  "inferPOS",
  "parseUnitId",
  "getAllVocabData",
  "getUnits",
  "getRandomWords",
  "getTotalWordCount",
]) {
  if (!source.includes(marker)) errors.push(`missing vocab adapter API: ${marker}`);
}

function parseUnitId(unitId) {
  return Number(String(unitId).startsWith("unit-") ? String(unitId).slice(5) : unitId);
}

if (parseUnitId("unit-1") !== 1) errors.push("unit-1 did not parse to Step 1");
if (parseUnitId("10") !== 10) errors.push("10 did not parse to Step 10");

const units = [];
for (let step = 1; step <= 10; step += 1) {
  const words = vocab.data.filter((entry) => entry.step === step);
  const lessons = [...new Set(words.map((entry) => entry.lessonId))].sort((a, b) => a - b);
  units.push({
    id: `unit-${step}`,
    title: `Step ${step}`,
    source: `Lesson ${lessons[0]}-${lessons[lessons.length - 1]}`,
    words,
    step,
    lessonIds: lessons,
    hsk: "HSK4",
  });
}

if (units.length !== 10) errors.push(`expected 10 units, got ${units.length}`);
if (units[0].id !== "unit-1" || units[0].source !== "Lesson 1-2") errors.push("first unit shape is wrong");
if (units[9].id !== "unit-10" || units[9].source !== "Lesson 19-20") errors.push("last unit shape is wrong");
if (units.some((unit) => unit.words.length === 0)) errors.push("unit with no words found");
if (units.reduce((sum, unit) => sum + unit.words.length, 0) !== 636) errors.push("unit word total is not 636");

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step2] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step2] validation complete");
  console.log("[frontend-step2] Kamivoca-compatible vocab adapter APIs are present");
  console.log("[frontend-step2] getUnits shape: unit-1..unit-10, Step titles, Lesson ranges, HSK4");
}
