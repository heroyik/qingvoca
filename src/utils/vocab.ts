import type { ChineseDifficultyBand, ChineseVocabEntry, SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE } from "../types/chinese-vocab";
import vocabJson from "@/data/vocab.json";

export type VocabEntry = ChineseVocabEntry;

export type POS = "noun" | "verb" | "adjective" | "adverb" | "onomatopoeia" | "other";

export interface LearningUnit {
  id: string;
  title: string;
  source: string;
  words: VocabEntry[];
  step: number;
  lessonIds: number[];
  hsk: "HSK4";
}

const defaultVocabEntries = vocabJson.data as VocabEntry[];

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

export function normalizeVocabWordKey(word: string): string {
  return word
    .normalize("NFKC")
    .replace(/[\u301c\uff5e]/g, "~")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export function filterDeletedWords<T extends Pick<VocabEntry, "word">>(
  entries: T[],
  deletedWordKeys: Iterable<string> = [],
): T[] {
  const deletedSet = new Set(deletedWordKeys);
  if (deletedSet.size === 0) return entries;
  return entries.filter((entry) => !deletedSet.has(normalizeVocabWordKey(entry.word)));
}

export function normalizeDisplayFurigana(entry: Pick<VocabEntry, "pinyin" | "reading" | "furigana">): string {
  return getReading(entry);
}

export function inferPOS(entry: Pick<VocabEntry, "pos">): POS {
  const pos = entry.pos.toLowerCase();
  if (/\bn\.|noun|명사|名詞/.test(pos)) return "noun";
  if (/\bv\.|verb|동사|動詞/.test(pos)) return "verb";
  if (/adj|형용사|形容詞/.test(pos)) return "adjective";
  if (/adv|부사|副詞/.test(pos)) return "adverb";
  return "other";
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

export function parseUnitId(unitId: string | number): number {
  if (typeof unitId === "number") return unitId;
  const normalized = unitId.startsWith("unit-") ? unitId.slice("unit-".length) : unitId;
  return Number(normalized);
}

export function getAllVocabData(
  deletedWordKeys: Iterable<string> = [],
  entries: VocabEntry[] = defaultVocabEntries,
): VocabEntry[] {
  return sortByStepThenWord(filterDeletedWords(entries, deletedWordKeys));
}

export function getUnits(
  deletedWordKeys: Iterable<string> = [],
  entries: VocabEntry[] = defaultVocabEntries,
): LearningUnit[] {
  const allWords = getAllVocabData(deletedWordKeys, entries);

  return getAvailableSteps(allWords).map((step) => {
    const words = allWords.filter((entry) => entry.step === step);
    const lessonIds = [...new Set(words.map((entry) => entry.lessonId))].sort((a, b) => a - b);

    return {
      id: `unit-${step}`,
      title: `Step ${step}`,
      source: `Lesson ${lessonIds[0]}-${lessonIds[lessonIds.length - 1]}`,
      words,
      step,
      lessonIds,
      hsk: "HSK4",
    };
  });
}

export function getRandomWords(
  count: number,
  targetPOS?: POS,
  excludeWordIds: string[] = [],
  deletedWordKeys: Iterable<string> = [],
  entries: VocabEntry[] = defaultVocabEntries,
): VocabEntry[] {
  const allWords = getAllVocabData(deletedWordKeys, entries);
  let candidates = allWords.filter((entry) => !excludeWordIds.includes(entry.id));

  if (targetPOS) {
    const posCandidates = candidates.filter((entry) => inferPOS(entry) === targetPOS);
    if (posCandidates.length >= count) candidates = posCandidates;
  }

  return [...candidates].sort(() => Math.random() - 0.5).slice(0, count);
}

export function getTotalWordCount(
  deletedWordKeys: Iterable<string> = [],
  entries: VocabEntry[] = defaultVocabEntries,
): number {
  return getAllVocabData(deletedWordKeys, entries).length;
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
