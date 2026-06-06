import { readFile } from "node:fs/promises";

const { data: entries } = JSON.parse(await readFile("src/data/vocab.json", "utf8"));

function getDisplayMeaning(entry, locale = "ko") {
  const translations = entry.translations ?? {};
  if (locale === "ja") return translations.ja || translations.ko || entry.meaning || translations.en || entry.word;
  if (locale === "en") return translations.en || entry.meaning || translations.ko || entry.word;
  return translations.ko || entry.meaning || translations.en || entry.word;
}

function normalizeMeaning(meaning) {
  return meaning.trim().replace(/\s+/g, " ").toLowerCase();
}

function getPosTokens(pos) {
  return new Set(
    pos
      .toLowerCase()
      .replace(/\./g, "")
      .split(/[^a-z]+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function hasSharedPos(targetPos, candidatePos) {
  if (targetPos.size === 0) return false;
  for (const token of getPosTokens(candidatePos)) {
    if (targetPos.has(token)) return true;
  }
  return false;
}

function getDistractors(entry, locale, count = 3) {
  const answer = getDisplayMeaning(entry, locale);
  const seen = new Set([normalizeMeaning(answer), ""]);
  const targetPos = getPosTokens(entry.pos);

  return entries
    .filter((candidate) => candidate.id !== entry.id && candidate.hsk === entry.hsk)
    .map((candidate) => ({
      candidate,
      meaning: getDisplayMeaning(candidate, locale),
      posMatch: hasSharedPos(targetPos, candidate.pos),
      distance: Math.abs(candidate.step - entry.step),
    }))
    .filter(({ meaning }) => {
      const normalized = normalizeMeaning(meaning);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .sort(
      (a, b) =>
        Number(b.posMatch) - Number(a.posMatch) ||
        a.distance - b.distance ||
        a.candidate.step - b.candidate.step ||
        a.candidate.id.localeCompare(b.candidate.id),
    )
    .slice(0, count)
    .map(({ candidate, meaning, posMatch }) => ({ candidate, meaning, posMatch }));
}

const errors = [];

for (let step = 1; step <= 20; step += 1) {
  const words = entries.filter((entry) => entry.step === step);
  const lessons = [...new Set(words.map((entry) => entry.lessonId))].sort((a, b) => a - b);
  const expectedLessons = [step];

  if (words.length === 0) errors.push(`Step ${step} has no quiz words`);
  if (JSON.stringify(lessons) !== JSON.stringify(expectedLessons)) {
    errors.push(`Step ${step} lessons ${lessons.join(",")} expected ${expectedLessons.join(",")}`);
  }
}

for (const locale of ["ko", "ja", "en"]) {
  for (const entry of entries) {
    const answer = getDisplayMeaning(entry, locale);
    const distractors = getDistractors(entry, locale, 3);
    const options = [answer, ...distractors.map(({ meaning }) => meaning)];
    const unique = new Set(options.map(normalizeMeaning));
    const samePosAvailable = entries.filter(
      (candidate) =>
        candidate.id !== entry.id &&
        candidate.hsk === entry.hsk &&
        hasSharedPos(getPosTokens(entry.pos), candidate.pos) &&
        !new Set([normalizeMeaning(answer), ""]).has(normalizeMeaning(getDisplayMeaning(candidate, locale))),
    ).length;
    const expectedSamePosCount = Math.min(3, samePosAvailable);
    const samePosCount = distractors.filter(({ posMatch }) => posMatch).length;

    if (!entry.word || !entry.pinyin || !entry.pos) errors.push(`${entry.id} has empty quiz card field`);
    if (!answer) errors.push(`${entry.id} has empty ${locale} answer`);
    if (options.length !== 4) errors.push(`${entry.id} ${locale} option count is ${options.length}`);
    if (unique.size !== options.length) errors.push(`${entry.id} ${locale} has duplicate options`);
    if (options.some((option) => !option.trim())) errors.push(`${entry.id} ${locale} has blank option`);
    if (samePosCount < expectedSamePosCount) {
      errors.push(`${entry.id} ${locale} has ${samePosCount}/${expectedSamePosCount} same-pos distractors`);
    }
  }
}

const reviewIds = entries.slice(0, 10).map((entry) => entry.id);
const reviewWords = reviewIds
  .map((id) => entries.find((entry) => entry.id === id))
  .filter(Boolean);

if (reviewWords.length !== reviewIds.length) {
  errors.push(`review id lookup returned ${reviewWords.length}, expected ${reviewIds.length}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[step5] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step5] validation complete");
  console.log("[step5] quiz card fields: word, pinyin, pos");
  console.log("[step5] locales validated: ko, ja, en");
  console.log("[step5] all Step IDs map to one source lesson");
  console.log("[step5] distractors: same HSK4, same part of speech when available, non-empty, unique by locale meaning");
  console.log(`[step5] review id lookup sample: ${reviewWords.length}/${reviewIds.length}`);
}
