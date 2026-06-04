import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = await mkdtemp(path.join(tmpdir(), "qingvoca-offline-"));
const outputPath = path.join(tempDir, "offline-manifest.json");

const result = spawnSync("node", ["scripts/generate-offline-manifest.mjs", "src/data/vocab.json", outputPath], {
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const dataContent = await readFile("src/data/vocab.json");
const expectedHash = createHash("sha256").update(dataContent).digest("hex");
const manifest = JSON.parse(await readFile(outputPath, "utf8"));
const asset = manifest.assets.find((item) => item.path === "src/data/vocab.json");
const errors = [];

if (manifest.language !== "zh") errors.push("manifest language is not zh");
if (manifest.hsk !== "HSK4") errors.push("manifest hsk is not HSK4");
if (manifest.datasetVersion !== "zh-HSK4-v1") errors.push("manifest datasetVersion is not zh-HSK4-v1");
if (!asset) errors.push("vocab asset missing");
if (asset && asset.hash !== expectedHash) errors.push("vocab hash mismatch");
if (asset && asset.totalCount !== 636) errors.push(`expected totalCount 636, got ${asset.totalCount}`);
if (asset && asset.stepCount !== 10) errors.push(`expected stepCount 10, got ${asset.stepCount}`);
if (asset && asset.lessonCount !== 20) errors.push(`expected lessonCount 20, got ${asset.lessonCount}`);
for (const route of ["/", "/quiz/[unitId]", "/quiz/review"]) {
  if (!manifest.routes.includes(route)) errors.push(`missing route ${route}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step10] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step10] validation complete");
  console.log("[step10] offline manifest includes src/data/vocab.json sha256 hash");
  console.log("[step10] dataset metadata: zh, HSK4, zh-HSK4-v1, 636 words, 10 steps, 20 lessons");
  console.log("[step10] offline routes: /, /quiz/[unitId], /quiz/review");
}
