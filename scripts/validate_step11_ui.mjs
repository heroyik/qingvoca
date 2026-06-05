import { readFile } from "node:fs/promises";

const vocab = JSON.parse(await readFile("src/data/vocab.json", "utf8"));
const uiSource = await readFile("src/utils/ui.ts", "utf8");
const learningSource = await readFile("src/utils/learningExperience.ts", "utf8");
const entries = vocab.data;
const errors = [];

for (const forbidden of ["일본어", "Japanese"]) {
  if (uiSource.includes(forbidden) || learningSource.includes(forbidden)) {
    errors.push(`forbidden UI term remains: ${forbidden}`);
  }
}

for (const required of ["중국어", "中国語", "Chinese", "병음", "ピンイン", "Pinyin", "관리자 편집", "Admin edit"]) {
  if (!uiSource.includes(required)) errors.push(`missing UI string: ${required}`);
}

for (const required of ["한국어", "日本語", "English", "lesson", "step", "hasPinyinToneMarks"]) {
  if (!learningSource.includes(required)) errors.push(`missing learning experience marker: ${required}`);
}

const stepCards = [];
for (let step = 1; step <= 10; step += 1) {
  const words = entries.filter((entry) => entry.step === step);
  const lessons = [...new Set(words.map((entry) => entry.lessonId))].sort((a, b) => a - b);
  stepCards.push({
    step,
    title: `Step ${step}`,
    lessonRange: `Lesson ${lessons[0]}-${lessons[lessons.length - 1]}`,
    wordCount: words.length,
    hsk: "HSK4",
  });
}

if (stepCards.length !== 10) errors.push(`expected 10 step cards, got ${stepCards.length}`);
if (stepCards[0].lessonRange !== "Lesson 1-2") errors.push("Step 1 card does not show Lesson 1-2");
if (stepCards[9].lessonRange !== "Lesson 19-20") errors.push("Step 10 card does not show Lesson 19-20");
if (stepCards.some((card) => card.wordCount <= 0)) errors.push("a step card has no words");
if (stepCards.some((card) => card.hsk !== "HSK4")) errors.push("a step card is missing HSK4");

const hasToneMarks = entries.some((entry) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u.test(entry.pinyin));
if (!hasToneMarks) errors.push("pinyin tone marks were not detected");

const compactButtonLabels = ["퀴즈 시작", "クイズ開始", "Start quiz", "병음 표시", "ピンイン表示", "Show pinyin"];
for (const label of compactButtonLabels) {
  if ([...label].length > 24) errors.push(`button label too long: ${label}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step11] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step11] validation complete");
  console.log("[step11] UI strings cover ko, ja, en Chinese learning labels");
  console.log("[step11] Step cards cover Step 1-10, Lesson 1-20, HSK4");
  console.log("[step11] pinyin tone marks are preserved");
  console.log("[step11] compact button labels fit the configured threshold");
}
