"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocFromCache, getDocs } from "firebase/firestore";
import vocabData from "@/data/vocab.json";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import { applyAdminEdit, type AdminEditPatch } from "@/utils/adminEdit";
import {
  canUseFirestore,
  markFirestoreFailure,
  markFirestoreRemoteRead,
  readFirestoreSyncState,
  writeFirestoreSyncState,
} from "@/utils/firestoreAvailability";
import {
  enqueueAdminDeletedWords,
  enqueueAdminOverride,
  enqueueAdminOverrideDelete,
  enqueueGlobalMistakeDelta,
  enqueueUserStats,
} from "@/utils/firestoreSyncQueue";
import { filterDeletedWords, normalizeVocabWordKey } from "@/utils/vocab";

export type UserSettings = {
  speechEnabled: boolean;
  soundEffectsEnabled: boolean;
  hapticsEnabled: boolean;
  unlockAllLevels: boolean;
  showPinyin: boolean;
  adminEditEnabled: boolean;
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

type Theme = "light" | "dark";

type GamificationContextValue = {
  user: User | null;
  vocabEntries: ChineseVocabEntry[];
  globalDeletedWordKeys: string[];
  stats: UserStats;
  theme: Theme;
  setTheme: (theme: Theme) => void;
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
  loadAdminVocabData: () => Promise<void>;
  deleteWordsGlobally: (entryIds: string[]) => Promise<void>;
  saveVocabOverride: (entryId: string, patch: VocabOverridePatch) => Promise<void>;
  clearVocabOverride: (entryId: string) => Promise<void>;
  syncNow: () => Promise<void>;
  resetProgress: () => void;
  resetLocalState: () => void;
};

const THEME_STORAGE_KEY = "qingvoca:zh:theme";
const STORAGE_KEY = "qingvoca:zh:progress";
const OVERRIDES_STORAGE_KEY = "qingvoca:zh:vocab-overrides";
const DELETED_STORAGE_KEY = "qingvoca:zh:deleted-word-keys";
const ADMIN_VOCAB_REMOTE_READ_KEY = "qingvoca:admin-vocab:last-remote-read";
const STATS_WRITE_DEBOUNCE_MS = 15000;
const REMOTE_READ_TTL_MS = 30 * 60 * 1000;
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
    speechEnabled: true,
    soundEffectsEnabled: true,
    hapticsEnabled: true,
    unlockAllLevels: false,
    showPinyin: true,
    adminEditEnabled: false,
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
  const saved = input as Record<string, unknown>;
  const savedSettings = saved.settings && typeof saved.settings === "object" ? (saved.settings as Record<string, unknown>) : {};
  const legacySoundEnabled = typeof savedSettings.soundEnabled === "boolean" ? savedSettings.soundEnabled : undefined;

  return {
    ...defaultStats,
    xp: typeof saved.xp === "number" ? saved.xp : defaultStats.xp,
    gems: typeof saved.gems === "number" ? saved.gems : defaultStats.gems,
    streak: typeof saved.streak === "number" ? saved.streak : defaultStats.streak,
    lastStudyDate:
      typeof saved.lastStudyDate === "string" || saved.lastStudyDate === null
        ? (saved.lastStudyDate as string | null)
        : defaultStats.lastStudyDate,
    completedUnits: Array.isArray(saved.completedUnits) ? saved.completedUnits : [],
    masteredUnits: Array.isArray(saved.masteredUnits) ? saved.masteredUnits : [],
    mistakes: saved.mistakes && typeof saved.mistakes === "object" ? (saved.mistakes as Record<string, number>) : {},
    unitStats: saved.unitStats && typeof saved.unitStats === "object" ? (saved.unitStats as Record<string, UnitProgress>) : {},
    settings: {
      ...defaultStats.settings,
      ...savedSettings,
      speechEnabled:
        typeof savedSettings.speechEnabled === "boolean"
          ? savedSettings.speechEnabled
          : legacySoundEnabled ?? defaultStats.settings.speechEnabled,
      soundEffectsEnabled:
        typeof savedSettings.soundEffectsEnabled === "boolean"
          ? savedSettings.soundEffectsEnabled
          : legacySoundEnabled ?? defaultStats.settings.soundEffectsEnabled,
    },
    displayName:
      typeof saved.displayName === "string" ? saved.displayName : defaultStats.displayName,
  };
}

