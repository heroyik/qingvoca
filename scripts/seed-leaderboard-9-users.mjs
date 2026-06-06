#!/usr/bin/env node

/**
 * Seed 9 users into Firestore's "users" collection for the Leaderboard.
 * Nationalities: American, British, Australian, French, Vietnamese.
 * Scores: 100-1000 XP in 10-point increments.
 *
 * Usage:
 *   node scripts/seed-leaderboard-9-users.mjs --dry-run
 *   node scripts/seed-leaderboard-9-users.mjs --execute
 *   node scripts/seed-leaderboard-9-users.mjs --execute --sa=./service-account.json
 *
 * Environment variables:
 *   FIRESTORE_SA  — path to qingvoca-app service account JSON
 */

import admin from "firebase-admin";

const AVATAR_POOL = [
  { symbol: "🧑‍🎨", backgroundColor: "c0aede" },
  { symbol: "🧑‍🚀", backgroundColor: "b6e3f4" },
  { symbol: "🐼", backgroundColor: "ffd5dc" },
  { symbol: "🦊", backgroundColor: "ffeaa7" },
  { symbol: "🐯", backgroundColor: "d1f4d1" },
  { symbol: "🌵", backgroundColor: "81ecec" },
  { symbol: "🌻", backgroundColor: "fd79a8" },
  { symbol: "🪴", backgroundColor: "a29bfe" },
  { symbol: "🌿", backgroundColor: "fab1a0" },
];

// ---------------------------------------------------------------------------
// 9 users with national identity
// ---------------------------------------------------------------------------

const USERS = [
  // American (2)
  { id: "dummy-us-02", displayName: "James Anderson",   country: "US", seed: "james-anderson" },
  { id: "dummy-us-03", displayName: "Megan Williams",   country: "US", seed: "megan-williams" },

  // British (2)
  { id: "dummy-gb-01", displayName: "Oliver Davies",    country: "GB", seed: "oliver-davies" },
  { id: "dummy-gb-02", displayName: "Charlotte Smith",  country: "GB", seed: "charlotte-smith" },

  // Australian (2)
  { id: "dummy-au-01", displayName: "Jack Thompson",    country: "AU", seed: "jack-thompson" },
  { id: "dummy-au-02", displayName: "Mia O'Brien",      country: "AU", seed: "mia-obrien" },

  // French (2)
  { id: "dummy-fr-02", displayName: "Pierre Lefèvre",   country: "FR", seed: "pierre-lefevre" },
  { id: "dummy-fr-03", displayName: "Camille Moreau",   country: "FR", seed: "camille-moreau" },

  // Vietnamese (1)
  { id: "dummy-vn-02", displayName: "Lê Thị Hương",    country: "VN", seed: "le-thi-huong" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomScore() {
  // 100–1000 in 10-point increments
  return (Math.floor(Math.random() * 91) + 10) * 10;
}

function randomGems() {
  return Math.floor(Math.random() * 30) + 5;
}

function avatarIndex(seed) {
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % AVATAR_POOL.length;
  return hash;
}

function buildPhotoURL(seed) {
  const avatar = AVATAR_POOL[avatarIndex(seed)];
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`,
    `<rect width="120" height="120" rx="60" fill="#${avatar.backgroundColor}"/>`,
    `<circle cx="60" cy="60" r="50" fill="rgba(255,255,255,0.22)"/>`,
    `<text x="60" y="73" text-anchor="middle" font-size="52" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${avatar.symbol}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const mode = args.includes("--execute") ? "execute" : "dry-run";

function parseFlag(name) {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split("=").slice(1).join("=") : undefined;
}

const SA_PATH = parseFlag("sa") ?? process.env.FIRESTORE_SA;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

if (!SA_PATH) {
  console.error("[seed] ERROR: Service account path is required.");
  console.error("  Set FIRESTORE_SA or pass --sa=./service-account.json");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Initialize Firebase Admin
// ---------------------------------------------------------------------------

admin.initializeApp({ credential: admin.credential.cert(SA_PATH) });
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const isDryRun = mode === "dry-run";
  console.log(`\n[seed] Mode: ${mode}`);
  console.log(`[seed] Collection: users`);
  console.log(`[seed] Users to add: ${USERS.length}\n`);

  const batch = db.batch();

  for (const user of USERS) {
    const xp = randomScore();
    const gems = randomGems();
    const data = {
      displayName: user.displayName,
      photoURL: buildPhotoURL(user.seed),
      xp,
      gems,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isDryRun) {
      console.log(`  [dry-run] ${user.id}: ${JSON.stringify({ ...data, createdAt: "<serverTimestamp>" })}`);
    } else {
      batch.set(db.collection("users").doc(user.id), data, { merge: true });
      console.log(`  [write] ${user.id}: ${user.displayName} (${xp} XP, ${gems} gems)`);
    }
  }

  if (!isDryRun) {
    await batch.commit();
    console.log(`\n[seed] ✓ ${USERS.length} users written to Firestore.`);
  } else {
    console.log(`\n[seed] Dry-run complete. Re-run with --execute to write.`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("[seed] Fatal error:", error);
  process.exitCode = 1;
});
