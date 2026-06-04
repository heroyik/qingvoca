import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_ROOTS = ["src", "scripts"];
const blocked = /\b(cognite|cognate|cognates)\b/i;
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(entry.name)) {
      if (fullPath === "scripts/validate_step7_no_cognite.mjs") continue;
      const content = await readFile(fullPath, "utf8");
      if (blocked.test(content)) errors.push(fullPath);
    }
  }
}

for (const root of SOURCE_ROOTS) {
  await walk(root);
}

if (errors.length > 0) {
  for (const file of errors) console.error(`[step7] blocked cognite reference: ${file}`);
  process.exitCode = 1;
} else {
  console.log("[step7] validation complete");
  console.log("[step7] no cognite/cognate implementation references in src or scripts");
}
