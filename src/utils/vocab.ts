import type { ChineseDifficultyBand, ChineseVocabEntry, SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE } from "../types/chinese-vocab";

export type StepSummary = {
  step: number;
  title: string;
  lessonIds: number[];
  wordCount: number;
  band: ChineseDifficultyBand;
};

export function getReading(entry: Pick<ChineseVocabEntry, "pinyin" | "reading" | "furigana">): string {
  return entry.pinyin || entry.reading || entry.furigana;
}

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

export function getWordsForStep(entries: ChineseVocabEntry[], step: number): ChineseVocabEntry[] {
  return entries.filter((entry) => entry.step === step);
}

export function getAvailableSteps(entries: ChineseVocabEntry[]): number[] {
  return [...new Set(entries.map((entry) => entry.step))].sort((a, b) => a - b);
}

export function getStepSummaries(entries: ChineseVocabEntry[]): StepSummary[] {
  return getAvailableSteps(entries).map((step) => {
    const words = getWordsForStep(entries, step);
    const lessonIds = [...new Set(words.map((entry) => entry.lessonId))].sort((a, b) => a - b);

    return {
      step,
      title: `Step ${step}`,
      lessonIds,
      wordCount: words.length,
      band: getBandForStep(step),
    };
  });
}

export function sortByStepThenWord(entries: ChineseVocabEntry[]): ChineseVocabEntry[] {
  return [...entries].sort((a, b) => {
    const stepDelta = a.step - b.step;
    if (stepDelta !== 0) return stepDelta;
    const lessonDelta = a.lessonId - b.lessonId;
    if (lessonDelta !== 0) return lessonDelta;
    return `${a.word}\u0000${a.pinyin}`.localeCompare(`${b.word}\u0000${b.pinyin}`, "zh-Hans-CN");
  });
}

export function validateStepCoverage(entries: ChineseVocabEntry[], expectedSteps = 10): string[] {
  const errors: string[] = [];
  const steps = getAvailableSteps(entries);

  if (steps.length !== expectedSteps) {
    errors.push(`Expected ${expectedSteps} steps, got ${steps.length}.`);
  }

  for (let step = 1; step <= expectedSteps; step += 1) {
    const words = getWordsForStep(entries, step);
    if (words.length === 0) errors.push(`Step ${step} has no words.`);
  }

  for (const entry of entries) {
    const expectedStep = getStepForLesson(entry.lessonId);
    if (entry.step !== expectedStep) {
      errors.push(`${entry.id} has step ${entry.step}, expected ${expectedStep}.`);
    }
  }

  return errors;
}
