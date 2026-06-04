import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = "src/data/vocab.json";
const DEFAULT_OUTPUT = "public/offline-manifest.json";
const DATASET_LANGUAGE = "zh";
const DATASET_LEVEL = "HSK4";
const DATASET_VERSION = "zh-HSK4-v1";

const inputPath = process.argv[2] ?? DEFAULT_INPUT;
const outputPath = process.argv[3] ?? DEFAULT_OUTPUT;
const content = await readFile(inputPath);
const vocab = JSON.parse(content.toString("utf8"));

if (!Array.isArray(vocab.data)) {
  throw new Error(`${inputPath} must contain a data array`);
}

const hash = createHash("sha256").update(content).digest("hex");
const steps = [...new Set(vocab.data.map((entry) => entry.step))].sort((a, b) => a - b);
const lessons = [...new Set(vocab.data.map((entry) => entry.lessonId))].sort((a, b) => a - b);

const manifest = {
  language: DATASET_LANGUAGE,
  hsk: DATASET_LEVEL,
  datasetVersion: DATASET_VERSION,
  generatedAt: new Date().toISOString(),
  assets: [
    {
      path: inputPath,
      type: "vocab-data",
      hashAlgorithm: "sha256",
      hash,
      bytes: content.byteLength,
      totalCount: vocab.data.length,
      stepCount: steps.length,
      lessonCount: lessons.length,
    },
  ],
  routes: ["/", "/quiz/[unitId]", "/quiz/review"],
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log("[offline] manifest generated");
console.log(`[offline] input: ${inputPath}`);
console.log(`[offline] output: ${outputPath}`);
console.log(`[offline] sha256: ${hash}`);
console.log(`[offline] total: ${vocab.data.length}`);
