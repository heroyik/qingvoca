export type SupportedLocale = "ko" | "ja" | "en";

export type ChineseTranslations = {
  ko?: string;
  ja?: string;
  en?: string;
};

export type ChineseVocabSourceEntry = {
  word: string;
  pinyin: string;
  meaning: string;
  partOfSpeech?: string;
  lessonId: number;
  translations: ChineseTranslations;
};

export type ChineseVocabSourceFile = {
  version?: string;
  generatedAt?: string;
  totalCount?: number;
  words: ChineseVocabSourceEntry[];
};

export type ChineseDifficultyBand = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export type ChineseVocabEntry = {
  id: string;
  word: string;
  pinyin: string;
  reading: string;
  furigana: string;
  meaning: string;
  translations: ChineseTranslations;
  level: number;
  lessonId: number;
  step: number;
  pos: string;
  hsk: "HSK4";
  jlpt: "HSK4";
  band: ChineseDifficultyBand;
  opic: ChineseDifficultyBand;
  example: string[];
  examplePinyin: string[];
};

export const DEFAULT_LOCALE: SupportedLocale = "ko";

export const LOCALE_STORAGE_KEY = "qingvoca:zh:locale";

export const CHINESE_DATASET_LEVEL = "HSK4" as const;

export function getStepForLesson(lessonId: number): number {
  return Math.ceil(lessonId / 2);
}

export function getBandForStep(step: number): ChineseDifficultyBand {
  if (step <= 3) return "BASIC";
  if (step <= 7) return "INTERMEDIATE";
  return "ADVANCED";
}

export function getDisplayMeaning(
  entry: Pick<ChineseVocabEntry, "word" | "meaning" | "translations">,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const translations = entry.translations ?? {};

  if (locale === "ja") {
    return translations.ja || translations.ko || entry.meaning || translations.en || entry.word;
  }

  if (locale === "en") {
    return translations.en || entry.meaning || translations.ko || entry.word;
  }

  return translations.ko || entry.meaning || translations.en || entry.word;
}
