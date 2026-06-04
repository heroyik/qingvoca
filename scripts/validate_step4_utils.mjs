import { readFile } from "node:fs/promises";

const vocab = JSON.parse(await readFile("src/data/vocab.json", "utf8"));
const entries = vocab.data;

function getStepForLesson(lessonId) {
  return Math.ceil(lessonId / 2);
}

function getDisplayMeaning(entry, locale = "ko") {
  const translations = entry.translations ?? {};
  if (locale === "ja") return translations.ja || translations.ko || entry.meaning || translations.en || entry.word;
  if (locale === "en") return translations.en || entry.meaning || translations.ko || entry.word;
  return translations.ko || entry.meaning || translations.en || entry.word;
}

const errors = [];
const steps = [...new Set(entries.map((entry) => entry.step))].sort((a, b) => a - b);

if (steps.length !== 10) errors.push(`expected 10 steps, got ${steps.length}`);

for (let step = 1; step <= 10; step += 1) {
  const words = entries.filter((entry) => entry.step === step);
  if (words.length === 0) errors.push(`step ${step} has no words`);
}

for (const entry of entries) {
  if (entry.step !== getStepForLesson(entry.lessonId)) {
    errors.push(`${entry.id} invalid step`);
  }
  if (!getDisplayMeaning(entry, "ko") || !getDisplayMeaning(entry, "ja") || !getDisplayMeaning(entry, "en")) {
    errors.push(`${entry.id} has empty locale meaning`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step4] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step4] validation complete");
  console.log(`[step4] total words: ${entries.length}`);
  console.log(`[step4] steps: ${steps.join(", ")}`);
  console.log(
    `[step4] step counts: ${JSON.stringify(Object.fromEntries(steps.map((step) => [step, entries.filter((entry) => entry.step === step).length])))}`
  );
  console.log("[step4] locale meanings: ko, ja, en all non-empty");
}
