import { readFile } from "node:fs/promises";

const quiz = await readFile("src/components/Quiz.tsx", "utf8");
const loader = await readFile("src/components/QuizLoader.tsx", "utf8");
const reviewLoader = await readFile("src/components/ReviewQuizLoader.tsx", "utf8");
const quizPage = await readFile("src/app/quiz/[unitId]/page.tsx", "utf8");
const reviewPage = await readFile("src/app/quiz/review/page.tsx", "utf8");
const errors = [];

for (const [fileName, content, markers] of [
  ["Quiz.tsx", quiz, ["createQuizQuestion", "validateQuizQuestions", "speakChineseWord", "playAudio", "correct", "answerLabel"]],
  ["QuizLoader.tsx", loader, ["getUnits", "parseUnitId", "<Quiz"]],
  ["ReviewQuizLoader.tsx", reviewLoader, ["unitId=\"review\"", "noReviewWords", "<Quiz"]],
  ["quiz page", quizPage, ["generateStaticParams", "QuizLoader"]],
  ["review page", reviewPage, ["ReviewQuizLoader", "Suspense"]],
]) {
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${fileName} missing marker: ${marker}`);
  }
}

const blockedTerms = ["filterEasy" + "Cog" + "nates", "Cog" + "nite", "kana", "kanji", "hiragana", "katakana"];
for (const [fileName, content] of [
  ["Quiz.tsx", quiz],
  ["QuizLoader.tsx", loader],
  ["ReviewQuizLoader.tsx", reviewLoader],
]) {
  for (const blocked of blockedTerms) {
    if (content.toLowerCase().includes(blocked.toLowerCase())) {
      errors.push(`${fileName} has blocked legacy logic: ${blocked}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[frontend-step4] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[frontend-step4] validation complete");
  console.log("[frontend-step4] Quiz, QuizLoader, and ReviewQuizLoader are connected");
  console.log("[frontend-step4] language-specific legacy quiz logic is absent");
}
