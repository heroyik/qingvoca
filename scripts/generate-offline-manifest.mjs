import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = "src/data/vocab.json";
const DEFAULT_OUTPUT = "public/offline-manifest.json";
const OUT_OUTPUT = "out/offline-manifest.json";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/qingvoca";
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
const routes = [
  "/",
  "/quiz/[unitId]",
  "/quiz/review",
  ...steps.flatMap((step) => [`/quiz/${step}`, `/quiz/unit-${step}`]),
];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory, predicate) {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(fullPath, predicate);
      return predicate(fullPath) ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function toPublicUrl(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  if (normalized.startsWith("out/")) return `${BASE_PATH}/${normalized.slice("out/".length)}`;
  if (normalized.startsWith("public/")) return `${BASE_PATH}/${normalized.slice("public/".length)}`;
  return `${BASE_PATH}/${normalized}`;
}

const staticAssets = await collectFiles("out", (filePath) =>
  /\/_next\/static\//.test(filePath.split(path.sep).join("/")) ||
  /\.(css|js|json|png|jpg|jpeg|svg|ico|webp|woff2?)$/i.test(filePath),
);
const publicAssets = await collectFiles("public", (filePath) =>
  /\.(json|png|jpg|jpeg|svg|ico|webp|woff2?|mp3|wav)$/i.test(filePath) && !filePath.endsWith("offline-manifest.json"),
);
const urls = Array.from(
  new Set([
    ...routes.map((route) => `${BASE_PATH}${route === "/" ? "/" : route}`),
    `${BASE_PATH}`,
    `${BASE_PATH}/offline-manifest.json`,
    ...staticAssets.map(toPublicUrl),
    ...publicAssets.map(toPublicUrl),
  ]),
).sort();

const manifest = {
  language: DATASET_LANGUAGE,
  hsk: DATASET_LEVEL,
  datasetVersion: DATASET_VERSION,
  generatedAt: new Date().toISOString(),
  basePath: BASE_PATH,
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
  routes,
  urls,
};

await mkdir(path.dirname(outputPath), { recursive: true });
const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(outputPath, manifestContent);

if (outputPath === DEFAULT_OUTPUT && (await exists("out"))) {
  await mkdir(path.dirname(OUT_OUTPUT), { recursive: true });
  await writeFile(OUT_OUTPUT, manifestContent);
}

console.log("[offline] manifest generated");
console.log(`[offline] input: ${inputPath}`);
console.log(`[offline] output: ${outputPath}`);
if (outputPath === DEFAULT_OUTPUT && (await exists("out"))) console.log(`[offline] output: ${OUT_OUTPUT}`);
console.log(`[offline] sha256: ${hash}`);
console.log(`[offline] total: ${vocab.data.length}`);
console.log(`[offline] urls: ${urls.length}`);
