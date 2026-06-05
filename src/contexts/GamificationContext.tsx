"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import vocabData from "@/data/vocab.json";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import { applyAdminEdit, type AdminEditPatch } from "@/utils/adminEdit";
import { filterDeletedWords, normalizeVocabWordKey } from "@/utils/vocab";

export type UserSettings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  unlockAllLevels: boolean;
  showPinyin: boolean;
};

export type UnitProgress = {
  attempts: number;
  failedWords: number;
  isMastered: boolean;
};

export type UserStats = {
  xp: number;
  gems: number;
  streak: number;
  lastStudyDate: string | null;
  completedUnits: string[];
  masteredUnits: string[];
  mistakes: Record<string, number>;
  unitStats: Record<string, UnitProgress>;
  settings: UserSettings;
  displayName: string;
};

export type VocabOverridePatch = Omit<AdminEditPatch, "id">;

type GamificationContextValue = {
  user: User | null;
  vocabEntries: ChineseVocabEntry[];
  globalDeletedWordKeys: string[];
  stats: UserStats;
  isInitialized: boolean;
  isAuthResolved: boolean;
  isOnline: boolean;
  isOfflineMode: boolean;
  isOfflineModeBlocked: boolean;
  addXP: (amount: number) => void;
  addGem: (amount: number) => void;
  completeUnit: (unitId: string, failedWords: number, isMastered: boolean) => void;
  unlockProgress: (unitId: string) => void;
  recordMistake: (wordId: string) => void;
  addMistake: (wordId: string) => void;
  clearMistake: (wordId: string) => void;
  removeMistake: (wordId: string) => void;
  clearAllMistakes: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProfile: (profile: { displayName?: string }) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  deleteWordsGlobally: (entryIds: string[]) => Promise<void>;
  saveVocabOverride: (entryId: string, patch: VocabOverridePatch) => Promise<void>;
  clearVocabOverride: (entryId: string) => Promise<void>;
  resetProgress: () => void;
  resetLocalState: () => void;
};

const STORAGE_KEY = "qingvoca:zh:progress";
const OVERRIDES_STORAGE_KEY = "qingvoca:zh:vocab-overrides";
const DELETED_STORAGE_KEY = "qingvoca:zh:deleted-word-keys";
const DAY_MS = 24 * 60 * 60 * 1000;
const baseVocabEntries = vocabData.data as ChineseVocabEntry[];

