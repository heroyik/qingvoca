"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import AdminEditTab from "@/components/AdminEditTab";
import Leaderboard from "@/components/Leaderboard";
import { useGamification } from "@/hooks/useGamification";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { createHomeStepCards, createReviewSummary, LOCALE_OPTIONS } from "@/utils/learningExperience";
import { getUnits, getTotalWordCount } from "@/utils/vocab";

type HomeTab = "learn" | "leader" | "review" | "profile" | "edit";

const getLevelTier = (index: number) => {
  if (index < 3) return "beginner";
  if (index < 7) return "intermediate";
  return "advanced";
};

const getLevelTitle = (index: number) => getLevelTier(index).toUpperCase();

const getLevelColor = (index: number, isLocked: boolean) => {
  if (isLocked) return "#afafaf";
  if (index < 3) return "var(--kv-kurenai)";
  if (index < 7) return "var(--kv-ai-iro)";
  return "var(--kv-kintsugi-gold)";
};

const getMotivationalSticker = (index: number) => {
  const stickers = [
    "First Steps",
    "Tone Finder",
    "Word Hunter",
    "Phrase Builder",
    "Steady Climb",
    "Context Reader",
    "Fluent Moves",
    "Memory Forge",
    "HSK Sprint",
    "Final Review",
  ];
  return stickers[index] || "Keep Going";
};

