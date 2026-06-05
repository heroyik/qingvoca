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
  onvoiceschanged?: ((event: Event) => void) | (() => void) | null;
};

export type ChineseSpeechResult =
  | { ok: true; voice: SpeechVoiceLike | null; lang: string; text: string }
  | { ok: false; reason: "unsupported" | "empty-text"; text: string };

export type ChineseFeedbackTone = "correct" | "incorrect";

const CHINESE_FEEDBACK_PHRASES: Record<ChineseFeedbackTone, string[]> = {
  correct: ["对啦，真棒！", "没错，就是这样！", "太好了，答对了！"],
  incorrect: ["差一点，再试试！", "没关系，继续加油！", "哎呀，不对，看看答案吧！"],
};

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
  utterance.rate = 1.05;
  if (voice && "voiceURI" in voice) {
    utterance.voice = voice as SpeechSynthesisVoice;
  }
  return utterance;
}

export function speakChineseWord(
  entry: Pick<ChineseVocabEntry, "word">,
  speechSynthesis: SpeechSynthesisLike | undefined,
): ChineseSpeechResult {
  return speakChineseText(getSpeechText(entry), speechSynthesis);
}

export function speakChineseFeedback(
  tone: ChineseFeedbackTone,
  speechSynthesis: SpeechSynthesisLike | undefined,
): ChineseSpeechResult {
  const phrases = CHINESE_FEEDBACK_PHRASES[tone];
  const text = phrases[Math.floor(Math.random() * phrases.length)];
  return speakChineseText(text, speechSynthesis);
}

function speakChineseText(textInput: string, speechSynthesis: SpeechSynthesisLike | undefined): ChineseSpeechResult {
  const text = textInput.trim();

  if (!text) {
    return { ok: false, reason: "empty-text", text };
  }

  if (!speechSynthesis || typeof speechSynthesis.getVoices !== "function") {
    return { ok: false, reason: "unsupported", text };
  }

  const voices = speechSynthesis.getVoices();
  const voice = selectChineseVoice(voices);
  const lang = voice?.lang || CHINESE_VOICE_FALLBACKS[0];

  if (typeof speechSynthesis.speak === "function" && typeof SpeechSynthesisUtterance !== "undefined") {
    const speak = () => {
      const nextVoice = selectChineseVoice(speechSynthesis.getVoices()) ?? voice;
      speechSynthesis.cancel?.();
      speechSynthesis.speak?.(createChineseUtterance(text, nextVoice));
    };

    if (voices.length === 0 && "onvoiceschanged" in speechSynthesis) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        speak();
      };
      window.setTimeout(speak, 120);
    } else {
      speak();
    }
  }

  return { ok: true, voice, lang, text };
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace("_", "-");
}
