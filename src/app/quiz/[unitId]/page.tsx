import { Suspense } from "react";
import { getAvailableSteps, parseUnitId } from "@/utils/vocab";
import vocabData from "@/data/vocab.json";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import QuizLoader from "@/components/QuizLoader";

interface QuizPageProps {
  params: Promise<{
    unitId: string;
  }>;
}

export async function generateStaticParams() {
  const entries = vocabData.data as ChineseVocabEntry[];
  return getAvailableSteps(entries).flatMap((step) => [{ unitId: String(step) }, { unitId: `unit-${step}` }]);
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { unitId } = await params;
  parseUnitId(unitId);
  return (
    <Suspense fallback={<div className="flex-center min-h-screen font-800">Loading quiz...</div>}>
      <QuizLoader unitId={unitId} />
    </Suspense>
  );
}
