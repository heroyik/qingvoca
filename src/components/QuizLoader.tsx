"use client";

import Link from "next/link";
import vocabData from "@/data/vocab.json";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import { getUnits, parseUnitId } from "@/utils/vocab";
import Quiz from "./Quiz";

interface QuizLoaderProps {
  unitId: string;
}

export default function QuizLoader({ unitId }: QuizLoaderProps) {
  const entries = vocabData.data as ChineseVocabEntry[];
  const step = parseUnitId(unitId);
  const units = getUnits([], entries);
  const unit = units.find((item) => item.step === step || item.id === unitId);

  if (!unit) {
    return (
      <main className="container min-h-screen flex-center flex-col gap-16">
        <h1 className="text-title">Unknown Step</h1>
        <p className="text-subtitle">Step {unitId} is not available.</p>
        <Link href="/" className="duo-button duo-button-primary w-auto px-40 no-underline">
          GO HOME
        </Link>
      </main>
    );
  }

  return <Quiz unitId={unit.id} unitWords={unit.words} allWords={entries} unitTitle={unit.title} />;
}
