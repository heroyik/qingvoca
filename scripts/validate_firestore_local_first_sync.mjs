import { readFile } from "node:fs/promises";

const availabilityFile = await readFile("src/utils/firestoreAvailability.ts", "utf8");
const queueFile = await readFile("src/utils/firestoreSyncQueue.ts", "utf8");
const syncHookFile = await readFile("src/hooks/useFirestoreSync.ts", "utf8");
const contextFile = await readFile("src/contexts/GamificationContext.tsx", "utf8");
const pageFile = await readFile("src/app/page.tsx", "utf8");
const leaderboardFile = await readFile("src/components/Leaderboard.tsx", "utf8");
const reviewFile = await readFile("src/components/ReviewTab.tsx", "utf8");
const packageFile = await readFile("package.json", "utf8");
const errors = [];

for (const [fileName, content, markers] of [
  [
    "firestoreAvailability.ts",
    availabilityFile,
    ["FIRESTORE_SYNC_STATE_KEY", "resource-exhausted", "nextRetryAt", "canUseFirestore", "markFirestoreFailure", "markFirestoreRemoteRead"],
  ],
  [
    "firestoreSyncQueue.ts",
    queueFile,
    ["FIRESTORE_SYNC_QUEUE_KEY", "compactSyncQueue", "enqueueUserStats", "enqueueGlobalMistakeDelta", "enqueueAdminOverride", "attempts"],
  ],
  [
    "useFirestoreSync.ts",
    syncHookFile,
    ["MAX_GLOBAL_MISTAKES_PER_FLUSH", "MAX_ADMIN_WRITES_PER_FLUSH", "writeBatch", "markFirestoreFailure", "readSyncQueue", "queue.slice(index + 1)", "flushOrPruneFirestoreQueue"],
  ],
  [
    "GamificationContext.tsx",
    contextFile,
    ["enqueueUserStats", "enqueueGlobalMistakeDelta", "enqueueAdminDeletedWords", "useFirestoreSync", "mergeRemoteStats", "getDocFromCache", "ADMIN_VOCAB_REMOTE_READ_KEY"],
  ],
  ["page.tsx", pageFile, ["cloudSyncTitle", "syncNow", "syncMessageSignIn", "getQueueSummary", "readFirestoreSyncState", "qingvoca:firestore-sync-queue-changed"]],
  ["Leaderboard.tsx", leaderboardFile, ["canUseFirestore", "markFirestoreFailure", "LEADERBOARD_CACHE_TTL_MS = 30 * 60 * 1000"]],
  ["ReviewTab.tsx", reviewFile, ["canUseFirestore", "markFirestoreFailure", "GLOBAL_MISTAKES_CACHE_TTL_MS = 30 * 60 * 1000"]],
  ["package.json", packageFile, ["validate:firestore:local-first"]],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

if (contextFile.includes("increment(1)") || contextFile.includes("onSnapshot(")) {
  errors.push("GamificationContext should not perform immediate global increments or persistent snapshots");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[firestore-local-first] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[firestore-local-first] validation complete");
  console.log("[firestore-local-first] local-first queue, cooldown, and guarded reads are connected");
}
