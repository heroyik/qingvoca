import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const plan = await readFile("plan/frontend_app_development_plan.md", "utf8");
const errors = [];

const requiredScripts = [
  "validate:frontend:step2",
  "validate:frontend:step3",
  "validate:frontend:step4",
  "validate:frontend:step5",
  "validate:frontend:step6",
  "validate:frontend:step7",
  "validate:frontend:step8",
  "validate:frontend:step9",
  "validate:step7",
  "validate:step11",
  "test",
  "build",
];

for (const scriptName of requiredScripts) {
  if (!packageJson.scripts?.[scriptName]) errors.push(`missing package script ${scriptName}`);
}

for (const marker of [
  "1단계: Next.js 앱 골격 이식",
  "4단계: 퀴즈 화면 이식",
  "7단계: 관리자 EDIT 이식",
  "10단계: 테스트와 회귀",
]) {
  if (!plan.includes(marker)) errors.push(`frontend plan missing marker: ${marker}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step10] ${error}`);
  process.exit(1);
}

const validationScripts = [
  "validate:frontend:step2",
  "validate:frontend:step3",
  "validate:frontend:step4",
  "validate:frontend:step5",
  "validate:frontend:step6",
  "validate:frontend:step7",
  "validate:frontend:step8",
  "validate:frontend:step9",
  "validate:step7",
  "validate:step11",
];

for (const scriptName of validationScripts) {
  const result = spawnSync("npm", ["run", scriptName], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`[frontend-step10] ${scriptName} failed`);
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

console.log("[frontend-step10] validation complete");
console.log("[frontend-step10] frontend step scripts, deleted-feature guard, and UI guard are all wired");
