import type { SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE } from "../types/chinese-vocab";

export type UiStringKey =
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
  | "wordCount"
  | "learnTitle"
  | "learnSubtitle"
  | "wordsProgress"
  | "startLabel"
  | "startReviewLabel"
  | "reviewTitle"
  | "reviewItems"
  | "reviewStats"
  | "profileTitle"
  | "localeSelect"
  | "unlockAllLevels"
  | "darkMode"
  | "openAdminEdit"
  | "signOut"
  | "signInWithGoogle"
  | "offlineModeMessage"
  | "signInPrompt"
  | "learningPoints"
  | "noQuizWords"
  | "goHome"
  | "quizDataError"
  | "reviewComplete"
  | "stepComplete"
  | "correctCount"
  | "reviewHint"
  | "home"
  | "retry"
  | "playAudio"
  | "audioOff"
  | "stepLesson"
  | "correct"
  | "answerLabel"
  | "next"
  | "noReviewWords"
  | "noReviewWordsHint"
  | "unknownStep"
  | "stepNotAvailable"
  | "hskLevel";

const UI_STRINGS: Record<SupportedLocale, Record<UiStringKey, string>> = {
  ko: {
    appTitle: "QingVoca",
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
    learnTitle: "중국어 HSK4 단어장",
    learnSubtitle: "Step 1부터 Step 10까지, 원본 Lesson 1-20을 2개씩 묶어 학습합니다.",
    wordsProgress: "{count}개 단어 · {pct}% 완료",
    startLabel: "开始 START",
    startReviewLabel: "开始 REVIEW",
    reviewTitle: "복습",
    reviewItems: "복습 대상",
    reviewStats: "완료 {completed}개 · 최근 오답 {wrong}개",
    profileTitle: "프로필",
    localeSelect: "로케일 선택",
    unlockAllLevels: "전체 Step 잠금 해제",
    darkMode: "🌙 다크모드",
    openAdminEdit: "관리자 EDIT 열기",
    signOut: "로그아웃",
    signInWithGoogle: "Google 로그인",
    offlineModeMessage: "Firebase env 미설정: 로컬 진행도 모드",
    signInPrompt: "Google 로그인으로 진행도를 동기화할 수 있습니다.",
    learningPoints: "학습 포인트:",
    noQuizWords: "퀴즈 단어 없음",
    goHome: "메인으로",
    quizDataError: "퀴즈 데이터 오류",
    reviewComplete: "복습 완료",
    stepComplete: "단계 완료",
    correctCount: "정답 {score} / {total} · {pct}%",
    reviewHint: "{count}개 단어가 다음 학습 단계에서 복습 대상에 추가됩니다.",
    home: "메인",
    retry: " 다시 풀기",
    playAudio: "중국어 음성 재생",
    audioOff: "음성 꺼짐",
    stepLesson: "Step {step} · Lesson {lesson}",
    correct: "정답!",
    answerLabel: "정답:",
    next: "다음",
    noReviewWords: "복습할 단어가 없습니다",
    noReviewWordsHint: "퀴즈에서 틀린 단어가 생기면 이곳에 자동으로 모입니다.",
    unknownStep: "알 수 없는 단계",
    stepNotAvailable: "{id} 단계는 현재 사용할 수 없습니다.",
    hskLevel: "HSK4",
  },
  ja: {
    appTitle: "QingVoca",
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
    learnTitle: "中国語 HSK4 単語帳",
    learnSubtitle: "Step 1〜Step 10まで、元のLesson 1-20を2つずつまとめて学習します。",
    wordsProgress: "{count}語 · {pct}% 完了",
    startLabel: "开始 START",
    startReviewLabel: "开始 REVIEW",
    reviewTitle: "復習",
    reviewItems: "復習対象",
    reviewStats: "完了 {completed}件 · 最近の誤答 {wrong}件",
    profileTitle: "プロフィール",
    localeSelect: "表示言語",
    unlockAllLevels: "全Stepのロック解除",
    darkMode: "🌙 ダークモード",
    openAdminEdit: "管理者 EDIT を開く",
    signOut: "ログアウト",
    signInWithGoogle: "Google ログイン",
    offlineModeMessage: "Firebase env 未設定: ローカル進行度モード",
    signInPrompt: "Google ログインで進行度を同期できます。",
    learningPoints: "学習ポイント:",
    noQuizWords: "クイズ単語なし",
    goHome: "ホームへ",
    quizDataError: "クイズデータエラー",
    reviewComplete: "復習完了",
    stepComplete: "ステップ完了",
    correctCount: "正解 {score} / {total} · {pct}%",
    reviewHint: "{count}語が次の学習ステップで復習対象に追加されます。",
    home: "ホーム",
    retry: " やり直す",
    playAudio: "中国語音声再生",
    audioOff: "音声オフ",
    stepLesson: "Step {step} · Lesson {lesson}",
    correct: "正解！",
    answerLabel: "正解:",
    next: "次へ",
    noReviewWords: "復習する単語がありません",
    noReviewWordsHint: "クイズで間違えた単語はここに自動的に集まります。",
    unknownStep: "不明なステップ",
    stepNotAvailable: "ステップ {id} は現在利用できません。",
    hskLevel: "HSK4",
  },
  en: {
    appTitle: "QingVoca",
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
    learnTitle: "Chinese HSK4 Vocabulary",
    learnSubtitle: "Steps 1–10, covering original Lessons 1–20 in pairs.",
    wordsProgress: "{count} words · {pct}% complete",
    startLabel: "开始 START",
    startReviewLabel: "开始 REVIEW",
    reviewTitle: "Review",
    reviewItems: "Review items",
    reviewStats: "{completed} completed · {wrong} recent misses",
    profileTitle: "Profile",
    localeSelect: "Display language",
    unlockAllLevels: "Unlock all steps",
    darkMode: "🌙 Dark mode",
    openAdminEdit: "Open admin edit",
    signOut: "Sign out",
    signInWithGoogle: "Google Sign in",
    offlineModeMessage: "Firebase env not set: local progress mode",
    signInPrompt: "Sign in with Google to sync your progress.",
    learningPoints: "XP:",
    noQuizWords: "No quiz words",
    goHome: "GO HOME",
    quizDataError: "Quiz data error",
    reviewComplete: "Review Complete",
    stepComplete: "Step Complete",
    correctCount: "{score} / {total} correct · {pct}%",
    reviewHint: "{count} words should go to review in the next gamification step.",
    home: "HOME",
    retry: "RETRY",
    playAudio: "Play Chinese audio",
    audioOff: "Audio off",
    stepLesson: "Step {step} · Lesson {lesson}",
    correct: "Correct!",
    answerLabel: "Answer:",
    next: "NEXT",
    noReviewWords: "No words to review",
    noReviewWordsHint: "Missed words from quizzes will appear here automatically.",
    unknownStep: "Unknown Step",
    stepNotAvailable: "Step {id} is not available.",
    hskLevel: "HSK4",
  },
};

export function t(key: UiStringKey, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return UI_STRINGS[locale]?.[key] ?? UI_STRINGS[DEFAULT_LOCALE][key];
}

export function getUiStrings(locale: SupportedLocale = DEFAULT_LOCALE): Record<UiStringKey, string> {
  return UI_STRINGS[locale] ?? UI_STRINGS[DEFAULT_LOCALE];
}

/** Simple template helper: replaces {key} placeholders with values. */
export function tpl(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}
