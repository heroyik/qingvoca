import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = "src/data/vocab.json";
const DEFAULT_OUTPUT = "dist/firestore/chinese-vocab-payload.json";
const DATASET_LANGUAGE = "zh";
const DATASET_LEVEL = "HSK4";
const DATASET_VERSION = "zh-HSK4-v1";

const COLLECTIONS = {
  vocabEntries: "zhVocabEntries",
  fullVocaEntries: "zhFullVocaEntries",
  datasetMeta: "zhDatasetMeta",
};

const inputPath = process.argv[2] ?? DEFAULT_INPUT;
const outputPath = process.argv[3] ?? DEFAULT_OUTPUT;

const vocab = JSON.parse(await readFile(inputPath, "utf8"));

if (!Array.isArray(vocab.data)) {
  throw new Error(`${inputPath} must contain a data array`);
}

const documents = vocab.data.map((entry) => ({
  collection: COLLECTIONS.vocabEntries,
  id: entry.id,
  data: {
    ...entry,
    language: DATASET_LANGUAGE,
    hsk: DATASET_LEVEL,
    jlpt: DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
  },
}));

const meta = {
  collection: COLLECTIONS.datasetMeta,
  id: DATASET_VERSION,
  data: {
    language: DATASET_LANGUAGE,
    hsk: DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
    totalCount: vocab.data.length,
    stepCount: new Set(vocab.data.map((entry) => entry.step)).size,
    lessonCount: new Set(vocab.data.map((entry) => entry.lessonId)).size,
    generatedAt: new Date().toISOString(),
    sourceMeta: vocab.meta ?? null,
  },
};

const payload = {
  mode: "dry-run",
  collections: COLLECTIONS,
  documents,
  meta,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log("[firestore:zh] payload generated");
console.log(`[firestore:zh] input: ${inputPath}`);
console.log(`[firestore:zh] output: ${outputPath}`);
console.log(`[firestore:zh] vocab collection: ${COLLECTIONS.vocabEntries}`);
console.log(`[firestore:zh] meta collection: ${COLLECTIONS.datasetMeta}`);
console.log(`[firestore:zh] documents: ${documents.length}`);
