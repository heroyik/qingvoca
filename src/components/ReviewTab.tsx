"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getDocsFromCache, limit, orderBy, query } from "firebase/firestore";
import { Brain, Frown, Trash2 } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { db } from "@/lib/firebase";
import type { SupportedLocale } from "@/types/chinese-vocab";
import { DEFAULT_LOCALE } from "@/types/chinese-vocab";
import { filterDeletedWords, normalizeDisplayFurigana, normalizeVocabWordKey } from "@/utils/vocab";
import { getDisplayMeaning } from "@/types/chinese-vocab";
import { t } from "@/utils/ui";

interface ReviewTabProps {
  locale?: SupportedLocale;
}

type GlobalMistakeEntry = {
  id: string;
  count: number;
  word: string;
  wordId?: string;
  wordKey?: string;
  pinyin?: string;
  meaning?: string;
  translations?: Record<string, string | undefined>;
  lessonId?: number;
  step?: number;
};

const GLOBAL_MISTAKES_COLLECTION = "zhGlobalMistakes";
const GLOBAL_MISTAKES_CACHE_KEY = "qingvoca:wall-of-pain:cache";
const FIRESTORE_QUOTA_BLOCKED_KEY = "qingvoca:firestore:quota-blocked";
const GLOBAL_MISTAKES_CACHE_TTL_MS = 10 * 60 * 1000;

function isResourceExhausted(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "resource-exhausted");
}

