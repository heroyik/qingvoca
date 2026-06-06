import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_INPUT = "data/vocab.json";
const DEFAULT_OUTPUT = "src/data/vocab.json";
const REQUIRED_FIELDS = ["word", "pinyin", "meaning", "lessonId", "translations"];
const REQUIRED_TRANSLATIONS = ["ko", "ja", "en"];
const DATASET_LEVEL = "HSK4";

const inputPath = process.argv[2] ?? DEFAULT_INPUT;
const outputPath = process.argv[3] ?? DEFAULT_OUTPUT;

function getStepForLesson(lessonId) {
  return lessonId;
}

function getBandForStep(step) {
  if (step <= 6) return "BASIC";
  if (step <= 14) return "INTERMEDIATE";
  return "ADVANCED";
}

function getDisplayMeaning(entry) {
  return entry.translations?.ko || entry.meaning || entry.translations?.en || entry.word;
}

function validateSource(source) {
  const errors = [];

  if (!source || typeof source !== "object") {
    errors.push("source must be a JSON object");
    return { errors, words: [] };
  }

  if (!Array.isArray(source.words)) {
    errors.push("source.words must be an array");
    return { errors, words: [] };
  }

  if (typeof source.totalCount === "number" && source.totalCount !== source.words.length) {
    errors.push(`totalCount mismatch: declared ${source.totalCount}, actual ${source.words.length}`);
  }

  return { errors, words: source.words };
}

function collectStats(words) {
  const missing = Object.fromEntries(
    [...REQUIRED_FIELDS, "partOfSpeech", ...REQUIRED_TRANSLATIONS.map((key) => `translations.${key}`)].map((key) => [
      key,
      0,
    ]),
  );
  const duplicateKeys = new Map();
  const lessonCounts = new Map();

  for (const word of words) {
    for (const field of REQUIRED_FIELDS) {
      if (word[field] == null || word[field] === "") missing[field] += 1;
    }

    if (word.partOfSpeech == null || word.partOfSpeech === "") missing.partOfSpeech += 1;

    for (const locale of REQUIRED_TRANSLATIONS) {
      if (!word.translations || !word.translations[locale]) missing[`translations.${locale}`] += 1;
    }

    const duplicateKey = `${word.word}\u0000${word.pinyin}`;
    duplicateKeys.set(duplicateKey, (duplicateKeys.get(duplicateKey) ?? 0) + 1);
    lessonCounts.set(word.lessonId, (lessonCounts.get(word.lessonId) ?? 0) + 1);
  }

  const duplicates = [...duplicateKeys.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key: key.replace("\u0000", " / "), count }));

  return {
    missing,
    duplicates,
    lessonCounts: Object.fromEntries([...lessonCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
  };
}

function transformWords(words) {
  return [...words]
    .sort((a, b) => {
      const lessonDelta = a.lessonId - b.lessonId;
      if (lessonDelta !== 0) return lessonDelta;
      return `${a.word}\u0000${a.pinyin}`.localeCompare(`${b.word}\u0000${b.pinyin}`, "zh-Hans-CN");
    })
    .map((entry, index) => {
      const step = getStepForLesson(entry.lessonId);
      const band = getBandForStep(step);
      const pinyin = entry.pinyin || "";

      return {
        id: String(index + 1).padStart(4, "0"),
        word: entry.word,
        pinyin,
        reading: pinyin,
        furigana: pinyin,
        meaning: getDisplayMeaning(entry),
        translations: {
          ko: entry.translations?.ko,
          ja: entry.translations?.ja,
          en: entry.translations?.en,
        },
        level: step,
        lessonId: entry.lessonId,
        step,
        pos: entry.partOfSpeech || "unknown",
        hsk: DATASET_LEVEL,
        jlpt: DATASET_LEVEL,
        band,
        opic: band,
        example: [],
      };
    });
}

function validateOutput(entries) {
  const errors = [];
  const steps = new Set(entries.map((entry) => entry.step));

  if (steps.size !== 20) {
    errors.push(`expected exactly 20 steps, got ${steps.size}`);
  }

  for (let step = 1; step <= 20; step += 1) {
    if (!steps.has(step)) errors.push(`missing Step ${step}`);
  }

  for (const entry of entries) {
    if (entry.hsk !== DATASET_LEVEL || entry.jlpt !== DATASET_LEVEL) {
      errors.push(`invalid dataset level for ${entry.id}`);
    }
    if (entry.step !== getStepForLesson(entry.lessonId)) {
      errors.push(`invalid step for ${entry.id}: lesson ${entry.lessonId}, step ${entry.step}`);
    }
  }

  return errors;
}

function countBy(entries, key) {
  const counts = new Map();
  for (const entry of entries) counts.set(entry[key], (counts.get(entry[key]) ?? 0) + 1);
  return Object.fromEntries([...counts.entries()].sort((a, b) => Number(a[0]) - Number(b[0])));
}

async function main() {
  const source = JSON.parse(await readFile(inputPath, "utf8"));
  const { errors: sourceErrors, words } = validateSource(source);
  const stats = collectStats(words);

  const blockingMissing = Object.entries(stats.missing).filter(
    ([field, count]) => count > 0 && field !== "partOfSpeech",
  );

  if (stats.duplicates.length > 0) {
    sourceErrors.push(`duplicate word+pinyin entries: ${stats.duplicates.length}`);
  }

  if (blockingMissing.length > 0) {
    sourceErrors.push(
      `missing required fields: ${blockingMissing.map(([field, count]) => `${field}=${count}`).join(", ")}`,
    );
  }

  if (sourceErrors.length > 0) {
    for (const error of sourceErrors) console.error(`[transform:zh] ${error}`);
    process.exitCode = 1;
    return;
  }

  const entries = transformWords(words);
  const outputErrors = validateOutput(entries);

  if (outputErrors.length > 0) {
    for (const error of outputErrors) console.error(`[transform:zh] ${error}`);
    process.exitCode = 1;
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        data: entries,
        meta: {
          language: "zh",
          hsk: DATASET_LEVEL,
          source: inputPath,
          sourceVersion: source.version,
          generatedAt: new Date().toISOString(),
          totalCount: entries.length,
          lessonCounts: stats.lessonCounts,
          stepCounts: countBy(entries, "step"),
          missingFields: stats.missing,
          duplicateCount: stats.duplicates.length,
        },
      },
      null,
      2,
    )}\n`,
  );

  console.log("[transform:zh] complete");
  console.log(`[transform:zh] input: ${inputPath}`);
  console.log(`[transform:zh] output: ${outputPath}`);
  console.log(`[transform:zh] total: ${entries.length}`);
  console.log(`[transform:zh] lesson range: ${Math.min(...words.map((word) => word.lessonId))}-${Math.max(...words.map((word) => word.lessonId))}`);
  console.log(`[transform:zh] lesson counts: ${JSON.stringify(stats.lessonCounts)}`);
  console.log(`[transform:zh] step counts: ${JSON.stringify(countBy(entries, "step"))}`);
  console.log(`[transform:zh] missing fields: ${JSON.stringify(stats.missing)}`);
  console.log(`[transform:zh] duplicate count: ${stats.duplicates.length}`);
}

main().catch((error) => {
  console.error(`[transform:zh] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
