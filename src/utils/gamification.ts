import type { SupportedLocale } from "../types/chinese-vocab";
import { CHINESE_DATASET_LEVEL, LOCALE_STORAGE_KEY } from "../types/chinese-vocab";

export const DATASET_LANGUAGE = "zh" as const;
export const DATASET_VERSION = "zh-HSK4-v1" as const;

export const PROGRESS_STORAGE_KEY = "kamivoca:zh:progress";
export const REVIEW_STORAGE_KEY = "kamivoca:zh:review";
export const SCORE_STORAGE_KEY = "kamivoca:zh:score";
export const RANK_STORAGE_KEY = "kamivoca:zh:rank";

export const STORAGE_KEYS = {
  locale: LOCALE_STORAGE_KEY,
  progress: PROGRESS_STORAGE_KEY,
  review: REVIEW_STORAGE_KEY,
  score: SCORE_STORAGE_KEY,
  rank: RANK_STORAGE_KEY,
} as const;

export type StepProgress = {
  step: number;
  completedWordIds: string[];
  correctCount: number;
  wrongCount: number;
  bestScore: number;
  updatedAt: string;
};

export type ProgressState = {
  language: typeof DATASET_LANGUAGE;
  hsk: typeof CHINESE_DATASET_LEVEL;
  datasetVersion: typeof DATASET_VERSION;
  steps: Record<string, StepProgress>;
};

export type ReviewQueueState = {
  language: typeof DATASET_LANGUAGE;
  hsk: typeof CHINESE_DATASET_LEVEL;
  datasetVersion: typeof DATASET_VERSION;
  wordIds: string[];
  updatedAt: string;
};

export type ScoreState = {
  language: typeof DATASET_LANGUAGE;
  hsk: typeof CHINESE_DATASET_LEVEL;
  datasetVersion: typeof DATASET_VERSION;
  totalScore: number;
  streak: number;
  updatedAt: string;
};

export type LeaderboardDocument = {
  userId: string;
  displayName: string;
  language: typeof DATASET_LANGUAGE;
  hsk: typeof CHINESE_DATASET_LEVEL;
  datasetVersion: typeof DATASET_VERSION;
  totalScore: number;
  completedWords: number;
  locale?: SupportedLocale;
  updatedAt: string;
};

export function createInitialProgressState(): ProgressState {
  return {
    language: DATASET_LANGUAGE,
    hsk: CHINESE_DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
    steps: {},
  };
}

export function createInitialReviewQueueState(updatedAt = new Date().toISOString()): ReviewQueueState {
  return {
    language: DATASET_LANGUAGE,
    hsk: CHINESE_DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
    wordIds: [],
    updatedAt,
  };
}

export function createInitialScoreState(updatedAt = new Date().toISOString()): ScoreState {
  return {
    language: DATASET_LANGUAGE,
    hsk: CHINESE_DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
    totalScore: 0,
    streak: 0,
    updatedAt,
  };
}

export function createLeaderboardDocument(input: {
  userId: string;
  displayName: string;
  totalScore: number;
  completedWords: number;
  locale?: SupportedLocale;
  updatedAt?: string;
}): LeaderboardDocument {
  return {
    userId: input.userId,
    displayName: input.displayName,
    language: DATASET_LANGUAGE,
    hsk: CHINESE_DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
    totalScore: input.totalScore,
    completedWords: input.completedWords,
    locale: input.locale,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function isChineseLeaderboardDocument(document: Pick<LeaderboardDocument, "language" | "hsk" | "datasetVersion">): boolean {
  return (
    document.language === DATASET_LANGUAGE &&
    document.hsk === CHINESE_DATASET_LEVEL &&
    document.datasetVersion === DATASET_VERSION
  );
}

export function getCompletedWordCount(progress: ProgressState): number {
  const ids = new Set<string>();
  for (const step of Object.values(progress.steps)) {
    for (const id of step.completedWordIds) ids.add(id);
  }
  return ids.size;
}

export function addReviewWord(queue: ReviewQueueState, wordId: string, updatedAt = new Date().toISOString()): ReviewQueueState {
  return {
    ...queue,
    wordIds: queue.wordIds.includes(wordId) ? queue.wordIds : [...queue.wordIds, wordId],
    updatedAt,
  };
}

export function removeReviewWord(queue: ReviewQueueState, wordId: string, updatedAt = new Date().toISOString()): ReviewQueueState {
  return {
    ...queue,
    wordIds: queue.wordIds.filter((id) => id !== wordId),
    updatedAt,
  };
}