export default function Home() {
  const { isAuthResolved, isOfflineMode, signInWithGoogle, signOutUser, stats, updateSettings, user, vocabEntries } =
    useGamification();
  const entries = vocabEntries;
  const [activeTab, setActiveTab] = useState<HomeTab>("learn");
  const [adminToolsUnlocked, setAdminToolsUnlocked] = useState(false);
  const units = useMemo(() => getUnits([], entries), [entries]);
  const completedWordIds = useMemo(
    () =>
      units
        .filter((unit) => stats.completedUnits.includes(unit.id))
        .flatMap((unit) => unit.words.map((word) => word.id)),
    [stats.completedUnits, units],
  );
  const reviewWordIds = useMemo(() => Object.keys(stats.mistakes), [stats.mistakes]);
  const reviewSummary = createReviewSummary({
    reviewWordIds,
    completedWordIds,
    recentWrongWordIds: reviewWordIds,
  });
  const cards = useMemo(() => createHomeStepCards(entries, completedWordIds), [entries, completedWordIds]);
  const totalWords = getTotalWordCount([], entries);
  const showAdminTabs = adminToolsUnlocked;

  return (
    <main className="container min-h-screen pb-80 pt-68">
      <header className="sticky-header japanese-header">
        <div className="header-left flex items-baseline gap-4">
          <h1 className="font-22 font-900 m-0 text-kv-kurenai leading-1-1 tracking-tight">{APP_NAME}</h1>
          <span className="version-badge">{APP_VERSION}</span>
        </div>
        <div className="header-right flex items-center gap-12">
          <div className="vocab-stash-pill mt-0 flex items-center gap-2 py-4 px-10 h-32">
            <strong className="text-kv-kurenai font-12">{totalWords.toLocaleString()}</strong>
            HSK4
          </div>
        </div>
      </header>

      {activeTab === "learn" && (
        <section className="learn-container">
          <div className="mt-24 mb-24">
            <h2 className="text-title">중국어 HSK4 단어장</h2>
            <p className="text-subtitle">Step 1부터 Step 10까지, 원본 Lesson 1-20을 2개씩 묶어 학습합니다.</p>
          </div>

          <svg className="connector-svg" aria-hidden="true">
            <path
              d={cards
                .map((_, index) => {
                  const x = (120 + Math.sin(index * 1.2) * 60).toFixed(2);
                  const y = (index * 170).toFixed(2);
                  return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="unit-list">
            {cards.map((card, index) => {
              const previousUnitId = units[index - 1]?.id;
              const isLocked =
                !stats.settings.unlockAllLevels &&
                index > 0 &&
                Boolean(previousUnitId) &&
                !stats.completedUnits.includes(previousUnitId);
              const isCurrent = !isLocked && !stats.completedUnits.includes(units[index]?.id ?? "");
              const tier = getLevelTier(index);
              const unit = units[index];

              return (
                <Link
                  key={card.step}
                  className={`unit-node ${isLocked ? "locked" : "available"} ${tier}`}
                  href={isLocked ? "/" : `/quiz/${unit?.id ?? `unit-${card.step}`}`}
                  aria-disabled={isLocked}
                  onClick={(event) => {
                    if (isLocked) event.preventDefault();
                  }}
                  style={{ marginLeft: `${Math.sin(index * 1.2) * 60}px` }}
                >
                  <div className="unit-circle" style={{ backgroundColor: getLevelColor(index, isLocked) }}>
                    <span className="font-24">{card.step}</span>
                  </div>
                  {isCurrent && <div className="start-indicator">START</div>}
                  <div
                    className={`unit-label-card tier-${tier}`}
                    style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.1)" }}
                  >
                    <p className="font-11 font-900 letter-spacing-0-5 mb-1" style={{ color: getLevelColor(index, isLocked) }}>
                      {getLevelTitle(index)} {card.step}
                    </p>
                    <p className="font-16 font-900 text-main mt-4 mb-2">{card.title}</p>
                    <p className="font-13 font-800 text-subtitle mt-0 mb-2">
                      {card.lessonRange} · {card.hsk}
                    </p>
                    <p className="font-13 font-800 text-subtitle mt-0 mb-2">
                      {card.wordCount} words · {card.progressPercent}% complete
                    </p>
                    <p className="font-14 font-800 text-main mt-4">{getMotivationalSticker(index)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "review" && (
        <section className="review-content">
          <div className="review-card-modern">
            <div className="review-header">
              <div className="review-header-icon">📚</div>
              <h2 className="text-title m-0">복습</h2>
            </div>
            <div className="stat-container">
              <span className="stat-value">{reviewSummary.reviewCount}</span>
              <span className="stat-label">review items</span>
            </div>
            <p className="text-subtitle">
              완료 {reviewSummary.completedCount.toLocaleString()}개 · 최근 오답{" "}
              {reviewSummary.recentWrongCount.toLocaleString()}개
            </p>
            <Link href="/quiz/review" className="duo-button duo-button-primary button-standard w-full flex-center no-underline">
              START REVIEW
            </Link>
          </div>
        </section>
      )}

      {activeTab === "leader" && (
        <section className="review-content">
          <div className="review-card-modern">
            <Leaderboard />
          </div>
        </section>
      )}

      {activeTab === "profile" && (
        <section className="review-content">
          <div className="review-card-modern">
            <h2 className="text-title m-0">프로필</h2>
            <p className="text-subtitle">
              {user
                ? `${user.displayName || stats.displayName} · Firestore 동기화 중`
                : isOfflineMode
                  ? "Firebase env 미설정: 로컬 진행도 모드"
                  : "Google 로그인으로 진행도를 동기화할 수 있습니다."}
            </p>
            <button
              className="duo-button duo-button-primary w-full mb-16"
              type="button"
              disabled={!isAuthResolved || isOfflineMode}
              onClick={() => {
                if (user) {
                  void signOutUser();
                } else {
                  void signInWithGoogle();
                }
              }}
            >
              {user ? "로그아웃" : "Google 로그인"}
            </button>
            <p className="text-subtitle">로케일 선택</p>
            <div className="flex gap-8 flex-wrap">
              {LOCALE_OPTIONS.map((option) => (
                <button key={option.locale} className="duo-button duo-button-secondary w-auto px-20" type="button">
                  {option.label}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between gap-12 mt-16 font-800">
              전체 Step 잠금 해제
              <input
                type="checkbox"
                checked={stats.settings.unlockAllLevels}
                onChange={(event) => updateSettings({ unlockAllLevels: event.currentTarget.checked })}
              />
            </label>
            <button
              className="duo-button duo-button-primary w-full mt-16"
              type="button"
              onClick={() => setAdminToolsUnlocked(true)}
            >
              관리자 EDIT 열기
            </button>
          </div>
        </section>
      )}

      {activeTab === "edit" && showAdminTabs && (
        <section className="review-content">
          <div className="review-card-modern">
            <AdminEditTab />
          </div>
        </section>
      )}

      <nav className="footer-nav">
        <button
          type="button"
          onClick={() => setActiveTab("learn")}
          className={`nav-item ${activeTab === "learn" ? "active" : ""}`}
        >
          <span className="font-24">⌂</span>
          <span className="font-10 font-800">LEARN</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leader")}
          className={`nav-item ${activeTab === "leader" ? "active" : ""}`}
        >
          <span className="font-24">🏆</span>
          <span className="font-10 font-800">LEADER</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("review")}
          className={`nav-item ${activeTab === "review" ? "active" : ""}`}
        >
          <span className="font-24">📚</span>
          <span className="font-10 font-800">REVIEW</span>
        </button>
        {showAdminTabs && (
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`nav-item ${activeTab === "edit" ? "active" : ""}`}
          >
            <span className="font-24">✎</span>
            <span className="font-10 font-800">EDIT</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
        >
          <span className="font-24">◉</span>
          <span className="font-10 font-800">ME</span>
        </button>

        <div className="aura-bar">
          <div className="flex items-center gap-3 mr-4">
            <span className="text-duo-orange font-14 font-700">🔥 {stats.streak}</span>
            <span className="text-duo-blue font-14 font-700">💎 {stats.gems}</span>
          </div>
          <div className="separator-v"></div>
          <div>
            My Learning Aura: <strong className="text-kv-kurenai font-15">{stats.xp} ✨</strong>
          </div>
          <div className="separator-v"></div>
          <a
            href="https://github.com/heroyik/qingvoca"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            title="GitHub Repository"
            className="aura-link"
          >
            <Github size={16} />
          </a>
        </div>
      </nav>

      <style jsx global>{`
        @keyframes pulse-node {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}
