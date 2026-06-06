"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import vocabData from "@/data/vocab.json";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import { useGamification } from "@/hooks/useGamification";
import { getUnits, normalizeVocabWordKey, parseUnitId } from "@/utils/vocab";
import { loadLocale } from "@/utils/locale";
import { t, tpl } from "@/utils/ui";
import Quiz from "./Quiz";

interface QuizLoaderProps {
  unitId: string;
}

export default function QuizLoader({ unitId }: QuizLoaderProps) {
  const searchParams = useSearchParams();
  const { stats } = useGamification();
  const [locale, setLocale] = useState(loadLocale(undefined));
  const mode = searchParams.get("mode") === "mistakes" ? "mistakes" : undefined;
  const entries = vocabData.data as ChineseVocabEntry[];
  const step = parseUnitId(unitId);
  const units = getUnits([], entries);
  const unit = units.find((item) => item.step === step || item.id === unitId);
  const unitWords =
    mode === "mistakes" && unit
      ? unit.words.filter((word) => {
          const wordKey = normalizeVocabWordKey(word.word);
          return (stats.mistakes[word.id] ?? stats.mistakes[wordKey] ?? 0) > 0;
        })
      : unit?.words;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocale(loadLocale(window.localStorage));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!unit) {
    return (
      <main className="container min-h-screen flex-center flex-col gap-16">
        <h1 className="text-title">{t("unknownStep", locale)}</h1>
        <p className="text-subtitle">{tpl(t("stepNotAvailable", locale), { id: unitId })}</p>
        <Link href="/" className="duo-button duo-button-primary w-auto px-40 no-underline">
          {t("goHome", locale)}
        </Link>
      </main>
    );
  }

  return (
    <Quiz
      unitId={unit.id}
      unitWords={unitWords ?? []}
      allWords={entries}
      unitTitle={unit.title}
      isReview={mode === "mistakes"}
      clearMistakesOnCorrect={mode !== "mistakes"}
      locale={locale}
    />
  );
}
