import type { ChineseVocabEntry } from "../types/chinese-vocab";

export const CHINESE_VOICE_FALLBACKS = ["zh-CN", "zh-Hans"] as const;
const GOOGLE_TTS_URL = "https://translate.google.com/translate_tts";
const YOUDAO_TTS_URL = "https://dict.youdao.com/dictvoice";

export type SpeechVoiceLike = {
  lang: string;
  name?: string;
  default?: boolean;
};

type SpeechUtteranceLike = SpeechSynthesisUtterance & {
  onstart: (() => void) | null;
};

type NavigatorWithBrave = Navigator & {
  brave?: unknown;
};

export type SpeechSynthesisLike = {
  getVoices(): SpeechVoiceLike[];
  speak?(utterance: SpeechSynthesisUtterance): void;
  cancel?(): void;
  resume?(): void;
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

let activeAudio: HTMLAudioElement | null = null;

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

  if (shouldUseAudioFallback()) {
    playAudioFallback(text);
    return { ok: true, voice: null, lang: CHINESE_VOICE_FALLBACKS[0], text };
  }

  if (!speechSynthesis || typeof speechSynthesis.getVoices !== "function") {
    playAudioFallback(text);
    return { ok: false, reason: "unsupported", text };
  }

  const voices = speechSynthesis.getVoices();
  const voice = selectChineseVoice(voices);
  const lang = voice?.lang || CHINESE_VOICE_FALLBACKS[0];

  if (typeof speechSynthesis.speak === "function" && typeof SpeechSynthesisUtterance !== "undefined") {
    const speak = (retryOnStall: boolean) => {
      const nextVoice = selectChineseVoice(speechSynthesis.getVoices()) ?? voice;
      let didStart = false;
      const utterance = createChineseUtterance(text, nextVoice) as SpeechUtteranceLike;
      utterance.onstart = () => {
        didStart = true;
      };
      speechSynthesis.cancel?.();
      speechSynthesis.resume?.();
      speechSynthesis.speak?.(utterance);
      window.setTimeout(() => {
        if (!retryOnStall || didStart) return;
        speechSynthesis.resume?.();
        speechSynthesis.speak?.(createChineseUtterance(text, nextVoice));
      }, 180);
    };

    speak(true);

    if (voices.length === 0 && "onvoiceschanged" in speechSynthesis) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        speak(false);
      };
    }
  }

  return { ok: true, voice, lang, text };
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace("_", "-");
}

function shouldUseAudioFallback(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as NavigatorWithBrave).brave);
}

function playAudioFallback(text: string) {
  if (typeof Audio === "undefined") return;
  activeAudio?.pause();
  playAudioUrls(createFallbackAudioUrls(text));
}

function createFallbackAudioUrls(text: string): string[] {
  const encoded = encodeURIComponent(text);
  return [
    `${YOUDAO_TTS_URL}?audio=${encoded}&type=2`,
    `${GOOGLE_TTS_URL}?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${encoded}`,
  ];
}

function playAudioUrls(urls: string[]) {
  const [url, ...nextUrls] = urls;
  if (!url) return;

  const audio = new Audio(url);
  activeAudio = audio;
  audio.preload = "auto";
  audio.onerror = () => {
    if (activeAudio === audio) playAudioUrls(nextUrls);
  };
  void audio.play().catch(() => {
    if (activeAudio === audio) playAudioUrls(nextUrls);
  });
}
