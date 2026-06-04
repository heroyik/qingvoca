import { readFile } from "node:fs/promises";

const page = await readFile("src/app/page.tsx", "utf8");
const constants = await readFile("src/lib/constants.ts", "utf8");
const errors = [];

for (const marker of [
  '"use client"',
  'type HomeTab = "learn" | "leader" | "review" | "profile" | "edit"',
  "createHomeStepCards",
  "getUnits",
  "footer-nav",
  "unit-node",
  "start-indicator",
  "aura-bar",
  "https://github.com/heroyik/qingvoca",
]) {
  if (!page.includes(marker)) errors.push(`missing home marker: ${marker}`);
}

const blockedTerms = [
  "Cog" + "niteTab",
  "cog" + "nite",
  "COG" + "NITE",
  "filterEasy" + "Cog" + "nates",
];

for (const blocked of blockedTerms) {
  if (page.includes(blocked)) errors.push(`blocked home reference remains: ${blocked}`);
}

for (const marker of ['APP_NAME = "QingVoca"', 'BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/qingvoca"']) {
  if (!constants.includes(marker)) errors.push(`missing constants marker: ${marker}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step3] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step3] validation complete");
  console.log("[frontend-step3] Kamivoca-style home tabs and Step cards are present");
  console.log("[frontend-step3] removed feature references are absent from the home page");
}
