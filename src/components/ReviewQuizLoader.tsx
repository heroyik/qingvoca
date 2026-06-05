"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGamification } from "@/hooks/useGamification";
import { getReviewWordsByIds } from "@/utils/quiz";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import Quiz from "./Quiz";

export default function ReviewQuizLoader() {
  const { stats, vocabEntries } = useGamification();
  const reviewWordsRef = useRef<ChineseVocabEntry[] | null>(null);
  if (reviewWordsRef.current === null) {
    const reviewIds = Object.entries(stats.mistakes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([wordId]) => wordId);
    reviewWordsRef.current = getReviewWordsByIds(vocabEntries, reviewIds);
  }
  const reviewWords = reviewWordsRef.current;

  if (reviewWords.length === 0) {
    return (
      <main className="container min-h-screen flex-center flex-col gap-16 p-24">
        <div className="review-card-modern">
          <h1 className="text-title m-0">복습할 단어가 없습니다</h1>
          <p className="text-subtitle">퀴즈에서 틀린 단어가 생기면 이곳에 자동으로 모입니다.</p>
          <Link href="/" className="duo-button duo-button-primary w-full flex-center no-underline">
            HOME
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
      unitTitle="Review Session"
      isReview
    />
  );
}
