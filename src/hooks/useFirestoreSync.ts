"use client";

import { useCallback, useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { deleteDoc, doc, increment, runTransaction, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import type { UserStats } from "@/contexts/GamificationContext";
import { db } from "@/lib/firebase";
import { canUseFirestore, markFirestoreFailure, markFirestoreSuccess } from "@/utils/firestoreAvailability";
import { readSyncQueue, writeSyncQueue, type SyncQueueItem } from "@/utils/firestoreSyncQueue";

const GLOBAL_MISTAKES_COLLECTION = "zhGlobalMistakes";
const MAX_GLOBAL_MISTAKES_PER_FLUSH = 20;
const MAX_ADMIN_WRITES_PER_FLUSH = 20;

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mergeMistakes(local: Record<string, number>, remoteInput: unknown) {
  const remote = remoteInput && typeof remoteInput === "object" ? (remoteInput as Record<string, unknown>) : {};
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const mistakes: Record<string, number> = {};
  keys.forEach((key) => {
    mistakes[key] = Math.max(local[key] ?? 0, getNumber(remote[key]));
  });
  return mistakes;
}

function mergeQueuedUserStats(payload: UserStats, remoteInput: Record<string, unknown>): UserStats {
  return {
    ...payload,
    xp: Math.max(payload.xp, getNumber(remoteInput.xp)),
    gems: Math.max(payload.gems, getNumber(remoteInput.gems)),
    streak: Math.max(payload.streak, getNumber(remoteInput.streak)),
    completedUnits: Array.from(new Set([...getStringArray(remoteInput.completedUnits), ...payload.completedUnits])),
    masteredUnits: Array.from(new Set([...getStringArray(remoteInput.masteredUnits), ...payload.masteredUnits])),
    mistakes: mergeMistakes(payload.mistakes, remoteInput.mistakes),
    unitStats:
      remoteInput.unitStats && typeof remoteInput.unitStats === "object"
        ? { ...(remoteInput.unitStats as UserStats["unitStats"]), ...payload.unitStats }
        : payload.unitStats,
  };
}

export function useFirestoreSync(user: User | null, enabled: boolean, onRemoteUserStats?: (stats: UserStats) => void) {
  const isFlushingRef = useRef(false);

  const flushFirestoreQueue = useCallback(async () => {
    const firestore = db;
    if (!enabled || !user || !firestore || isFlushingRef.current || !canUseFirestore()) return;

    const queue = readSyncQueue();
    if (queue.length === 0) return;

    isFlushingRef.current = true;
    const remaining: SyncQueueItem[] = [];
    let globalWrites = 0;
    let adminWrites = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];
      try {
        if (item.type === "userStats") {
          if (item.userId !== user.uid) {
            remaining.push(item);
            continue;
          }
          const userRef = doc(firestore, "users", user.uid);
          const mergedStats = await runTransaction(firestore, async (transaction) => {
            const snapshot = await transaction.get(userRef);
            const remoteData = snapshot.exists() ? snapshot.data() : {};
            const nextStats = mergeQueuedUserStats(item.payload, remoteData);
            transaction.set(
              userRef,
              {
                ...nextStats,
                displayName: user.displayName || nextStats.displayName || "QingVoca Learner",
                photoURL: user.photoURL ?? null,
                email: user.email ?? null,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
            return nextStats;
          });
          onRemoteUserStats?.(mergedStats);
          continue;
        }

        if (item.type === "globalMistakeDelta") {
          if (globalWrites >= MAX_GLOBAL_MISTAKES_PER_FLUSH) {
            remaining.push(item);
            continue;
          }
          globalWrites += 1;
          await setDoc(
            doc(firestore, GLOBAL_MISTAKES_COLLECTION, item.wordKey),
            {
              count: increment(item.delta),
              word: item.word,
              wordKey: item.wordKey,
              ...item.metadata,
              language: "zh",
              datasetVersion: "zh-HSK4-v1",
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
          continue;
        }

        if (item.type === "adminOverride") {
          if (adminWrites >= MAX_ADMIN_WRITES_PER_FLUSH) {
            remaining.push(item);
            continue;
          }
          adminWrites += 1;
          await setDoc(
            doc(firestore, "adminVocabOverrides", item.entryId),
            { ...item.patch, updatedAt: serverTimestamp() },
            { merge: true },
          );
          continue;
        }

        if (item.type === "adminOverrideDelete") {
          if (adminWrites >= MAX_ADMIN_WRITES_PER_FLUSH) {
            remaining.push(item);
            continue;
          }
          adminWrites += 1;
          await deleteDoc(doc(firestore, "adminVocabOverrides", item.entryId));
          continue;
        }

        if (item.type === "adminDeletedWords") {
          const wordKeys = item.wordKeys.slice(0, Math.max(0, MAX_ADMIN_WRITES_PER_FLUSH - adminWrites));
          if (wordKeys.length === 0) {
            remaining.push(item);
            continue;
          }

          const batch = writeBatch(firestore);
          wordKeys.forEach((wordKey, index) => {
            batch.set(doc(firestore, "adminDeletedWords", wordKey), {
              entryId: item.entryIds[index],
              word: item.words[index],
              deletedAt: serverTimestamp(),
            });
          });
          await batch.commit();
          adminWrites += wordKeys.length;

          if (wordKeys.length < item.wordKeys.length) {
            remaining.push({
              ...item,
              entryIds: item.entryIds.slice(wordKeys.length),
              wordKeys: item.wordKeys.slice(wordKeys.length),
              words: item.words.slice(wordKeys.length),
            });
          }
        }
      } catch (error) {
        markFirestoreFailure(error);
        remaining.push({ ...item, attempts: item.attempts + 1 });
        remaining.push(...queue.slice(index + 1));
        writeSyncQueue(remaining);
        isFlushingRef.current = false;
        return;
      }
    }

    writeSyncQueue(remaining);
    markFirestoreSuccess();
    isFlushingRef.current = false;
  }, [enabled, onRemoteUserStats, user]);

  const flushOrPruneFirestoreQueue = useCallback(async () => {
    if (!user) {
      writeSyncQueue(readSyncQueue().filter((item) => item.type !== "userStats"));
      return;
    }
    await flushFirestoreQueue();
  }, [flushFirestoreQueue, user]);

  useEffect(() => {
    if (!enabled || !user) return undefined;

    const flushSoon = () => {
      window.setTimeout(() => {
        void flushFirestoreQueue();
      }, 0);
    };

    const intervalId = window.setInterval(flushSoon, 5 * 60 * 1000);
    const onOnline = () => flushSoon();
    const onQueueChanged = () => flushSoon();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flushFirestoreQueue();
    };

    flushSoon();
    window.addEventListener("online", onOnline);
    window.addEventListener("qingvoca:firestore-sync-queue-changed", onQueueChanged);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("qingvoca:firestore-sync-queue-changed", onQueueChanged);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, flushFirestoreQueue, user]);

  return { flushFirestoreQueue, flushOrPruneFirestoreQueue };
}
