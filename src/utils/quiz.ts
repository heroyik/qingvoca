import type { ChineseVocabEntry, SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE } from "../types/chinese-vocab";
import { getDisplayMeaning, getReading, getWordsForStep } from "./vocab";

export type QuizQuestion = {
  id: string;
  word: string;
  pinyin: string;
  pos: string;
  step: number;
  lessonId: number;
  answer: string;
  options: string[];
};

export type QuizQuestionOptions = {
  locale?: SupportedLocale;
  optionCount?: number;
};

export function getLessonsForStep(step: number): [number, number] {
  return [step * 2 - 1, step * 2];
}

export function getQuizWordsForStep(entries: ChineseVocabEntry[], step: number): ChineseVocabEntry[] {
  return getWordsForStep(entries, step);
}

export function getReviewWordsByIds(entries: ChineseVocabEntry[], reviewIds: string[]): ChineseVocabEntry[] {
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  return reviewIds.map((id) => entryById.get(id)).filter((entry): entry is ChineseVocabEntry => Boolean(entry));
}

export function createQuizQuestion(
  entry: ChineseVocabEntry,
  entries: ChineseVocabEntry[],
  options: QuizQuestionOptions = {},
): QuizQuestion {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const optionCount = options.optionCount ?? 4;
  const answer = getDisplayMeaning(entry, locale);
  const distractors = getDistractors(entry, entries, locale, optionCount - 1);

  return {
    id: entry.id,
    word: entry.word,
    pinyin: getReading(entry),
    pos: entry.pos,
    step: entry.step,
    lessonId: entry.lessonId,
    answer,
    options: stableShuffle([answer, ...distractors], entry.id).slice(0, optionCount),
  };
}

export function createQuizQuestions(
  entries: ChineseVocabEntry[],
  sourceWords: ChineseVocabEntry[],
  options: QuizQuestionOptions = {},
): QuizQuestion[] {
  return sourceWords.map((entry) => createQuizQuestion(entry, entries, options));
}

export function getDistractors(
  entry: ChineseVocabEntry,
  entries: ChineseVocabEntry[],
  locale: SupportedLocale = DEFAULT_LOCALE,
  count = 3,
): string[] {
  const answer = getDisplayMeaning(entry, locale);
  const seen = new Set([normalizeMeaning(answer), ""]);

  return entries
    .filter((candidate) => candidate.id !== entry.id && candidate.hsk === entry.hsk)
    .map((candidate) => ({
      candidate,
      meaning: getDisplayMeaning(candidate, locale),
      distance: Math.abs(candidate.step - entry.step),
    }))
    .filter(({ meaning }) => {
      const normalized = normalizeMeaning(meaning);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .sort((a, b) => {
      const distanceDelta = a.distance - b.distance;
      if (distanceDelta !== 0) return distanceDelta;
      const stepDelta = a.candidate.step - b.candidate.step;
      if (stepDelta !== 0) return stepDelta;
      return a.candidate.id.localeCompare(b.candidate.id);
    })
    .slice(0, count)
    .map(({ meaning }) => meaning);
}

export function validateQuizQuestions(questions: QuizQuestion[], optionCount = 4): string[] {
  const errors: string[] = [];

  for (const question of questions) {
    if (!question.word) errors.push(`${question.id} has empty word.`);
    if (!question.pinyin) errors.push(`${question.id} has empty pinyin.`);
    if (!question.pos) errors.push(`${question.id} has empty pos.`);
    if (!question.answer) errors.push(`${question.id} has empty answer.`);
    if (question.options.length !== optionCount) {
      errors.push(`${question.id} has ${question.options.length} options, expected ${optionCount}.`);
    }
    if (!question.options.includes(question.answer)) {
      errors.push(`${question.id} options do not include answer.`);
    }

    const uniqueOptions = new Set(question.options.map(normalizeMeaning));
    if (uniqueOptions.size !== question.options.length) {
      errors.push(`${question.id} has duplicate options.`);
    }
  }

  return errors;
}

function normalizeMeaning(meaning: string): string {
  return meaning.trim().replace(/\s+/g, " ").toLowerCase();
}

function stableShuffle(values: string[], seed: string): string[] {
  return [...values]
    .map((value, index) => ({ value, score: hash(`${seed}:${index}:${value}`) }))
    .sort((a, b) => a.score - b.score)
    .map(({ value }) => value);
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
