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

// ---------------------------------------------------------------------------
// 9 users with national identity
// ---------------------------------------------------------------------------

const USERS = [
  // American (2)
  { id: "dummy-us-02", displayName: "James Anderson",   country: "US", seed: "james-anderson",   backgroundColor: "c0aede" },
  { id: "dummy-us-03", displayName: "Megan Williams",   country: "US", seed: "megan-williams",   backgroundColor: "b6e3f4" },

  // British (2)
  { id: "dummy-gb-01", displayName: "Oliver Davies",    country: "GB", seed: "oliver-davies",    backgroundColor: "ffd5dc" },
  { id: "dummy-gb-02", displayName: "Charlotte Smith",  country: "GB", seed: "charlotte-smith",  backgroundColor: "ffeaa7" },

  // Australian (2)
  { id: "dummy-au-01", displayName: "Jack Thompson",    country: "AU", seed: "jack-thompson",    backgroundColor: "d1f4d1" },
  { id: "dummy-au-02", displayName: "Mia O'Brien",      country: "AU", seed: "mia-obrien",       backgroundColor: "81ecec" },

  // French (2)
  { id: "dummy-fr-02", displayName: "Pierre Lefèvre",   country: "FR", seed: "pierre-lefevre",   backgroundColor: "fd79a8" },
  { id: "dummy-fr-03", displayName: "Camille Moreau",   country: "FR", seed: "camille-moreau",   backgroundColor: "a29bfe" },

  // Vietnamese (1)
  { id: "dummy-vn-02", displayName: "Lê Thị Hương",    country: "VN", seed: "le-thi-huong",     backgroundColor: "fab1a0" },
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

function buildPhotoURL(seed, bg) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${bg}`;
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
      photoURL: buildPhotoURL(user.seed, user.backgroundColor),
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
