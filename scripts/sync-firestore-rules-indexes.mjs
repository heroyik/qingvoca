#!/usr/bin/env node

/**
 * Firestore Rules & Indexes: Export from kamivoca-app → Deploy to qingvoca-app
 *
 * Usage:
 *   node scripts/sync-firestore-rules-indexes.mjs --export-only
 *   node scripts/sync-firestore-rules-indexes.mjs --deploy-only
 *   node scripts/sync-firestore-rules-indexes.mjs                (export + deploy)
 *
 * Prerequisites:
 *   - Firebase CLI installed and authenticated (firebase login)
 *   - firebase.json in project root
 *
 * Note:
 *   - Indexes are exported via firebase CLI (firebase firestore:indexes)
 *   - Rules must be copied manually from Firebase Console because
 *     the Firebase CLI does not support exporting rules.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SOURCE_PROJECT = "kamivoca-app";
const TARGET_PROJECT = "qingvoca-app";
const RULES_FILE = "firestore.rules";
const INDEXES_FILE = "firestore.indexes.json";

const args = process.argv.slice(2);
const exportOnly = args.includes("--export-only");
const deployOnly = args.includes("--deploy-only");

function firebase(projectId, command) {
  try {
    return execSync(`firebase --project ${projectId} ${command}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const stderr = error.stderr || "";
    const stdout = error.stdout || "";
    const msg = stderr || stdout || error.message;
    console.error(`[rules-sync] Firebase CLI error: ${msg}`);
    process.exit(1);
  }
}

// --- Export ---

function exportIndexes() {
  console.log(`[rules-sync] Exporting Firestore indexes from ${SOURCE_PROJECT}...`);
  try {
    // firebase firestore:indexes outputs JSON by default (without --pretty)
    const json = firebase(SOURCE_PROJECT, "firestore:indexes");
    const parsed = JSON.parse(json);
    writeFileSync(INDEXES_FILE, JSON.stringify(parsed, null, 2) + "\n");
    const count = parsed.indexes?.length ?? 0;
    console.log(`[rules-sync]   → Saved ${INDEXES_FILE} (${count} indexes, ${parsed.fieldOverrides?.length ?? 0} field overrides)`);
  } catch (error) {
    console.error(`[rules-sync]   → Failed to export indexes: ${error.message}`);
    console.log(`[rules-sync]   → Writing empty indexes file as fallback.`);
    writeFileSync(INDEXES_FILE, JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2) + "\n");
  }
}

function exportRules() {
  console.log(`[rules-sync] Firestore rules export:`);
  console.log(`[rules-sync]   Firebase CLI does not support exporting rules.`);
  console.log(`[rules-sync]   Please manually copy rules from kamivoca-app Console:`);
  console.log(`[rules-sync]   1. Open https://console.firebase.google.com/project/${SOURCE_PROJECT}/firestore/rules`);
  console.log(`[rules-sync]   2. Copy the rules content`);
  console.log(`[rules-sync]   3. Paste into ${RULES_FILE} in this project`);
  console.log(`[rules-sync]   (If ${RULES_FILE} already exists, it will be preserved)`);

  if (!existsSync(RULES_FILE)) {
    // Write a placeholder with test mode rules
    writeFileSync(RULES_FILE, `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`);
    console.log(`[rules-sync]   → Created placeholder ${RULES_FILE} with test mode rules.`);
  }
}

// --- Deploy ---

function deployRules() {
  if (!existsSync(RULES_FILE)) {
    console.error(`[rules-sync] ${RULES_FILE} not found. Copy rules from Console first.`);
    process.exit(1);
  }
  console.log(`[rules-sync] Deploying rules to ${TARGET_PROJECT}...`);
  firebase(TARGET_PROJECT, "deploy --only firestore:rules");
  console.log(`[rules-sync]   → Rules deployed ✓`);
}

function deployIndexes() {
  if (!existsSync(INDEXES_FILE)) {
    console.error(`[rules-sync] ${INDEXES_FILE} not found. Run export first.`);
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(INDEXES_FILE, "utf8"));
  if (!parsed.indexes || parsed.indexes.length === 0) {
    console.log(`[rules-sync]   → No indexes to deploy (empty). Skipping.`);
    return;
  }
  console.log(`[rules-sync] Deploying indexes to ${TARGET_PROJECT}...`);
  firebase(TARGET_PROJECT, "deploy --only firestore:indexes");
  console.log(`[rules-sync]   → Indexes deployed ✓`);
}

// --- Main ---

console.log(`[rules-sync] Firestore rules & indexes sync`);
console.log(`[rules-sync] Source: ${SOURCE_PROJECT} → Target: ${TARGET_PROJECT}`);
console.log(`[rules-sync] Mode: ${exportOnly ? "export-only" : deployOnly ? "deploy-only" : "export + deploy"}\n`);

if (!deployOnly) {
  exportIndexes();
  exportRules();
}

if (!exportOnly) {
  deployRules();
  deployIndexes();
}

console.log(`\n[rules-sync] Done.`);
