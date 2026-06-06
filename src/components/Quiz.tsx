"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGamification } from "@/hooks/useGamification";
import type { ChineseVocabEntry, SupportedLocale } from "@/types/chinese-vocab";
import { DEFAULT_LOCALE } from "@/types/chinese-vocab";
import { createQuizQuestion, validateQuizQuestions } from "@/utils/quiz";
import { speakChineseFeedback, speakChineseWord } from "@/utils/speech";
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
  const [comboCount, setComboCount] = useState(0);
  const [lastComboCount, setLastComboCount] = useState(0);
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [questionSeed, setQuestionSeed] = useState<string | null>(null);
  const { addGem, addXP, clearMistake, completeUnit, recordMistake, stats } = useGamification();
  const wordOrderKey = useMemo(() => unitWords.map((entry) => entry.id).join("|"), [unitWords]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswerState(null);
      setScore(0);
      setComboCount(0);
      setLastComboCount(0);
      setMistakeIds([]);
      setShowResult(false);
      setQuestionSeed(createQuestionSeed(unitId));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [unitId, wordOrderKey]);

  const shuffledUnitWords = useMemo(
    () => (questionSeed ? stableShuffleEntries(unitWords, questionSeed) : []),
    [questionSeed, unitWords],
  );
  const questions = useMemo(
    () => shuffledUnitWords.map((entry) => createQuizQuestion(entry, allWords, { locale })),
    [allWords, locale, shuffledUnitWords],
  );
  const validationErrors = useMemo(() => validateQuizQuestions(questions), [questions]);
  const currentQuestion = questions[currentIndex];
  const currentEntry = shuffledUnitWords[currentIndex];

  const playChineseFeedback = (tone: "correct" | "incorrect") => {
    if (typeof window === "undefined" || !stats.settings.soundEffectsEnabled) return;
    speakChineseFeedback(tone, window.speechSynthesis);
  };

  const handleSelect = (option: string) => {
    if (!currentQuestion || selectedOption) return;

    const isCorrect = option === currentQuestion.answer;
    setSelectedOption(option);
    setAnswerState(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      setLastComboCount(nextCombo);
      triggerHapticFeedback(stats.settings.hapticsEnabled, nextCombo >= 3 ? [20, 30, 20, 30, 45] : 18);
      playChineseFeedback("correct");
      setScore((value) => value + 1);
      clearMistake(currentQuestion.id);
    } else {
      setComboCount(0);
      setLastComboCount(0);
      triggerHapticFeedback(stats.settings.hapticsEnabled, [24, 36, 24]);
      playChineseFeedback("incorrect");
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
    if (!currentEntry || !stats.settings.speechEnabled || typeof window === "undefined") return;
    speakChineseWord(currentEntry, window.speechSynthesis);
  };

  if (questions.length === 0) {
    if (unitWords.length > 0 && !questionSeed) {
      return (
        <main className="container min-h-screen flex-center flex-col gap-16">
          <h1 className="text-title">Loading...</h1>
        </main>
      );
    }

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
                setComboCount(0);
                setLastComboCount(0);
                setMistakeIds([]);
                setShowResult(false);
                setQuestionSeed(createQuestionSeed(unitId));
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
          <Link href="/" className="qv-wordmark no-underline font-900" aria-label="QingVoca">
            <span className="qv-wordmark-qing">Qing</span>
            <span className="qv-wordmark-voca">Voca</span>
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
          <button
            type="button"
            className="duo-button duo-button-secondary w-auto px-24 mt-12"
            onClick={handleSpeak}
            disabled={!stats.settings.speechEnabled}
          >
            {stats.settings.speechEnabled ? t("playAudio", locale) : t("audioOff", locale)}
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
        <div className={`feedback-bar ${answerState === "correct" ? "correct" : "incorrect"} ${lastComboCount >= 3 ? "combo" : ""}`}>
          <div>
            <h2 className="font-18 font-900 m-0">{answerState === "correct" ? t("correct", locale) : t("answerLabel", locale)}</h2>
            {answerState === "correct" && lastComboCount >= 2 && (
              <p className="combo-callout">
                {lastComboCount >= 3 ? `🔥 ${lastComboCount} COMBO! 太棒了!` : "✨ 2 COMBO!"}
              </p>
            )}
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

function createQuestionSeed(unitId: string): string {
  const randomPart =
    typeof window !== "undefined" && window.crypto
      ? window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
      : Date.now().toString(36);
  return `${unitId}:${Date.now().toString(36)}:${randomPart}`;
}

function stableShuffleEntries(entries: ChineseVocabEntry[], seed: string): ChineseVocabEntry[] {
  return [...entries]
    .map((entry, index) => ({ entry, score: hash(`${seed}:${index}:${entry.id}`) }))
    .sort((a, b) => a.score - b.score)
    .map(({ entry }) => entry);
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function triggerHapticFeedback(enabled: boolean, pattern: VibratePattern): void {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}
