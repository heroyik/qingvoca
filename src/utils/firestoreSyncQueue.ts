import type { UserStats, VocabOverridePatch } from "@/contexts/GamificationContext";

export const FIRESTORE_SYNC_QUEUE_KEY = "qingvoca:firestore:sync-queue";

export type GlobalMistakeDeltaMetadata = {
  wordId?: string;
  pinyin?: string;
  meaning?: string;
  translations?: Record<string, string | undefined>;
  hsk?: string;
  lessonId?: number;
  step?: number;
};

export type SyncQueueItem =
  | {
      id: string;
      type: "userStats";
      userId: string;
      payload: UserStats;
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "adminOverride";
      entryId: string;
      patch: VocabOverridePatch;
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "adminOverrideDelete";
      entryId: string;
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "adminDeletedWords";
      entryIds: string[];
      wordKeys: string[];
      words: string[];
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "globalMistakeDelta";
      wordKey: string;
      word: string;
      delta: number;
      metadata: GlobalMistakeDeltaMetadata;
      updatedAt: number;
      attempts: number;
    };

function storageAvailable() {
  return typeof window !== "undefined";
}

function readRawQueue(): SyncQueueItem[] {
  if (!storageAvailable()) return [];
  try {
    const saved = window.localStorage.getItem(FIRESTORE_SYNC_QUEUE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? (parsed as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

export function compactSyncQueue(queue: SyncQueueItem[]) {
  const compacted: SyncQueueItem[] = [];

  for (const item of queue) {
    if (item.type === "userStats") {
      const existingIndex = compacted.findIndex((candidate) => candidate.type === "userStats" && candidate.userId === item.userId);
      if (existingIndex >= 0) compacted[existingIndex] = { ...item, attempts: compacted[existingIndex].attempts };
      else compacted.push(item);
      continue;
    }

    if (item.type === "globalMistakeDelta") {
      const existing = compacted.find((candidate): candidate is Extract<SyncQueueItem, { type: "globalMistakeDelta" }> =>
        candidate.type === "globalMistakeDelta" && candidate.wordKey === item.wordKey,
      );
      if (existing) {
        existing.delta += item.delta;
        existing.updatedAt = item.updatedAt;
        existing.metadata = { ...existing.metadata, ...item.metadata };
      } else {
        compacted.push(item);
      }
      continue;
    }

    if (item.type === "adminOverride") {
      for (let index = compacted.length - 1; index >= 0; index -= 1) {
        const candidate = compacted[index];
        if (
          (candidate.type === "adminOverride" || candidate.type === "adminOverrideDelete") &&
          candidate.entryId === item.entryId
        ) {
          compacted.splice(index, 1);
        }
      }
      compacted.push(item);
      continue;
    }

    if (item.type === "adminOverrideDelete") {
      for (let index = compacted.length - 1; index >= 0; index -= 1) {
        const candidate = compacted[index];
        if (
          (candidate.type === "adminOverride" || candidate.type === "adminOverrideDelete") &&
          candidate.entryId === item.entryId
        ) {
          compacted.splice(index, 1);
        }
      }
      compacted.push(item);
      continue;
    }

    if (item.type === "adminDeletedWords") {
      const existing = compacted.find((candidate): candidate is Extract<SyncQueueItem, { type: "adminDeletedWords" }> =>
        candidate.type === "adminDeletedWords",
      );
      if (existing) {
        const byWordKey = new Map<string, { entryId: string; word: string }>();
        existing.wordKeys.forEach((wordKey, index) => {
          byWordKey.set(wordKey, { entryId: existing.entryIds[index] ?? wordKey, word: existing.words[index] ?? wordKey });
        });
        item.wordKeys.forEach((wordKey, index) => {
          byWordKey.set(wordKey, { entryId: item.entryIds[index] ?? wordKey, word: item.words[index] ?? wordKey });
        });
        existing.wordKeys = Array.from(byWordKey.keys());
        existing.entryIds = existing.wordKeys.map((wordKey) => byWordKey.get(wordKey)?.entryId ?? wordKey);
        existing.words = existing.wordKeys.map((wordKey) => byWordKey.get(wordKey)?.word ?? wordKey);
        existing.updatedAt = item.updatedAt;
      } else {
        compacted.push(item);
      }
    }
  }

  return compacted;
}

export function readSyncQueue() {
  return compactSyncQueue(readRawQueue());
}

export function writeSyncQueue(queue: SyncQueueItem[]) {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(FIRESTORE_SYNC_QUEUE_KEY, JSON.stringify(compactSyncQueue(queue)));
    window.dispatchEvent(new CustomEvent("qingvoca:firestore-sync-queue-changed"));
  } catch {}
}

export function removeUserScopedQueueItemsWithoutUser() {
  const queue = readSyncQueue();
  writeSyncQueue(queue.filter((item) => item.type !== "userStats"));
}

function enqueue(item: SyncQueueItem) {
  writeSyncQueue([...readSyncQueue(), item]);
}

export function enqueueUserStats(userId: string, payload: UserStats) {
  enqueue({ id: `userStats:${userId}`, type: "userStats", userId, payload, updatedAt: Date.now(), attempts: 0 });
}

export function enqueueGlobalMistakeDelta(wordKey: string, word: string, metadata: GlobalMistakeDeltaMetadata, delta = 1) {
  enqueue({
    id: `globalMistakeDelta:${wordKey}`,
    type: "globalMistakeDelta",
    wordKey,
    word,
    delta,
    metadata,
    updatedAt: Date.now(),
    attempts: 0,
  });
}

export function enqueueAdminOverride(entryId: string, patch: VocabOverridePatch) {
  enqueue({ id: `adminOverride:${entryId}`, type: "adminOverride", entryId, patch, updatedAt: Date.now(), attempts: 0 });
}

export function enqueueAdminOverrideDelete(entryId: string) {
  enqueue({ id: `adminOverrideDelete:${entryId}`, type: "adminOverrideDelete", entryId, updatedAt: Date.now(), attempts: 0 });
}

export function enqueueAdminDeletedWords(entryIds: string[], wordKeys: string[], words: string[]) {
  enqueue({
    id: `adminDeletedWords:${Date.now()}`,
    type: "adminDeletedWords",
    entryIds,
    wordKeys,
    words,
    updatedAt: Date.now(),
    attempts: 0,
  });
}

export function getQueueSummary() {
  const queue = readSyncQueue();
  return {
    total: queue.length,
    userStats: queue.filter((item) => item.type === "userStats").length,
    globalMistakeDelta: queue.filter((item) => item.type === "globalMistakeDelta").length,
    admin: queue.filter((item) => item.type.startsWith("admin")).length,
  };
}
