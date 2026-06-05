"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HomeIcon, TrophyIcon, BookOpenIcon, PencilSquareIcon, UserIcon } from "@heroicons/react/24/solid";
import AdminEditTab from "@/components/AdminEditTab";
import Leaderboard from "@/components/Leaderboard";
import { useGamification } from "@/hooks/useGamification";
import { isAdmin, APP_NAME, APP_VERSION } from "@/lib/constants";
import { createHomeStepCards, createReviewSummary, LOCALE_OPTIONS } from "@/utils/learningExperience";
import { getUnits, getTotalWordCount } from "@/utils/vocab";
import { loadLocale, saveLocale } from "@/utils/locale";
import { t, tpl } from "@/utils/ui";
import type { SupportedLocale } from "@/types/chinese-vocab";

type HomeTab = "learn" | "leader" | "review" | "profile" | "edit";

const getLevelTier = (index: number) => {
  if (index < 3) return "beginner";
  if (index < 7) return "intermediate";
  return "advanced";
};

const getLevelTitle = (index: number) => getLevelTier(index).toUpperCase();

const getLevelColor = (index: number, isLocked: boolean) => {
  if (isLocked) return "var(--border-light)";
  if (index < 3) return "var(--xh-red)";
  if (index < 7) return "var(--xh-navy)";
  return "var(--xh-gold)";
};

const getMotivationalSticker = (index: number) => {
  const stickers = [
    "第一步",
    "声调探索",
    "词语猎人",
    "短语构建",
    "稳步攀升",
    "语境阅读",
    "流利行动",
    "记忆锻造",
    "HSK冲刺",
    "最终复习",
  ];
  return stickers[index] || "加油";
};

