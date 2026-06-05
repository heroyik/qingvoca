#!/usr/bin/env node

/**
 * Firestore Data Migration: kamivoca-app → qingvoca-app
 *
 * Copies Firestore collections from the source (kamivoca-app) to the target (qingvoca-app).
 * Uses firebase-admin with two named app instances to connect to both projects.
 *
 * Prerequisites:
 *   1. Two service account JSON files:
 *      - Service account for kamivoca-app (source)
 *      - Service account for qingvoca-app (target)
 *   2. Both Firestore databases must exist.
 *
 * Usage:
 *   node scripts/migrate-firestore-to-qingvoca.mjs --dry-run
 *   node scripts/migrate-firestore-to-qingvoca.mjs --execute
 *
 * Environment variables (or pass paths via flags):
 *   FIRESTORE_SOURCE_SA   — path to kamivoca-app service account JSON
 *   FIRESTORE_TARGET_SA   — path to qingvoca-app service account JSON
 *
 * Flags:
 *   --dry-run             — read source, print summary, no writes (default)
 *   --execute             — read source, write to target, then verify
 *   --source-sa=<path>    — override source service account path
 *   --target-sa=<path>    — override target service account path
 */

import admin from "firebase-admin";

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/** Collections to copy from source → target */
const COPY_COLLECTIONS = ["zhVocabEntries", "zhFullVocaEntries", "zhDatasetMeta", "adminVocabOverrides", "adminDeletedWords"];

// Collections intentionally skipped:
//   users        — UIDs differ between projects; cannot copy
//   zhLeaderboard — Fresh start for new project

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const mode = args.includes("--execute") ? "execute" : "dry-run";

function parseFlag(name) {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split("=").slice(1).join("=") : undefined;
}

const SOURCE_SA_PATH = parseFlag("source-sa") ?? process.env.FIRESTORE_SOURCE_SA;
const TARGET_SA_PATH = parseFlag("target-sa") ?? process.env.FIRESTORE_TARGET_SA;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const errors = [];

if (!SOURCE_SA_PATH) {
  errors.push("Source service account path is required. Set FIRESTORE_SOURCE_SA or --source-sa=<path>");
}
if (!TARGET_SA_PATH) {
  errors.push("Target service account path is required. Set FIRESTORE_TARGET_SA or --target-sa=<path>");
}
if (mode === "execute" && SOURCE_SA_PATH === TARGET_SA_PATH) {
  errors.push("Source and target service accounts must be different");
}

if (errors.length) {
  for (const err of errors) console.error(`[migrate] ERROR: ${err}`);
  console.error("\nUsage:");
  console.error("  node scripts/migrate-firestore-to-qingvoca.mjs --dry-run --source-sa=./sa-source.json --target-sa=./sa-target.json");
  console.error("  node scripts/migrate-firestore-to-qingvoca.mjs --execute --source-sa=./sa-source.json --target-sa=./sa-target.json");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Initialize Firebase Admin apps
// ---------------------------------------------------------------------------

const sourceCredential = admin.credential.cert(SOURCE_SA_PATH);
const targetCredential = admin.credential.cert(TARGET_SA_PATH);

const sourceApp = admin.initializeApp({ credential: sourceCredential }, "source");
const targetApp = admin.initializeApp({ credential: targetCredential }, "target");

const sourceDb = admin.firestore(sourceApp);
const targetDb = admin.firestore(targetApp);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;

/**
 * Read all documents from a Firestore collection.
 * Returns { id, data }[] for every document.
 */
async function readCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

/**
 * Write documents to a Firestore collection using batched writes.
 * Firestore batches support up to 500 operations, so we chunk accordingly.
 */
async function writeCollection(db, collectionName, documents) {
  let totalBatches = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const chunk = documents.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const doc of chunk) {
      const ref = db.collection(collectionName).doc(doc.id);
      batch.set(ref, doc.data);
    }

    await batch.commit();
    totalBatches++;
  }

  return totalBatches;
}

/**
 * Verify that the target collection has the expected document count.
 */
async function verifyCollection(db, collectionName, expectedCount) {
  const snapshot = await db.collection(collectionName).get();
  const actualCount = snapshot.size;
  return { collectionName, expected: expectedCount, actual: actualCount, ok: actualCount === expectedCount };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const isDryRun = mode === "dry-run";
  console.log(`\n[migrate] Mode: ${mode}`);
  console.log(`[migrate] Source: kamivoca-app`);
  console.log(`[migrate] Target: qingvoca-app`);
  console.log(`[migrate] Collections to copy: ${COPY_COLLECTIONS.join(", ")}`);
  console.log(`[migrate] Collections skipped: users, zhLeaderboard\n`);

  const summary = [];

  for (const collectionName of COPY_COLLECTIONS) {
    console.log(`[migrate] Reading "${collectionName}" from source...`);
    const documents = await readCollection(sourceDb, collectionName);
    console.log(`[migrate]   → ${documents.length} documents found`);

    if (isDryRun) {
      summary.push({ collection: collectionName, documents: documents.length, status: "read-only" });
    } else {
      console.log(`[migrate] Writing ${documents.length} documents to target "${collectionName}"...`);
      const batches = await writeCollection(targetDb, collectionName, documents);
      console.log(`[migrate]   → ${batches} batch(es) committed`);

      const verification = await verifyCollection(targetDb, collectionName, documents.length);
      if (verification.ok) {
        console.log(`[migrate]   → ✓ Verified: ${verification.actual} documents`);
        summary.push({ collection: collectionName, documents: documents.length, verified: true, status: "copied" });
      } else {
        console.error(`[migrate]   → ✗ Mismatch: expected ${verification.expected}, got ${verification.actual}`);
        summary.push({ collection: collectionName, documents: documents.length, verified: false, status: "verification-failed" });
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`[migrate] Summary (${mode})`);
  console.log("=".repeat(60));
  console.table(summary.map((s) => ({
    Collection: s.collection,
    Documents: s.documents,
    Status: s.status,
    Verified: s.verified ?? "—",
  })));
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("\n[migrate] Dry-run complete. No data was written.");
    console.log("[migrate] Re-run with --execute to perform the migration.");
  } else {
    const allVerified = summary.every((s) => s.verified === true);
    if (allVerified) {
      console.log("\n[migrate] ✓ Migration complete and verified.");
    } else {
      console.error("\n[migrate] ✗ Migration completed with verification errors.");
      process.exitCode = 1;
    }
  }

  // Cleanup
  await sourceApp.delete();
  await targetApp.delete();
}

main().catch((error) => {
  console.error("[migrate] Fatal error:", error);
  process.exitCode = 1;
});
