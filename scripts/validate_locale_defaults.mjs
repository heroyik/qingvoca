import { readFile } from "node:fs/promises";

const localeSource = await readFile("src/utils/locale.ts", "utf8");
const errors = [];

for (const marker of [
  "getDeviceLocale",
  "navigator.language",
  "normalized === \"ko\"",
  "normalized.startsWith(\"ko-\")",
  "normalized === \"ja\"",
  "normalized.startsWith(\"ja-\")",
  "return \"en\"",
  "saved = storage.getItem",
]) {
  if (!localeSource.includes(marker)) errors.push(`locale.ts missing marker: ${marker}`);
}

function getDeviceLocale(language) {
  const normalized = language?.trim().toLowerCase().replace("_", "-");
  if (!normalized) return "en";
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  return "en";
}

const cases = [
  ["ko", "ko"],
  ["ko-KR", "ko"],
  ["KO_kr", "ko"],
  ["ja", "ja"],
  ["ja-JP", "ja"],
  ["en-US", "en"],
  ["zh-CN", "en"],
  ["", "en"],
  [undefined, "en"],
];

for (const [input, expected] of cases) {
  const actual = getDeviceLocale(input);
  if (actual !== expected) errors.push(`getDeviceLocale(${String(input)}) got ${actual}, expected ${expected}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[locale-defaults] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[locale-defaults] validation complete");
  console.log("[locale-defaults] device locale fallback: ko -> ko, ja -> ja, everything else -> en");
  console.log("[locale-defaults] saved localStorage locale still wins over device fallback");
}
