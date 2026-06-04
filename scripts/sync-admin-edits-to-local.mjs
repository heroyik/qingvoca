import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_VOCAB_PATH = "src/data/vocab.json";
const DEFAULT_EDITS_PATH = "data/admin-edits.json";
const DEFAULT_OUTPUT_PATH = "src/data/vocab.json";
const DATASET_LEVEL = "HSK4";

const vocabPath = process.argv[2] ?? DEFAULT_VOCAB_PATH;
const editsPath = process.argv[3] ?? DEFAULT_EDITS_PATH;
const outputPath = process.argv[4] ?? DEFAULT_OUTPUT_PATH;

function getStepForLesson(lessonId) {
  return Math.ceil(lessonId / 2);
}

function getBandForStep(step) {
  if (step <= 3) return "BASIC";
  if (step <= 7) return "INTERMEDIATE";
  return "ADVANCED";
}

function getDisplayMeaning(entry) {
  return entry.translations?.ko || entry.meaning || entry.translations?.en || entry.word;
}

function applyEdit(entry, patch) {
  const lessonId = patch.lessonId ?? entry.lessonId;
  const step = patch.step ?? patch.level ?? getStepForLesson(lessonId);
  const pinyin = patch.pinyin ?? entry.pinyin;
  const translations = { ...entry.translations, ...patch.translations };
  const updated = {
    ...entry,
    word: patch.word ?? entry.word,
    pinyin,
    reading: pinyin,
    furigana: pinyin,
    translations,
    lessonId,
    step,
    level: step,
    pos: patch.pos ?? patch.partOfSpeech ?? entry.pos,
    hsk: DATASET_LEVEL,
    jlpt: DATASET_LEVEL,
    band: getBandForStep(step),
    opic: getBandForStep(step),
    example: patch.example ?? entry.example,
  };

  updated.meaning = patch.meaning ?? getDisplayMeaning(updated);
  return updated;
}

const vocab = JSON.parse(await readFile(vocabPath, "utf8"));
const editsFile = JSON.parse(await readFile(editsPath, "utf8"));
const patches = Array.isArray(editsFile) ? editsFile : editsFile.edits;

if (!Array.isArray(vocab.data)) {
  throw new Error(`${vocabPath} must contain a data array`);
}

if (!Array.isArray(patches)) {
  throw new Error(`${editsPath} must contain an edits array`);
}

const patchById = new Map(patches.map((patch) => [patch.id, patch]));
const missingPatchIds = patches.map((patch) => patch.id).filter((id) => !vocab.data.some((entry) => entry.id === id));

if (missingPatchIds.length > 0) {
  throw new Error(`Unknown edit ids: ${missingPatchIds.join(", ")}`);
}

const nextData = vocab.data.map((entry) => {
  const patch = patchById.get(entry.id);
  return patch ? applyEdit(entry, patch) : entry;
});

const nextVocab = {
  ...vocab,
  data: nextData,
  meta: {
    ...vocab.meta,
    adminEditedAt: new Date().toISOString(),
    adminEditCount: patches.length,
  },
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(nextVocab, null, 2)}\n`);

console.log("[admin-edit] complete");
console.log(`[admin-edit] vocab: ${vocabPath}`);
console.log(`[admin-edit] edits: ${editsPath}`);
console.log(`[admin-edit] output: ${outputPath}`);
console.log(`[admin-edit] applied: ${patches.length}`);
