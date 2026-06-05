"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGamification } from "@/hooks/useGamification";
import { getReviewWordsByIds } from "@/utils/quiz";
import { loadLocale } from "@/utils/locale";
import { t } from "@/utils/ui";
import Quiz from "./Quiz";

export default function ReviewQuizLoader() {
  const { stats, vocabEntries } = useGamification();
  const locale = loadLocale(typeof window !== "undefined" ? window.localStorage : undefined);
  const reviewWords = useMemo(() => {
    const reviewIds = Object.entries(stats.mistakes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([wordId]) => wordId);
    return getReviewWordsByIds(vocabEntries, reviewIds);
  }, [stats.mistakes, vocabEntries]);

  if (reviewWords.length === 0) {
    return (
      <main className="container min-h-screen flex-center flex-col gap-16 p-24">
        <div className="review-card-modern">
          <h1 className="text-title m-0">{t("noReviewWords", locale)}</h1>
          <p className="text-subtitle">{t("noReviewWordsHint", locale)}</p>
          <Link href="/" className="duo-button duo-button-primary w-full flex-center no-underline">
            {t("goHome", locale)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <Quiz
      unitId="review"
      unitWords={reviewWords}
      allWords={vocabEntries}
      unitTitle={t("review", locale)}
      isReview
      locale={locale}
    />
  );
}
