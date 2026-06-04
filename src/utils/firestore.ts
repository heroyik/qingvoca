import type { ChineseVocabEntry } from "../types/chinese-vocab";
import { CHINESE_DATASET_LEVEL } from "../types/chinese-vocab";
import { DATASET_LANGUAGE, DATASET_VERSION } from "./gamification";

export const FIRESTORE_COLLECTIONS = {
  vocabEntries: "zhVocabEntries",
  fullVocaEntries: "zhFullVocaEntries",
  datasetMeta: "zhDatasetMeta",
  leaderboard: "zhLeaderboard",
  adminOverrides: "zhAdminOverrides",
} as const;

export type ChineseFirestoreVocabDocument = ChineseVocabEntry & {
  language: typeof DATASET_LANGUAGE;
  datasetVersion: typeof DATASET_VERSION;
};

export type ChineseFirestoreDatasetMeta = {
  language: typeof DATASET_LANGUAGE;
  hsk: typeof CHINESE_DATASET_LEVEL;
  datasetVersion: typeof DATASET_VERSION;
  totalCount: number;
  stepCount: number;
  lessonCount: number;
  generatedAt: string;
};

export function createFirestoreVocabDocument(entry: ChineseVocabEntry): ChineseFirestoreVocabDocument {
  return {
    ...entry,
    language: DATASET_LANGUAGE,
    hsk: CHINESE_DATASET_LEVEL,
    jlpt: CHINESE_DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
  };
}

export function createFirestoreDatasetMeta(entries: ChineseVocabEntry[], generatedAt = new Date().toISOString()): ChineseFirestoreDatasetMeta {
  return {
    language: DATASET_LANGUAGE,
    hsk: CHINESE_DATASET_LEVEL,
    datasetVersion: DATASET_VERSION,
    totalCount: entries.length,
    stepCount: new Set(entries.map((entry) => entry.step)).size,
    lessonCount: new Set(entries.map((entry) => entry.lessonId)).size,
    generatedAt,
  };
}

export function isChineseFirestoreVocabDocument(
  document: Pick<ChineseFirestoreVocabDocument, "language" | "hsk" | "datasetVersion">,
): boolean {
  return document.language === DATASET_LANGUAGE && document.hsk === CHINESE_DATASET_LEVEL && document.datasetVersion === DATASET_VERSION;
}
