"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useGamification } from "@/hooks/useGamification";
import type { ChineseVocabEntry, SupportedLocale } from "@/types/chinese-vocab";
import { DEFAULT_LOCALE } from "@/types/chinese-vocab";
import { createQuizQuestion, validateQuizQuestions } from "@/utils/quiz";
import { speakChineseWord } from "@/utils/speech";
import { t, tpl } from "@/utils/ui";

interface QuizProps {
  unitId: string;
  unitWords: ChineseVocabEntry[];
  allWords: ChineseVocabEntry[];
  unitTitle?: string;
  isReview?: boolean;
  locale?: SupportedLocale;
}

type AnswerState = "correct" | "wrong" | null;

export default function Quiz({
  unitId,
  unitWords,
  allWords,
  unitTitle,
  isReview = false,
  locale = DEFAULT_LOCALE,
}: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [score, setScore] = useState(0);
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const { addGem, addXP, clearMistake, completeUnit, recordMistake, stats } = useGamification();

  const questions = useMemo(
    () => unitWords.map((entry) => createQuizQuestion(entry, allWords, { locale })),
    [allWords, locale, unitWords],
  );
  const validationErrors = useMemo(() => validateQuizQuestions(questions), [questions]);
  const currentQuestion = questions[currentIndex];
  const currentEntry = unitWords[currentIndex];

  const handleSelect = (option: string) => {
    if (!currentQuestion || selectedOption) return;

    const isCorrect = option === currentQuestion.answer;
    setSelectedOption(option);
    setAnswerState(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setScore((value) => value + 1);
      clearMistake(currentQuestion.id);
    } else {
      setMistakeIds((ids) => (ids.includes(currentQuestion.id) ? ids : [...ids, currentQuestion.id]));
      recordMistake(currentQuestion.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedOption(null);
      setAnswerState(null);
      return;
    }

    const earnedXP = score * 10;
    const mastered = mistakeIds.length === 0 && score === questions.length;
    addXP(earnedXP);
    addGem(mastered ? 20 : Math.max(1, Math.round(score / 2)));
    if (!isReview) completeUnit(unitId, mistakeIds.length, mastered);
    setShowResult(true);
  };

  const handleSpeak = () => {
    if (!currentEntry || typeof window === "undefined") return;
    speakChineseWord(currentEntry, window.speechSynthesis);
  };

  if (questions.length === 0) {
    return (
      <main className="container min-h-screen flex-center flex-col gap-16">
        <h1 className="text-title">{t("noQuizWords", locale)}</h1>
        <Link href="/" className="duo-button duo-button-primary w-auto px-40 no-underline">
          {t("goHome", locale)}
        </Link>
      </main>
    );
  }

  if (validationErrors.length > 0) {
    return (
      <main className="container min-h-screen flex-center flex-col gap-16">
        <h1 className="text-title">{t("quizDataError", locale)}</h1>
        <p className="text-subtitle">{validationErrors[0]}</p>
      </main>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <main className="container min-h-screen flex-center flex-col gap-20 p-24">
        <div className="result-card w-full">
          <div className="font-64">{percentage >= 80 ? "🎉" : "📖"}</div>
          <h1 className="text-title">{isReview ? t("reviewComplete", locale) : t("stepComplete", locale)}</h1>
          <p className="text-subtitle">
            {tpl(t("correctCount", locale), { score, total: questions.length, pct: percentage })}
          </p>
          {mistakeIds.length > 0 && (
            <p className="text-subtitle">{tpl(t("reviewHint", locale), { count: mistakeIds.length })}</p>
          )}
          <div className="flex gap-12 mt-24">
            <Link href="/" className="duo-button duo-button-secondary w-auto px-32 no-underline">
              {t("home", locale)}
            </Link>
            <button
              type="button"
              className="duo-button duo-button-primary w-auto px-32"
              onClick={() => {
                setCurrentIndex(0);
                setSelectedOption(null);
                setAnswerState(null);
                setScore(0);
                setMistakeIds([]);
                setShowResult(false);
              }}
            >
              {t("retry", locale)}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container min-h-screen pb-120 pt-68">
      <header className="sticky-header xh-header">
        <div className="header-left">
          <Link href="/" className="no-underline text-kv-kurenai font-900">
            QingVoca
          </Link>
          <span className="version-badge ml-8">{unitTitle ?? unitId}</span>
        </div>
        <div className="header-right font-14 font-900">
          {currentIndex + 1}/{questions.length}
        </div>
      </header>

      <section className="quiz-layout">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
          />
        </div>

        <div className="quiz-card">
          <div className="quiz-unit-badge">
            {tpl(t("stepLesson", locale), { step: currentQuestion.step, lesson: currentQuestion.lessonId })}
          </div>
          <h1 className="text-main-title">{currentQuestion.word}</h1>
          {stats.settings.showPinyin && (
            <p className="text-title" style={{ color: "var(--xh-navy)" }}>{currentQuestion.pinyin}</p>
          )}
          <p className="text-subtitle">{currentQuestion.pos}</p>
          <button type="button" className="duo-button duo-button-secondary w-auto px-24 mt-12" onClick={handleSpeak}>
            {stats.settings.soundEnabled ? t("playAudio", locale) : t("audioOff", locale)}
          </button>
        </div>

        <div className="options-grid">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option;
            const isAnswer = option === currentQuestion.answer;
            const stateClass = selectedOption
              ? isAnswer
                ? "correct"
                : isSelected
                  ? "incorrect"
                  : "muted"
              : "";

            return (
              <button
                key={option}
                type="button"
                className={`option-card ${stateClass}`}
                onClick={() => handleSelect(option)}
                disabled={Boolean(selectedOption)}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      {selectedOption && (
        <div className={`feedback-bar ${answerState === "correct" ? "correct" : "incorrect"}`}>
          <div>
            <h2 className="font-18 font-900 m-0">{answerState === "correct" ? t("correct", locale) : t("answerLabel", locale)}</h2>
            {answerState === "wrong" && <p className="correct-solution">{currentQuestion.answer}</p>}
          </div>
          <button type="button" className="duo-button duo-button-primary w-auto px-32" onClick={handleNext}>
            {t("next", locale)}
          </button>
        </div>
      )}
    </main>
  );
}