function mergeRemoteStats(localStats: UserStats, remoteInput: unknown): UserStats {
  const remoteStats = mergeStats(remoteInput);
  const mistakeKeys = new Set([...Object.keys(localStats.mistakes), ...Object.keys(remoteStats.mistakes)]);
  const mistakes: Record<string, number> = {};
  mistakeKeys.forEach((key) => {
    mistakes[key] = Math.max(localStats.mistakes[key] ?? 0, remoteStats.mistakes[key] ?? 0);
  });

  return {
    ...localStats,
    xp: Math.max(localStats.xp, remoteStats.xp),
    gems: Math.max(localStats.gems, remoteStats.gems),
    streak: Math.max(localStats.streak, remoteStats.streak),
    lastStudyDate: localStats.lastStudyDate || remoteStats.lastStudyDate,
    completedUnits: Array.from(new Set([...remoteStats.completedUnits, ...localStats.completedUnits])),
    masteredUnits: Array.from(new Set([...remoteStats.masteredUnits, ...localStats.masteredUnits])),
    mistakes,
    unitStats: { ...remoteStats.unitStats, ...localStats.unitStats },
    settings: localStats.settings,
    displayName: localStats.displayName || remoteStats.displayName,
  };
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
  const [isRemoteStatsResolved, setIsRemoteStatsResolved] = useState(false);
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false);
  const [isFirestoreQuotaBlocked, setIsFirestoreQuotaBlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [vocabOverrides, setVocabOverrides] = useState<Record<string, AdminEditPatch>>({});
  const [globalDeletedWordKeys, setGlobalDeletedWordKeys] = useState<string[]>([]);
  const [theme, setThemeState] = useState<Theme>("light");
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const isInitialized = hasLoadedLocalState;
  const hasLoadedAdminVocabDataRef = useRef(false);
  const hasMergedRemoteStatsRef = useRef(false);

  const blockFirestoreQuota = useCallback((error: unknown) => {
    markFirestoreFailure(error);
    setIsFirestoreQuotaBlocked(true);
    return true;
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsFirestoreQuotaBlocked(!canUseFirestore());
      setIsOnline(navigator.onLine);
      setVocabOverrides(readJsonStorage<Record<string, AdminEditPatch>>(OVERRIDES_STORAGE_KEY, {}));
      setGlobalDeletedWordKeys(readJsonStorage<string[]>(DELETED_STORAGE_KEY, []));
      setStats(mergeStats(readJsonStorage<unknown>(STORAGE_KEY, defaultStats)));

      try {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark" || saved === "light") {
          setThemeState(saved);
        } else {
          setThemeState(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        }
      } catch {}

      setHasLoadedLocalState(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsRemoteStatsResolved(true);
      setIsAuthResolved(true);
    });
  }, []);

  useEffect(() => {
    const syncOnlineState = () => {
      setIsOnline(navigator.onLine);
      setIsFirestoreQuotaBlocked(!canUseFirestore());
    };
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalState) return;
    if (!isInitialized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [hasLoadedLocalState, isInitialized, stats]);

  useEffect(() => {
    if (!hasLoadedLocalState) return;
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(vocabOverrides));
  }, [hasLoadedLocalState, vocabOverrides]);

  useEffect(() => {
    if (!hasLoadedLocalState) return;
    window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(globalDeletedWordKeys));
  }, [globalDeletedWordKeys, hasLoadedLocalState]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (!user || !isAuthResolved || !isRemoteStatsResolved) return undefined;

    const timeoutId = window.setTimeout(() => {
      enqueueUserStats(user.uid, stats);
    }, STATS_WRITE_DEBOUNCE_MS);
    const flushOnHide = () => {
      if (document.visibilityState === "hidden") enqueueUserStats(user.uid, stats);
    };

    document.addEventListener("visibilitychange", flushOnHide);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", flushOnHide);
    };
  }, [isAuthResolved, isRemoteStatsResolved, stats, user]);

  const { flushOrPruneFirestoreQueue } = useFirestoreSync(user, isAuthResolved && isRemoteStatsResolved);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !user || !hasLoadedLocalState || hasMergedRemoteStatsRef.current) return;
    hasMergedRemoteStatsRef.current = true;

    const userRef = doc(firestore, "users", user.uid);
    const mergeSnapshot = (data: unknown) => {
      setStats((current) => mergeRemoteStats(current, data));
    };

    const loadRemoteStats = async () => {
      try {
        const cached = await getDocFromCache(userRef);
        if (cached.exists()) mergeSnapshot(cached.data());
      } catch {}

      const syncState = readFirestoreSyncState();
      const canReadServer = canUseFirestore() && (!syncState.lastRemoteReadAt || Date.now() - syncState.lastRemoteReadAt > REMOTE_READ_TTL_MS);
      if (!canReadServer) return;

      try {
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) mergeSnapshot(snapshot.data());
        markFirestoreRemoteRead();
      } catch (error) {
        markFirestoreFailure(error);
        setIsFirestoreQuotaBlocked(true);
      }
    };

    void loadRemoteStats();
  }, [hasLoadedLocalState, user]);

  const loadAdminVocabData = useCallback(async () => {
    const firestore = db;
    if (!firestore || isFirestoreQuotaBlocked || !canUseFirestore() || hasLoadedAdminVocabDataRef.current) return;
    try {
      const lastRemoteRead = Number(window.localStorage.getItem(ADMIN_VOCAB_REMOTE_READ_KEY) || 0);
      if (lastRemoteRead && Date.now() - lastRemoteRead < REMOTE_READ_TTL_MS) return;
    } catch {}
    hasLoadedAdminVocabDataRef.current = true;

    try {
      const [overridesSnapshot, deletedSnapshot] = await Promise.all([
        getDocs(collection(firestore, "adminVocabOverrides")),
        getDocs(collection(firestore, "adminDeletedWords")),
      ]);

      setVocabOverrides((current) => {
        const next: Record<string, AdminEditPatch> = {};
        overridesSnapshot.docs.forEach((documentSnapshot) => {
          next[documentSnapshot.id] = sanitizePatch(documentSnapshot.id, documentSnapshot.data());
        });
        return JSON.stringify(next) === JSON.stringify(current) ? current : next;
      });
      setGlobalDeletedWordKeys((current) => {
        const next = deletedSnapshot.docs.map((documentSnapshot) => documentSnapshot.id).sort();
        return JSON.stringify(next) === JSON.stringify([...current].sort()) ? current : next;
      });
      try {
        window.localStorage.setItem(ADMIN_VOCAB_REMOTE_READ_KEY, String(Date.now()));
      } catch {}
      writeFirestoreSyncState({ ...readFirestoreSyncState(), status: "available", lastRemoteReadAt: Date.now() });
    } catch (error) {
      blockFirestoreQuota(error);
      hasLoadedAdminVocabDataRef.current = false;
      throw error;
    }
  }, [blockFirestoreQuota, isFirestoreQuotaBlocked]);

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
      const entry = vocabEntries.find((candidate) => candidate.id === wordId || normalizeVocabWordKey(candidate.word) === normalizeVocabWordKey(wordId));
      const key = entry?.id ?? normalizeVocabWordKey(wordId);
      updateStats((current) => ({
        ...current,
        mistakes: {
          ...current.mistakes,
          [key]: (current.mistakes[key] ?? 0) + 1,
        },
      }));

      if (!entry) return;
      enqueueGlobalMistakeDelta(
        normalizeVocabWordKey(entry.word),
        entry.word,
        {
          wordId: entry.id,
          pinyin: entry.pinyin,
          meaning: entry.meaning,
          translations: entry.translations,
          hsk: entry.hsk,
          lessonId: entry.lessonId,
          step: entry.step,
        },
        1,
      );
    },
    [updateStats, vocabEntries],
  );

  const clearMistake = useCallback(
    (wordId: string) => {
      const entry = vocabEntries.find((candidate) => candidate.id === wordId || normalizeVocabWordKey(candidate.word) === normalizeVocabWordKey(wordId));
      const keys = new Set([wordId, normalizeVocabWordKey(wordId)]);
      if (entry) {
        keys.add(entry.id);
        keys.add(normalizeVocabWordKey(entry.word));
      }
      updateStats((current) => {
        const mistakes = { ...current.mistakes };
        for (const key of keys) delete mistakes[key];
        return { ...current, mistakes };
      });
    },
    [updateStats, vocabEntries],
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "unknown";
      const message = error instanceof Error ? error.message : String(error);
      console.error("[auth] signInWithPopup failed:", code, message);
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const saveVocabOverride = useCallback(async (entryId: string, patch: VocabOverridePatch) => {
    const sanitized = sanitizePatch(entryId, patch);
    setVocabOverrides((current) => ({ ...current, [entryId]: sanitized }));
    enqueueAdminOverride(entryId, sanitized);
  }, []);

  const clearVocabOverride = useCallback(async (entryId: string) => {
    setVocabOverrides((current) => {
      const next = { ...current };
      delete next[entryId];
      return next;
    });
    enqueueAdminOverrideDelete(entryId);
  }, []);

  const syncNow = useCallback(async () => {
    await flushOrPruneFirestoreQueue();
  }, [flushOrPruneFirestoreQueue]);

  const deleteWordsGlobally = useCallback(
    async (entryIds: string[]) => {
      const selectedEntries = vocabEntries.filter((entry) => entryIds.includes(entry.id));
      const nextKeys = selectedEntries.map((entry) => normalizeVocabWordKey(entry.word));

      setGlobalDeletedWordKeys((current) => Array.from(new Set([...current, ...nextKeys])).sort());
      enqueueAdminDeletedWords(
        selectedEntries.map((entry) => entry.id),
        nextKeys,
        selectedEntries.map((entry) => entry.word),
      );
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
      theme,
      setTheme,
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
      loadAdminVocabData,
      deleteWordsGlobally,
      saveVocabOverride,
      clearVocabOverride,
      syncNow,
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
      loadAdminVocabData,
      recordMistake,
      resetLocalState,
      resetProgress,
      signInWithGoogle,
      signOutUser,
      saveVocabOverride,
      syncNow,
      stats,
      unlockProgress,
      updateProfile,
      updateSettings,
      user,
      vocabEntries,
      theme,
      setTheme,
    ],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used inside GamificationProvider");
  return context;
}
