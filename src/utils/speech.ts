import type { ChineseVocabEntry } from "../types/chinese-vocab";

export const CHINESE_VOICE_FALLBACKS = ["zh-CN", "zh-Hans"] as const;

export type SpeechVoiceLike = {
  lang: string;
  name?: string;
  default?: boolean;
};

export type SpeechSynthesisLike = {
  getVoices(): SpeechVoiceLike[];
  speak?(utterance: SpeechSynthesisUtterance): void;
  cancel?(): void;
};

export type ChineseSpeechResult =
  | { ok: true; voice: SpeechVoiceLike | null; lang: string; text: string }
  | { ok: false; reason: "unsupported" | "empty-text"; text: string };

export function selectChineseVoice(voices: SpeechVoiceLike[]): SpeechVoiceLike | null {
  const exact = voices.find((voice) => normalizeLang(voice.lang) === "zh-cn");
  if (exact) return exact;

  const hans = voices.find((voice) => normalizeLang(voice.lang) === "zh-hans");
  if (hans) return hans;

  const chinese = voices.find((voice) => normalizeLang(voice.lang).startsWith("zh"));
  if (chinese) return chinese;

  return voices.find((voice) => voice.default) ?? voices[0] ?? null;
}

export function getSpeechText(entry: Pick<ChineseVocabEntry, "word">): string {
  return entry.word;
}

export function createChineseUtterance(text: string, voice: SpeechVoiceLike | null): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || CHINESE_VOICE_FALLBACKS[0];
  if (voice && "voiceURI" in voice) {
    utterance.voice = voice as SpeechSynthesisVoice;
  }
  return utterance;
}

export function speakChineseWord(
  entry: Pick<ChineseVocabEntry, "word">,
  speechSynthesis: SpeechSynthesisLike | undefined,
): ChineseSpeechResult {
  const text = getSpeechText(entry).trim();

  if (!text) {
    return { ok: false, reason: "empty-text", text };
  }

  if (!speechSynthesis || typeof speechSynthesis.getVoices !== "function") {
    return { ok: false, reason: "unsupported", text };
  }

  const voice = selectChineseVoice(speechSynthesis.getVoices());
  const lang = voice?.lang || CHINESE_VOICE_FALLBACKS[0];

  if (typeof speechSynthesis.speak === "function" && typeof SpeechSynthesisUtterance !== "undefined") {
    speechSynthesis.speak(createChineseUtterance(text, voice));
  }

  return { ok: true, voice, lang, text };
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace("_", "-");
}
