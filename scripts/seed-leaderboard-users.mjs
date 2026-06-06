#!/usr/bin/env node

/**
 * Seed 10 dummy users into Firestore's "users" collection for the Leaderboard.
 *
 * Usage:
 *   node scripts/seed-leaderboard-users.mjs --dry-run
 *   node scripts/seed-leaderboard-users.mjs --execute
 *   node scripts/seed-leaderboard-users.mjs --execute --sa=./service-account.json
 *
 * Environment variables:
 *   FIRESTORE_SA  — path to qingvoca-app service account JSON
 */

import admin from "firebase-admin";

function buildDemoAvatar(symbol, background) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`,
    `<defs><radialGradient id="g" cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="42%" stop-color="${background}"/><stop offset="100%" stop-color="${background}" stop-opacity="0.86"/></radialGradient></defs>`,
    `<rect width="120" height="120" fill="url(#g)"/>`,
    `<circle cx="24" cy="24" r="34" fill="rgba(255,255,255,0.18)"/>`,
    `<circle cx="99" cy="101" r="42" fill="rgba(0,0,0,0.08)"/>`,
    `<text x="60" y="83" text-anchor="middle" font-size="76" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${symbol}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Dummy users
// ---------------------------------------------------------------------------

const DUMMY_USERS = [
  {
    id: "dummy-korean-01",
    displayName: "Seo-yeon Kim",
    photoURL: buildDemoAvatar("🧑‍🎓", "#b6e3f4"),
    xp: 4820,
    gems: 320,
    country: "KR",
  },
  {
    id: "dummy-japanese-01",
    displayName: "Haruki Tanaka",
    photoURL: buildDemoAvatar("🐼", "#ffd5dc"),
    xp: 4350,
    gems: 280,
    country: "JP",
  },
  {
    id: "dummy-american-01",
    displayName: "Emily Johnson",
    photoURL: buildDemoAvatar("🌻", "#c0aede"),
    xp: 3980,
    gems: 250,
    country: "US",
  },
  {
    id: "dummy-vietnamese-01",
    displayName: "Minh Anh Nguyen",
    photoURL: buildDemoAvatar("🧑‍💻", "#d1f4d1"),
    xp: 3710,
    gems: 210,
    country: "VN",
  },
  {
    id: "dummy-korean-02",
    displayName: "Ji-hoon Park",
    photoURL: buildDemoAvatar("🦊", "#ffeaa7"),
    xp: 3450,
    gems: 190,
    country: "KR",
  },
  {
    id: "dummy-thai-01",
    displayName: "Siriporn Chaiyaporn",
    photoURL: buildDemoAvatar("🌵", "#fab1a0"),
    xp: 2890,
    gems: 160,
    country: "TH",
  },
  {
    id: "dummy-brazilian-01",
    displayName: "Lucas Silva",
    photoURL: buildDemoAvatar("🧑‍🚀", "#81ecec"),
    xp: 2540,
    gems: 130,
    country: "BR",
  },
  {
    id: "dummy-japanese-02",
    displayName: "Yuki Watanabe",
    photoURL: buildDemoAvatar("🐯", "#a29bfe"),
    xp: 1980,
    gems: 90,
    country: "JP",
  },
  {
    id: "dummy-french-01",
    displayName: "Émilie Dubois",
    photoURL: buildDemoAvatar("🪴", "#fd79a8"),
    xp: 1320,
    gems: 60,
    country: "FR",
  },
  {
    id: "dummy-german-01",
    displayName: "Lukas Müller",
    photoURL: buildDemoAvatar("🐧", "#00cec9"),
    xp: 870,
    gems: 40,
    country: "DE",
  },
];

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
  console.log(`[seed] Users to add: ${DUMMY_USERS.length}\n`);

  const batch = db.batch();

  for (const user of DUMMY_USERS) {
    const ref = db.collection("users").doc(user.id);
    const data = {
      displayName: user.displayName,
      photoURL: user.photoURL,
      xp: user.xp,
      gems: user.gems,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isDryRun) {
      console.log(`  [dry-run] Would set ${user.id}: ${JSON.stringify(data)}`);
    } else {
      batch.set(ref, data, { merge: true });
      console.log(`  [write] ${user.id}: ${user.displayName} (${user.xp} XP)`);
    }
  }

  if (!isDryRun) {
    await batch.commit();
    console.log(`\n[seed] ✓ ${DUMMY_USERS.length} users written to Firestore.`);
  } else {
    console.log(`\n[seed] Dry-run complete. Re-run with --execute to write.`);
  }

  // Let process exit naturally to avoid Firestore connection hang
  process.exit(0);
}

main().catch((error) => {
  console.error("[seed] Fatal error:", error);
  process.exitCode = 1;
});
