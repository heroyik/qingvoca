import { readFile } from "node:fs/promises";

const firebaseFile = await readFile("src/lib/firebase.ts", "utf8");
const contextFile = await readFile("src/contexts/GamificationContext.tsx", "utf8");
const hookFile = await readFile("src/hooks/useGamification.ts", "utf8");
const pageFile = await readFile("src/app/page.tsx", "utf8");
const leaderboardFile = await readFile("src/components/Leaderboard.tsx", "utf8");
const packageFile = await readFile("package.json", "utf8");
const errors = [];

for (const [fileName, content, markers] of [
  [
    "firebase.ts",
    firebaseFile,
    [
      "initializeApp",
      "getAuth",
      "GoogleAuthProvider",
      "initializeFirestore",
      "persistentLocalCache",
      "NEXT_PUBLIC_FIREBASE_API_KEY",
    ],
  ],
  [
    "GamificationContext.tsx",
    contextFile,
    ["onAuthStateChanged", "signInWithPopup", "signOut", "enqueueUserStats", "useFirestoreSync", "canUseFirestore"],
  ],
  ["useGamification.ts", hookFile, ["useGamification"]],
  ["page.tsx", pageFile, ["Leaderboard", "signInWithGoogle", "signOutUser", "isOfflineMode"]],
  ["Leaderboard.tsx", leaderboardFile, ["collection", "orderBy", "getDocsFromCache", "getDocs", "users"]],
  ["package.json", packageFile, ['"firebase"']],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

const blockedTerms = ["Cog" + "nite", "cog" + "nate", "cog" + "nates"];
for (const [fileName, content] of [
  ["firebase.ts", firebaseFile],
  ["GamificationContext.tsx", contextFile],
  ["Leaderboard.tsx", leaderboardFile],
  ["page.tsx", pageFile],
]) {
  for (const blocked of blockedTerms) {
    if (content.toLowerCase().includes(blocked.toLowerCase())) {
      errors.push(`${fileName} has removed-feature residue: ${blocked}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step6] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step6] validation complete");
  console.log("[frontend-step6] Firebase auth, Firestore sync, and leaderboard wiring are present");
}
