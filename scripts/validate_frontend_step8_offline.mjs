import { readFile } from "node:fs/promises";

const swFile = await readFile("public/sw.js", "utf8");
const registrarFile = await readFile("src/components/ServiceWorkerRegistrar.tsx", "utf8");
const gateFile = await readFile("src/components/OfflineModeGate.tsx", "utf8");
const layoutFile = await readFile("src/app/layout.tsx", "utf8");
const contextFile = await readFile("src/contexts/GamificationContext.tsx", "utf8");
const generatorFile = await readFile("scripts/generate-offline-manifest.mjs", "utf8");
const packageFile = await readFile("package.json", "utf8");
const errors = [];

for (const [fileName, content, markers] of [
  [
    "sw.js",
    swFile,
    ["CACHE_VERSION", "OFFLINE_MANIFEST", "install", "activate", "fetch", "OFFLINE_STATUS", "cacheFirst", "networkFirst"],
  ],
  ["ServiceWorkerRegistrar.tsx", registrarFile, ["navigator.serviceWorker.register", "BASE_PATH", "OFFLINE_STATUS"]],
  ["OfflineModeGate.tsx", gateFile, ["isOnline", "isOfflineMode", "offline-banner"]],
  ["layout.tsx", layoutFile, ["ServiceWorkerRegistrar", "OfflineModeGate"]],
  ["GamificationContext.tsx", contextFile, ["window.addEventListener(\"online\"", "window.addEventListener(\"offline\"", "isOfflineMode"]],
  ["generate-offline-manifest.mjs", generatorFile, ["urls", "out/offline-manifest.json", "BASE_PATH", "collectFiles"]],
  ["package.json", packageFile, ["validate:frontend:step8"]],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

const blockedTerms = ["Cog" + "nite", "cog" + "nate", "cog" + "nates"];
for (const [fileName, content] of [
  ["ServiceWorkerRegistrar.tsx", registrarFile],
  ["OfflineModeGate.tsx", gateFile],
  ["GamificationContext.tsx", contextFile],
]) {
  for (const blocked of blockedTerms) {
    if (content.toLowerCase().includes(blocked.toLowerCase())) {
      errors.push(`${fileName} has removed-feature residue: ${blocked}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step8] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step8] validation complete");
  console.log("[frontend-step8] service worker, offline manifest URLs, and offline gate are connected");
}
