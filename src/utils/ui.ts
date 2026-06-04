import type { SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE } from "../types/chinese-vocab";

type UiStringKey =
  | "appTitle"
  | "word"
  | "pinyin"
  | "meaning"
  | "partOfSpeech"
  | "step"
  | "lesson"
  | "quiz"
  | "review"
  | "leaderboard"
  | "profile"
  | "admin"
  | "hsk"
  | "startQuiz"
  | "reviewCount"
  | "completedCount"
  | "recentWrongCount"
  | "showPinyin"
  | "playChineseAudio"
  | "localeLabel"
  | "adminEdit"
  | "lessonRange"
  | "wordCount";

const UI_STRINGS: Record<SupportedLocale, Record<UiStringKey, string>> = {
  ko: {
    appTitle: "중국어 KamiVoca",
    word: "중국어",
    pinyin: "병음",
    meaning: "뜻",
    partOfSpeech: "품사",
    step: "단계",
    lesson: "레슨",
    quiz: "퀴즈",
    review: "복습",
    leaderboard: "리더보드",
    profile: "프로필",
    admin: "관리자",
    hsk: "HSK",
    startQuiz: "퀴즈 시작",
    reviewCount: "복습 대상",
    completedCount: "완료",
    recentWrongCount: "최근 오답",
    showPinyin: "병음 표시",
    playChineseAudio: "중국어 음성 재생",
    localeLabel: "표시 언어",
    adminEdit: "관리자 편집",
    lessonRange: "레슨 범위",
    wordCount: "단어 수",
  },
  ja: {
    appTitle: "中国語 KamiVoca",
    word: "中国語",
    pinyin: "ピンイン",
    meaning: "意味",
    partOfSpeech: "品詞",
    step: "ステップ",
    lesson: "レッスン",
    quiz: "クイズ",
    review: "復習",
    leaderboard: "ランキング",
    profile: "プロフィール",
    admin: "管理者",
    hsk: "HSK",
    startQuiz: "クイズ開始",
    reviewCount: "復習対象",
    completedCount: "完了",
    recentWrongCount: "最近の誤答",
    showPinyin: "ピンイン表示",
    playChineseAudio: "中国語音声再生",
    localeLabel: "表示言語",
    adminEdit: "管理者編集",
    lessonRange: "レッスン範囲",
    wordCount: "単語数",
  },
  en: {
    appTitle: "Chinese KamiVoca",
    word: "Chinese",
    pinyin: "Pinyin",
    meaning: "Meaning",
    partOfSpeech: "Part of speech",
    step: "Step",
    lesson: "Lesson",
    quiz: "Quiz",
    review: "Review",
    leaderboard: "Leaderboard",
    profile: "Profile",
    admin: "Admin",
    hsk: "HSK",
    startQuiz: "Start quiz",
    reviewCount: "Review items",
    completedCount: "Completed",
    recentWrongCount: "Recent misses",
    showPinyin: "Show pinyin",
    playChineseAudio: "Play Chinese audio",
    localeLabel: "Display language",
    adminEdit: "Admin edit",
    lessonRange: "Lesson range",
    wordCount: "Word count",
  },
};

export function t(key: UiStringKey, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return UI_STRINGS[locale]?.[key] ?? UI_STRINGS[DEFAULT_LOCALE][key];
}

export function getUiStrings(locale: SupportedLocale = DEFAULT_LOCALE): Record<UiStringKey, string> {
  return UI_STRINGS[locale] ?? UI_STRINGS[DEFAULT_LOCALE];
}