const defaultStats: UserStats = {
  xp: 0,
  gems: 0,
  streak: 0,
  lastStudyDate: null,
  completedUnits: [],
  masteredUnits: [],
  mistakes: {},
  unitStats: {},
  settings: {
    soundEnabled: true,
    hapticsEnabled: true,
    unlockAllLevels: false,
    showPinyin: true,
  },
  displayName: "QingVoca Learner",
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function nextStreak(lastStudyDate: string | null) {
  const today = todayKey();
  if (lastStudyDate === today) return null;
  if (!lastStudyDate) return 1;

  const last = new Date(`${lastStudyDate}T00:00:00.000Z`).getTime();
  const current = new Date(`${today}T00:00:00.000Z`).getTime();
  return current - last <= DAY_MS ? undefined : 1;
}

function withStudyDay(stats: UserStats): UserStats {
  const streak = nextStreak(stats.lastStudyDate);
  if (streak === null) return stats;

  return {
    ...stats,
    streak: streak ?? stats.streak + 1,
    lastStudyDate: todayKey(),
  };
}

function mergeStats(input: unknown): UserStats {
  if (!input || typeof input !== "object") return defaultStats;
  const saved = input as Partial<UserStats>;

  return {
    ...defaultStats,
    ...saved,
    completedUnits: Array.isArray(saved.completedUnits) ? saved.completedUnits : [],
    masteredUnits: Array.isArray(saved.masteredUnits) ? saved.masteredUnits : [],
    mistakes: saved.mistakes && typeof saved.mistakes === "object" ? saved.mistakes : {},
    unitStats: saved.unitStats && typeof saved.unitStats === "object" ? saved.unitStats : {},
    settings: {
      ...defaultStats.settings,
      ...(saved.settings ?? {}),
    },
  };
}

function statsSignature(stats: UserStats): string {
  return JSON.stringify(stats);
}

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function sanitizePatch(entryId: string, patch: VocabOverridePatch): AdminEditPatch {
  const sanitized: AdminEditPatch = { id: entryId };
  if (typeof patch.word === "string") sanitized.word = patch.word.trim();
  if (typeof patch.pinyin === "string") sanitized.pinyin = patch.pinyin.trim();
  if (typeof patch.meaning === "string") sanitized.meaning = patch.meaning.trim();
  if (patch.translations) {
    sanitized.translations = {
      ko: patch.translations.ko?.trim(),
      ja: patch.translations.ja?.trim(),
      en: patch.translations.en?.trim(),
    };
  }
  if (typeof patch.pos === "string") sanitized.pos = patch.pos.trim();
  if (typeof patch.partOfSpeech === "string") sanitized.partOfSpeech = patch.partOfSpeech.trim();
  if (typeof patch.lessonId === "number") sanitized.lessonId = patch.lessonId;
  if (typeof patch.step === "number") sanitized.step = patch.step;
  if (typeof patch.level === "number") sanitized.level = patch.level;
  if (Array.isArray(patch.example)) sanitized.example = patch.example.map((item) => item.trim()).filter(Boolean);
  return sanitized;
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(!auth);
  const [hasRemoteStats, setHasRemoteStats] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [vocabOverrides, setVocabOverrides] = useState<Record<string, AdminEditPatch>>(() =>
    readJsonStorage<Record<string, AdminEditPatch>>(OVERRIDES_STORAGE_KEY, {}),
  );
  const [globalDeletedWordKeys, setGlobalDeletedWordKeys] = useState<string[]>(() =>
    readJsonStorage<string[]>(DELETED_STORAGE_KEY, []),
  );
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window === "undefined") return defaultStats;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? mergeStats(JSON.parse(saved)) : defaultStats;
    } catch {
      return defaultStats;
    }
  });
  const isInitialized = true;

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) setHasRemoteStats(false);
      setIsAuthResolved(true);
    });
  }, []);

  useEffect(() => {
    const syncOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [isInitialized, stats]);

  useEffect(() => {
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(vocabOverrides));
  }, [vocabOverrides]);

  useEffect(() => {
    window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(globalDeletedWordKeys));
  }, [globalDeletedWordKeys]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !user) return undefined;

    const userRef = doc(firestore, "users", user.uid);
    return onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHasRemoteStats(false);
        return;
      }

      setHasRemoteStats(true);
      setStats((current) => {
        const next = mergeStats({ ...current, ...snapshot.data() });
        return statsSignature(next) === statsSignature(current) ? current : next;
      });
    });
  }, [user]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !user || !isAuthResolved) return;

    const userRef = doc(firestore, "users", user.uid);
    const payload: Record<string, unknown> = {
      ...stats,
      displayName: stats.displayName || user.displayName || "QingVoca Learner",
      photoURL: user.photoURL ?? null,
      email: user.email ?? null,
      updatedAt: serverTimestamp(),
    };
    if (!hasRemoteStats) payload.createdAt = serverTimestamp();

    void setDoc(userRef, payload, { merge: true });
  }, [hasRemoteStats, isAuthResolved, stats, user]);

  useEffect(() => {
    const firestore = db;
    if (!firestore) return undefined;

    const overridesUnsubscribe = onSnapshot(collection(firestore, "adminVocabOverrides"), (snapshot) => {
      setVocabOverrides((current) => {
        const next: Record<string, AdminEditPatch> = {};
        snapshot.docs.forEach((documentSnapshot) => {
          next[documentSnapshot.id] = sanitizePatch(documentSnapshot.id, documentSnapshot.data());
        });
        return JSON.stringify(next) === JSON.stringify(current) ? current : next;
      });
    });

    const deletedUnsubscribe = onSnapshot(collection(firestore, "adminDeletedWords"), (snapshot) => {
      setGlobalDeletedWordKeys((current) => {
        const next = snapshot.docs.map((documentSnapshot) => documentSnapshot.id).sort();
        return JSON.stringify(next) === JSON.stringify([...current].sort()) ? current : next;
      });
    });

    return () => {
      overridesUnsubscribe();
      deletedUnsubscribe();
    };
  }, []);

  const vocabEntries = useMemo(() => {
    const editedEntries = baseVocabEntries.map((entry) => {
      const patch = vocabOverrides[entry.id];
      return patch ? applyAdminEdit(entry, patch) : entry;
    });
    return filterDeletedWords(editedEntries, globalDeletedWordKeys);
  }, [globalDeletedWordKeys, vocabOverrides]);

  const updateStats = useCallback((updater: (current: UserStats) => UserStats) => {
    setStats((current) => updater(withStudyDay(current)));
  }, []);

  const addXP = useCallback(
    (amount: number) => updateStats((current) => ({ ...current, xp: Math.max(0, current.xp + amount) })),
    [updateStats],
  );

  const addGem = useCallback(
    (amount: number) => updateStats((current) => ({ ...current, gems: Math.max(0, current.gems + amount) })),
    [updateStats],
  );

  const completeUnit = useCallback(
    (unitId: string, failedWords: number, isMastered: boolean) => {
      updateStats((current) => {
        const completedUnits = current.completedUnits.includes(unitId)
          ? current.completedUnits
          : [...current.completedUnits, unitId];
        const masteredUnits =
          isMastered && !current.masteredUnits.includes(unitId)
            ? [...current.masteredUnits, unitId]
            : current.masteredUnits;

        return {
          ...current,
          completedUnits,
          masteredUnits,
          unitStats: {
            ...current.unitStats,
            [unitId]: {
              attempts: (current.unitStats[unitId]?.attempts ?? 0) + 1,
              failedWords,
              isMastered,
            },
          },
        };
      });
    },
    [updateStats],
  );

  const unlockProgress = useCallback(
    (unitId: string) => {
      updateStats((current) => ({
        ...current,
        completedUnits: current.completedUnits.includes(unitId)
          ? current.completedUnits
          : [...current.completedUnits, unitId],
      }));
    },
    [updateStats],
  );

  const recordMistake = useCallback(
    (wordId: string) => {
      const key = normalizeVocabWordKey(wordId);
      updateStats((current) => ({
        ...current,
        mistakes: {
          ...current.mistakes,
          [key]: (current.mistakes[key] ?? 0) + 1,
        },
      }));
    },
    [updateStats],
  );

  const clearMistake = useCallback(
    (wordId: string) => {
      const key = normalizeVocabWordKey(wordId);
      updateStats((current) => {
        const mistakes = { ...current.mistakes };
        delete mistakes[key];
        return { ...current, mistakes };
      });
    },
    [updateStats],
  );

  const clearAllMistakes = useCallback(() => {
    updateStats((current) => ({ ...current, mistakes: {} }));
  }, [updateStats]);

  const updateSettings = useCallback(
    (settings: Partial<UserSettings>) => {
      updateStats((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
    },
    [updateStats],
  );

  const updateProfile = useCallback(
    (profile: { displayName?: string }) => {
      updateStats((current) => ({
        ...current,
        displayName: profile.displayName?.trim() || current.displayName,
      }));
    },
    [updateStats],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) return;
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const saveVocabOverride = useCallback(async (entryId: string, patch: VocabOverridePatch) => {
    const sanitized = sanitizePatch(entryId, patch);
    setVocabOverrides((current) => ({ ...current, [entryId]: sanitized }));

    const firestore = db;
    if (firestore) {
      await setDoc(
        doc(firestore, "adminVocabOverrides", entryId),
        {
          ...sanitized,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  }, []);

  const clearVocabOverride = useCallback(async (entryId: string) => {
    setVocabOverrides((current) => {
      const next = { ...current };
      delete next[entryId];
      return next;
    });

    const firestore = db;
    if (firestore) await deleteDoc(doc(firestore, "adminVocabOverrides", entryId));
  }, []);

  const deleteWordsGlobally = useCallback(
    async (entryIds: string[]) => {
      const selectedEntries = vocabEntries.filter((entry) => entryIds.includes(entry.id));
      const nextKeys = selectedEntries.map((entry) => normalizeVocabWordKey(entry.word));

      setGlobalDeletedWordKeys((current) => Array.from(new Set([...current, ...nextKeys])).sort());

      const firestore = db;
      if (firestore) {
        const batch = writeBatch(firestore);
        selectedEntries.forEach((entry) => {
          batch.set(doc(firestore, "adminDeletedWords", normalizeVocabWordKey(entry.word)), {
            entryId: entry.id,
            word: entry.word,
            deletedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    },
    [vocabEntries],
  );

  const resetProgress = useCallback(() => setStats(defaultStats), []);
  const resetLocalState = resetProgress;

  const value = useMemo<GamificationContextValue>(
    () => ({
      user,
      vocabEntries,
      globalDeletedWordKeys,
      stats,
      isInitialized,
      isAuthResolved,
      isOnline,
      isOfflineMode: !isOnline || !isFirebaseConfigured,
      isOfflineModeBlocked: false,
      addXP,
      addGem,
      completeUnit,
      unlockProgress,
      recordMistake,
      addMistake: recordMistake,
      clearMistake,
      removeMistake: clearMistake,
      clearAllMistakes,
      updateSettings,
      updateProfile,
      signInWithGoogle,
      signOutUser,
      deleteWordsGlobally,
      saveVocabOverride,
      clearVocabOverride,
      resetProgress,
      resetLocalState,
    }),
    [
      addGem,
      addXP,
      clearAllMistakes,
      clearMistake,
      completeUnit,
      clearVocabOverride,
      deleteWordsGlobally,
      globalDeletedWordKeys,
      isOnline,
      isInitialized,
      isAuthResolved,
      recordMistake,
      resetLocalState,
      resetProgress,
      signInWithGoogle,
      signOutUser,
      saveVocabOverride,
      stats,
      unlockProgress,
      updateProfile,
      updateSettings,
      user,
      vocabEntries,
    ],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used inside GamificationProvider");
  return context;
}
