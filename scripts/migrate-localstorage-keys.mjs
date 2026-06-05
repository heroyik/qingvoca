/**
 * Browser Console Script: localStorage Key Migration
 *
 * Migrates existing kamivoca:zh:* localStorage data to qingvoca:zh:*
 * so the updated qingvoca app can load previous user progress.
 *
 * Usage:
 *   1. Open the qingvoca app in your browser
 *   2. Open DevTools → Console
 *   3. Paste this entire script and press Enter
 *
 * This script is idempotent — running it multiple times is safe.
 * Existing qingvoca:zh:* keys will NOT be overwritten.
 */

(() => {
  const MIGRATION_MAP = {
    "kamivoca:zh:progress": "qingvoca:zh:progress",
    "kamivoca:zh:review": "qingvoca:zh:review",
    "kamivoca:zh:score": "qingvoca:zh:score",
    "kamivoca:zh:rank": "qingvoca:zh:rank",
    "kamivoca:zh:locale": "qingvoca:zh:locale",
    "kamivoca:zh:vocab-overrides": "qingvoca:zh:vocab-overrides",
    "kamivoca:zh:deleted-word-keys": "qingvoca:zh:deleted-word-keys",
  };

  let migrated = 0;
  let skipped = 0;
  let notFound = 0;

  console.log("🔄 localStorage migration: kamivoca:zh:* → qingvoca:zh:*\n");

  for (const [oldKey, newKey] of Object.entries(MIGRATION_MAP)) {
    const value = localStorage.getItem(oldKey);

    if (value === null) {
      console.log(`  ⏭️  ${oldKey} → not found (skipped)`);
      notFound++;
      continue;
    }

    const existing = localStorage.getItem(newKey);
    if (existing !== null) {
      console.log(`  ⚠️  ${newKey} already exists (skipped, old data preserved)`);
      skipped++;
      continue;
    }

    localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
    console.log(`  ✅  ${oldKey} → ${newKey} (${value.length} chars)`);
    migrated++;
  }

  console.log(`\n📊 Summary: ${migrated} migrated, ${skipped} skipped, ${notFound} not found`);
  console.log("🔄 Migration complete.");
})();
