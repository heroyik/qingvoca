import { existsSync, readFileSync } from "node:fs";

const requiredEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const errors = [];

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const firebaserc = read(".firebaserc");
if (!firebaserc) {
  errors.push(".firebaserc is missing");
} else {
  const config = JSON.parse(firebaserc);
  if (config.projects?.default !== "qingvoca-app") {
    errors.push(".firebaserc default project must be qingvoca-app");
  }
}

for (const file of [".env.example", ".env.local"]) {
  if (!existsSync(file)) {
    errors.push(`${file} is missing`);
    continue;
  }
  const content = read(file);
  for (const key of requiredEnvKeys) {
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    if (!match) {
      errors.push(`${file} missing ${key}`);
    } else if (file === ".env.local" && /your-|<|>|\.\.\.|^\s*$/.test(match[1])) {
      errors.push(`${file} has placeholder value for ${key}`);
    }
  }
}

const firebaseSource = read("src/lib/firebase.ts");
for (const marker of [
  "export const firebaseConfig",
  "authDomain",
  "GoogleAuthProvider",
  "browserLocalPersistence",
  "isFirebaseConfigured",
]) {
  if (!firebaseSource.includes(marker)) errors.push(`src/lib/firebase.ts missing ${marker}`);
}

const contextSource = read("src/contexts/GamificationContext.tsx");
if (!contextSource.includes("isFirebaseConfigured")) {
  errors.push("GamificationContext must use isFirebaseConfigured for offline/local-only mode");
}

if (errors.length) {
  for (const error of errors) console.error(`[firebase-auth] ${error}`);
  process.exit(1);
}

console.log("[firebase-auth] Firebase Auth connection config is present");