export default function Home() {
  const { isAuthResolved, isOfflineMode, signInWithGoogle, signOutUser, stats, updateSettings, user, vocabEntries, theme, setTheme } =
    useGamification();
  const entries = vocabEntries;
  const [activeTab, setActiveTab] = useState<HomeTab>("learn");
  const [adminToolsUnlocked, setAdminToolsUnlocked] = useState(false);
  const [locale, setLocaleState] = useState<SupportedLocale>(() =>
    typeof window !== "undefined" ? loadLocale(window.localStorage) : "ko",
  );
  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    saveLocale(window.localStorage, newLocale);
  };
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
  const cards = useMemo(() => createHomeStepCards(entries, completedWordIds, locale), [entries, completedWordIds, locale]);
  const totalWords = getTotalWordCount([], entries);
  const showAdminTabs = adminToolsUnlocked;

  return (
    <main className="container min-h-screen pb-80 pt-68">
      <header className="sticky-header xh-header">
        <div className="header-left flex items-baseline gap-4">
          <h1 className="font-22 font-900 m-0 text-kv-kurenai leading-1-1 tracking-tight">{APP_NAME}</h1>
          <span className="version-badge">{APP_VERSION}</span>
        </div>
        <div className="header-right flex items-center gap-12">
          <button
            type="button"
            className="vocab-stash-pill mt-0 flex items-center gap-2 py-4 px-10 h-32 cursor-pointer"
            onClick={() => {
              const json = JSON.stringify(entries, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `qingvoca-hsk4-${entries.length}words.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 100);
            }}
          >
            <strong className="text-kv-kurenai font-12">{totalWords.toLocaleString()}</strong>
            {t("hskLevel", locale)}
          </button>
        </div>
      </header>

      {activeTab === "learn" && (
        <section className="learn-container">
          <div className="mt-24 mb-24">
            <h2 className="text-title">{t("learnTitle", locale)}</h2>
            <p className="text-subtitle">{t("learnSubtitle", locale)}</p>
          </div>

          <div className="unit-list">
            <svg className="connector-svg" aria-hidden="true" width={240} height={(cards.length - 1) * 220 + 84}>
              {/* Solid background path */}
              <path
                d={cards
                  .map((_, index) => {
                    const x = (120 + Math.sin(index * 1.2) * 60).toFixed(2);
                    const y = (index * 220 + 42).toFixed(2);
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="var(--border-light)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated dashed overlay */}
              <path
                className="connector-path-animated"
                d={cards
                  .map((_, index) => {
                    const x = (120 + Math.sin(index * 1.2) * 60).toFixed(2);
                    const y = (index * 220 + 42).toFixed(2);
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="var(--xh-kurenai)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12 24"
              />
            </svg>

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
                  {isCurrent && <div className="start-indicator">{t("startLabel", locale)}</div>}
                  <div
                    className={`unit-label-card tier-${tier}`}
                  >
                    <p className="font-11 font-900 letter-spacing-0-5 mb-1" style={{ color: getLevelColor(index, isLocked) }}>
                      {getLevelTitle(index)} {card.step}
                    </p>
                    <p className="font-16 font-900 text-main mt-4 mb-2">{card.title}</p>
                    <p className="font-13 font-800 text-subtitle mt-0 mb-2">
                      {card.lessonRange} · {card.hsk}
                    </p>
                    <p className="font-13 font-800 text-subtitle mt-0 mb-2">
                      {tpl(t("wordsProgress", locale), { count: card.wordCount, pct: card.progressPercent })}
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
              <div className="review-header-icon">📖</div>
              <h2 className="text-title m-0">{t("reviewTitle", locale)}</h2>
            </div>
            <div className="stat-container">
              <span className="stat-value">{reviewSummary.reviewCount}</span>
              <span className="stat-label">{t("reviewItems", locale)}</span>
            </div>
            {reviewSummary.reviewCount > 0 && (
              <p className="text-subtitle">
                {tpl(t("reviewStats", locale), { completed: reviewSummary.completedCount.toLocaleString(), wrong: reviewSummary.recentWrongCount.toLocaleString() })}
              </p>
            )}
            {reviewSummary.reviewCount > 0 && (
              <Link href="/quiz/review" className="duo-button duo-button-primary button-standard w-full flex-center no-underline">
                {t("startReviewLabel", locale)}
              </Link>
            )}
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
            <h2 className="text-title m-0">{t("profileTitle", locale)}</h2>
            {user && (
              <div className="avatar-container mt-16 mx-auto">
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={user.photoURL} alt={user.displayName || "Profile"} width={100} height={100} className="object-cover" style={{ width: "100%", height: "100%" }} />
                ) : (
                  <span className="font-900" style={{ fontSize: 36, color: "var(--xh-red)" }}>
                    {(user.displayName || user.email || "Q").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            <p className="text-subtitle">
              {user
                ? `${user.displayName || user.email || stats.displayName}${user.email ? ` (${user.email})` : ""}`
                : ""}
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
              {user ? t("signOut", locale) : t("signInWithGoogle", locale)}
            </button>
            <p className="text-subtitle">{t("localeSelect", locale)}</p>
            <div className="flex gap-8 flex-wrap">
              {LOCALE_OPTIONS.map((option) => (
                <button
                  key={option.locale}
                  className={`duo-button w-auto px-20 ${option.locale === locale ? "duo-button-primary" : "duo-button-secondary"}`}
                  type="button"
                  onClick={() => setLocale(option.locale)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isAdmin(user) && (
              <label className="flex items-center justify-between gap-12 mt-16 font-800">
                {t("unlockAllLevels", locale)}
                <input
                  type="checkbox"
                  checked={stats.settings.unlockAllLevels}
                  onChange={(event) => updateSettings({ unlockAllLevels: event.currentTarget.checked })}
                />
              </label>
            )}

            {/* Theme Toggle */}
            <div className="settings-section">
              <div className="settings-item">
                <span className="font-800">{t("darkMode", locale)}</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={(event) => setTheme(event.currentTarget.checked ? "dark" : "light")}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {isAdmin(user) && (
              <button
                className="duo-button duo-button-primary w-full mt-16"
                type="button"
                onClick={() => setAdminToolsUnlocked(true)}
              >
                {t("openAdminEdit", locale)}
              </button>
            )}
          </div>
        </section>
      )}

      {activeTab === "edit" && showAdminTabs && (
        <section className="review-content">
          <div className="review-card-modern">
            <AdminEditTab locale={locale} />
          </div>
        </section>
      )}

      <nav className="footer-nav">
        <button
          type="button"
          onClick={() => setActiveTab("learn")}
          className={`nav-item ${activeTab === "learn" ? "active" : ""}`}
        >
          <HomeIcon width={24} height={24} />
          <span className="font-10 font-800">LEARN</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leader")}
          className={`nav-item ${activeTab === "leader" ? "active" : ""}`}
        >
          <TrophyIcon width={24} height={24} />
          <span className="font-10 font-800">LEADER</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("review")}
          className={`nav-item ${activeTab === "review" ? "active" : ""}`}
        >
          <BookOpenIcon width={24} height={24} />
          <span className="font-10 font-800">REVIEW</span>
        </button>
        {showAdminTabs && (
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`nav-item ${activeTab === "edit" ? "active" : ""}`}
          >
            <PencilSquareIcon width={24} height={24} />
            <span className="font-10 font-800">EDIT</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
        >
          <UserIcon width={24} height={24} />
          <span className="font-10 font-800">ME</span>
        </button>

        <div className="aura-bar">
          <div className="flex items-center gap-3 mr-4">
            <span className="text-duo-orange font-14 font-700">🔥 {stats.streak}</span>
            <span className="text-duo-blue font-14 font-700">💎 {stats.gems}</span>
          </div>
          <div className="separator-v"></div>
          <div>
            {t("learningPoints", locale)} <strong className="text-kv-kurenai font-15">{stats.xp} ✨</strong>
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
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

        @keyframes dash-flow {
          to {
            stroke-dashoffset: -36;
          }
        }

        .connector-path-animated {
          animation: dash-flow 1.5s linear infinite;
        }
      `}</style>
    </main>
  );
}
