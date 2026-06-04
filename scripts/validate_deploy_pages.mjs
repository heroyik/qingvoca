import { readFile } from "node:fs/promises";

const workflow = await readFile(".github/workflows/deploy-pages.yml", "utf8");
const nextConfig = await readFile("next.config.ts", "utf8");
const packageFile = await readFile("package.json", "utf8");
const errors = [];

for (const marker of [
  "actions/configure-pages@v5",
  "actions/upload-pages-artifact@v4",
  "actions/deploy-pages@v4",
  "path: out",
  "NEXT_PUBLIC_BASE_PATH: /qingvoca",
  "npm ci",
  "npm run build",
  "pages: write",
  "id-token: write",
]) {
  if (!workflow.includes(marker)) errors.push(`deploy workflow missing marker: ${marker}`);
}

for (const marker of ['output: "export"', 'basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/qingvoca"', "unoptimized: true"]) {
  if (!nextConfig.includes(marker)) errors.push(`next.config.ts missing marker: ${marker}`);
}

if (!packageFile.includes("validate:deploy")) errors.push("package.json missing validate:deploy script");

if (errors.length > 0) {
  for (const error of errors) console.error(`[deploy] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[deploy] validation complete");
  console.log("[deploy] GitHub Pages workflow is configured for Next static export");
}
