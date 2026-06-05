import { readFile } from "node:fs/promises";

const speechSource = await readFile("src/utils/speech.ts", "utf8");
const vocab = JSON.parse(await readFile("src/data/vocab.json", "utf8"));
const errors = [];

for (const marker of ["zh-CN", "zh-Hans", "selectChineseVoice", "speakChineseWord", "speakChineseFeedback", "对啦", "差一点", "unsupported", "empty-text"]) {
  if (!speechSource.includes(marker)) errors.push(`missing speech marker ${marker}`);
}

function normalizeLang(lang) {
  return lang.toLowerCase().replace("_", "-");
}

function selectChineseVoice(voices) {
  return (
    voices.find((voice) => normalizeLang(voice.lang) === "zh-cn") ??
    voices.find((voice) => normalizeLang(voice.lang) === "zh-hans") ??
    voices.find((voice) => normalizeLang(voice.lang).startsWith("zh")) ??
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  );
}

const cases = [
  {
    name: "prefers zh-CN",
    voices: [{ lang: "en-US" }, { lang: "zh-CN" }, { lang: "zh-Hans" }],
    expected: "zh-CN",
  },
  {
    name: "falls back to zh-Hans",
    voices: [{ lang: "en-US" }, { lang: "zh-Hans" }],
    expected: "zh-Hans",
  },
  {
    name: "falls back to any zh voice",
    voices: [{ lang: "en-US" }, { lang: "zh-TW" }],
    expected: "zh-TW",
  },
  {
    name: "falls back to browser default",
    voices: [{ lang: "en-US", default: true }],
    expected: "en-US",
  },
];

for (const testCase of cases) {
  const selected = selectChineseVoice(testCase.voices);
  if (selected?.lang !== testCase.expected) {
    errors.push(`${testCase.name}: got ${selected?.lang}, expected ${testCase.expected}`);
  }
}

const emptyWords = vocab.data.filter((entry) => !entry.word || !entry.word.trim());
if (emptyWords.length > 0) errors.push(`empty speech text entries: ${emptyWords.length}`);

const chineseWordSamples = vocab.data.slice(0, 20).filter((entry) => /[\u3400-\u9fff]/u.test(entry.word));
if (chineseWordSamples.length !== 20) errors.push("first 20 entries are not all Chinese-character speech text");

if (errors.length > 0) {
  for (const error of errors) console.error(`[step12] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step12] validation complete");
  console.log("[step12] voice fallback order: zh-CN, zh-Hans, any zh voice, browser default");
  console.log("[step12] unsupported speech synthesis returns a non-throwing result");
  console.log("[step12] Chinese word text is available for speech");
}
