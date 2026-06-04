import type { ChineseVocabEntry, SupportedLocale } from "../types/chinese-vocab";
import { CHINESE_DATASET_LEVEL } from "../types/chinese-vocab";
import { getDisplayMeaning, getStepSummaries } from "./vocab";
import { t } from "./ui";

export type HomeStepCard = {
  step: number;
  title: string;
  lessonRange: string;
  wordCount: number;
  hsk: typeof CHINESE_DATASET_LEVEL;
  progressPercent: number;
};

export type ReviewSummary = {
  reviewCount: number;
  completedCount: number;
  recentWrongCount: number;
};

export type LocaleOption = {
  locale: SupportedLocale;
  label: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { locale: "ko", label: "한국어" },
  { locale: "ja", label: "日本語" },
  { locale: "en", label: "English" },
];

export function createHomeStepCards(
  entries: ChineseVocabEntry[],
  completedWordIds: string[] = [],
): HomeStepCard[] {
  const completed = new Set(completedWordIds);

  return getStepSummaries(entries).map((summary) => {
    const completedInStep = entries.filter((entry) => entry.step === summary.step && completed.has(entry.id)).length;
    const progressPercent = summary.wordCount === 0 ? 0 : Math.round((completedInStep / summary.wordCount) * 100);

    return {
      step: summary.step,
      title: `Step ${summary.step}`,
      lessonRange: `Lesson ${summary.lessonIds[0]}-${summary.lessonIds[summary.lessonIds.length - 1]}`,
      wordCount: summary.wordCount,
      hsk: CHINESE_DATASET_LEVEL,
      progressPercent,
    };
  });
}

export function createQuizCardView(entry: ChineseVocabEntry, locale: SupportedLocale) {
  return {
    word: entry.word,
    pinyin: entry.pinyin,
    pos: entry.pos,
    meaning: getDisplayMeaning(entry, locale),
    showPinyinLabel: t("showPinyin", locale),
    audioLabel: t("playChineseAudio", locale),
  };
}

export function createReviewSummary(input: {
  reviewWordIds: string[];
  completedWordIds: string[];
  recentWrongWordIds: string[];
}): ReviewSummary {
  return {
    reviewCount: new Set(input.reviewWordIds).size,
    completedCount: new Set(input.completedWordIds).size,
    recentWrongCount: new Set(input.recentWrongWordIds).size,
  };
}

export function hasPinyinToneMarks(entries: ChineseVocabEntry[]): boolean {
  return entries.some((entry) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u.test(entry.pinyin));
}
