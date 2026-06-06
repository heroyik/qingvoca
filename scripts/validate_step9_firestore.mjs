import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = await mkdtemp(path.join(tmpdir(), "qingvoca-firestore-"));
const outputPath = path.join(tempDir, "payload.json");

const result = spawnSync("node", ["scripts/sync-firestore-chinese-vocab.mjs", "src/data/vocab.json", outputPath], {
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const payload = JSON.parse(await readFile(outputPath, "utf8"));
const errors = [];

if (payload.collections.vocabEntries !== "zhVocabEntries") errors.push("vocab collection is not zhVocabEntries");
if (payload.collections.fullVocaEntries !== "zhFullVocaEntries") errors.push("full vocab collection is not zhFullVocaEntries");
if (payload.collections.datasetMeta !== "zhDatasetMeta") errors.push("dataset meta collection is not zhDatasetMeta");
if (payload.documents.length !== 636) errors.push(`expected 636 documents, got ${payload.documents.length}`);
if (payload.meta.id !== "zh-HSK4-v1") errors.push("dataset meta id is not zh-HSK4-v1");

for (const document of payload.documents) {
  const data = document.data;
  if (document.collection !== "zhVocabEntries") errors.push(`${document.id} wrong collection`);
  if (data.language !== "zh") errors.push(`${document.id} missing language=zh`);
  if (data.hsk !== "HSK4") errors.push(`${document.id} missing hsk=HSK4`);
  if (data.datasetVersion !== "zh-HSK4-v1") errors.push(`${document.id} missing datasetVersion`);
  if (typeof data.step !== "number") errors.push(`${document.id} missing numeric step`);
}

if (payload.meta.data.language !== "zh" || payload.meta.data.hsk !== "HSK4" || payload.meta.data.stepCount !== 20) {
  errors.push("dataset meta is not scoped to zh HSK4 with 20 steps");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step9] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step9] validation complete");
  console.log("[step9] collections: zhVocabEntries, zhFullVocaEntries, zhDatasetMeta");
  console.log("[step9] all documents include language=zh, hsk=HSK4, datasetVersion=zh-HSK4-v1, step");
  console.log("[step9] payload generation is dry-run only");
}