function isQuotaBlocked() {
  try {
    return window.sessionStorage.getItem(FIRESTORE_QUOTA_BLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

function markQuotaBlocked() {
  try {
    window.sessionStorage.setItem(FIRESTORE_QUOTA_BLOCKED_KEY, "1");
  } catch {}
}

function readCachedGlobalMistakes() {
  try {
    const cached = window.sessionStorage.getItem(GLOBAL_MISTAKES_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as { savedAt?: number; entries?: GlobalMistakeEntry[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > GLOBAL_MISTAKES_CACHE_TTL_MS) return null;
    return Array.isArray(parsed.entries) ? parsed.entries : null;
  } catch {
    return null;
  }
}

function writeCachedGlobalMistakes(entries: GlobalMistakeEntry[]) {
  try {
    window.sessionStorage.setItem(GLOBAL_MISTAKES_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), entries }));
  } catch {}
}

function snapshotToGlobalMistakes(snapshot: Awaited<ReturnType<typeof getDocs>>): GlobalMistakeEntry[] {
  return snapshot.docs
    .map((documentSnapshot) => {
      const data = documentSnapshot.data() as Record<string, unknown>;
      return {
        id: documentSnapshot.id,
        count: typeof data.count === "number" ? data.count : 0,
        word: typeof data.word === "string" ? data.word : documentSnapshot.id,
        wordId: typeof data.wordId === "string" ? data.wordId : undefined,
        wordKey: typeof data.wordKey === "string" ? data.wordKey : documentSnapshot.id,
        pinyin: typeof data.pinyin === "string" ? data.pinyin : undefined,
        meaning: typeof data.meaning === "string" ? data.meaning : undefined,
        translations: data.translations && typeof data.translations === "object" ? data.translations as Record<string, string | undefined> : undefined,
        lessonId: typeof data.lessonId === "number" ? data.lessonId : undefined,
        step: typeof data.step === "number" ? data.step : undefined,
      };
    })
    .filter((entry) => entry.count > 0);
}

export default function ReviewTab({ locale = DEFAULT_LOCALE }: ReviewTabProps) {
  const { clearAllMistakes, globalDeletedWordKeys, removeMistake, stats, vocabEntries } = useGamification();
  const [globalMistakes, setGlobalMistakes] = useState<GlobalMistakeEntry[]>(() => readCachedGlobalMistakes() ?? []);
  const mistakes = stats.mistakes;

  const reviewEntries = useMemo(
    () =>
      filterDeletedWords(vocabEntries, globalDeletedWordKeys)
        .map((entry) => ({
          entry,
          totalCount: mistakes[entry.id] ?? mistakes[normalizeVocabWordKey(entry.word)] ?? 0,
        }))
        .filter(({ totalCount }) => totalCount > 0)
        .sort((a, b) => b.totalCount - a.totalCount || a.entry.step - b.entry.step || a.entry.word.localeCompare(b.entry.word)),
    [globalDeletedWordKeys, mistakes, vocabEntries],
  );

  const wallOfPainEntries = useMemo(() => {
    const deletedSet = new Set(globalDeletedWordKeys);
    const vocabByWordKey = new Map(vocabEntries.map((entry) => [normalizeVocabWordKey(entry.word), entry]));
    return globalMistakes
      .filter((entry) => !deletedSet.has(entry.wordKey ?? normalizeVocabWordKey(entry.word)))
      .slice(0, 10)
      .map((globalEntry) => ({
        globalEntry,
        vocabEntry: vocabByWordKey.get(globalEntry.wordKey ?? normalizeVocabWordKey(globalEntry.word)),
      }));
  }, [globalDeletedWordKeys, globalMistakes, vocabEntries]);

  useEffect(() => {
    let isCancelled = false;
    const firestore = db;
    if (!firestore || readCachedGlobalMistakes() || isQuotaBlocked()) return undefined;

    const loadGlobalMistakes = async () => {
      const topMistakesQuery = query(collection(firestore, GLOBAL_MISTAKES_COLLECTION), orderBy("count", "desc"), limit(10));

      try {
        const cacheSnapshot = await getDocsFromCache(topMistakesQuery);
        if (!isCancelled && !cacheSnapshot.empty) {
          const entries = snapshotToGlobalMistakes(cacheSnapshot);
          setGlobalMistakes(entries);
          writeCachedGlobalMistakes(entries);
          return;
        }
      } catch {}

      try {
        const snapshot = await getDocs(topMistakesQuery);
        const entries = snapshotToGlobalMistakes(snapshot);
        if (!isCancelled) {
          setGlobalMistakes(entries);
          writeCachedGlobalMistakes(entries);
        }
      } catch (error) {
        if (isResourceExhausted(error)) markQuotaBlocked();
      }
    };

    void loadGlobalMistakes();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="review-content">
      {reviewEntries.length === 0 ? (
        <div className="flex-center min-h-60 flex-col gap-16">
          <div className="font-64">✨</div>
          <h2 className="text-title">All Clear!</h2>
          <p className="text-subtitle text-center px-20">
            {t("noReviewWordsHint", locale)}
          </p>
        </div>
      ) : (
        <div className="review-card-modern">
          <div className="review-header">
            <div className="review-header-icon">
              <Brain size={28} />
            </div>
            <h2 className="text-title m-0">Tricky Words</h2>
          </div>

          <div className="stat-container">
            <span className="stat-value">{reviewEntries.length}</span>
            <span className="stat-label">
              {reviewEntries.length === 1 ? "word" : "words"} need more practice
            </span>
          </div>

          <div className="review-actions">
            <Link
              href="/quiz/review"
              className="flex-1 no-underline duo-button duo-button-primary button-standard w-full button-review-pulse flex-center"
            >
              {t("startReviewLabel", locale)}
            </Link>
            <button
              type="button"
              onClick={() => clearAllMistakes()}
              className="icon-button-round"
              aria-label="Clear entire review list"
              title="Clear list"
              style={{ width: 48, height: 48 }}
            >
              <Trash2 size={24} />
            </button>
          </div>

          <div className="mistake-list">
            {reviewEntries.map(({ entry, totalCount }) => {
              const displayPinyin = normalizeDisplayFurigana(entry);

              return (
                <div key={entry.id} className="mistake-item flex-between">
                  <div className="flex-1" style={{ paddingRight: 12 }}>
                    <div className="text-subtitle text-kv-kurenai mb-4">{entry.word}</div>
                    {stats.settings.showPinyin && displayPinyin && entry.word !== displayPinyin && (
                      <div className="text-small text-secondary mb-4">{displayPinyin}</div>
                    )}
                    <div className="text-small">{getDisplayMeaning(entry, locale)}</div>
                  </div>
                  <div className="flex-center gap-12">
                    <div className="mistake-count" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Frown size={12} />
                      {totalCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMistake(entry.word)}
                      className="trash-button"
                      aria-label={`Remove ${entry.word} from review list`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="review-card-modern" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h2 className="text-title m-0" style={{ letterSpacing: 0 }}>
            Wall of Pain
          </h2>
          <span style={{ fontSize: 22, lineHeight: 1 }}>😤</span>
        </div>
        <p className="text-small" style={{ margin: "0 0 16px", color: "var(--text-secondary)" }}>
          words everyone is missing
        </p>

        {wallOfPainEntries.length === 0 ? (
          <div className="text-small text-center" style={{ padding: "16px 0", color: "var(--text-secondary)" }}>
            No global data yet.
          </div>
        ) : (
          <div className="mistake-list">
            {wallOfPainEntries.map(({ globalEntry, vocabEntry }, index) => (
              <div key={`wall-${globalEntry.id}`} className="mistake-item flex-between">
                <div className="flex-1" style={{ paddingRight: 12 }}>
                  <div className="text-subtitle text-kv-kurenai mb-4">
                    #{index + 1} {globalEntry.word}
                  </div>
                  {stats.settings.showPinyin && (globalEntry.pinyin || vocabEntry?.pinyin) && (
                    <div className="text-small text-secondary mb-4">{globalEntry.pinyin || vocabEntry?.pinyin}</div>
                  )}
                  <div className="text-small">
                    {vocabEntry
                      ? getDisplayMeaning(vocabEntry, locale)
                      : getDisplayMeaning(
                          {
                            word: globalEntry.word,
                            meaning: globalEntry.meaning || globalEntry.word,
                            translations: globalEntry.translations ?? {},
                          },
                          locale,
                        )}
                  </div>
                </div>
                <div className="mistake-count" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Frown size={12} />
                  {globalEntry.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
