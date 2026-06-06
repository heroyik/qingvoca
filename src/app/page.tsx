"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { HomeIcon, TrophyIcon, BookOpenIcon, PencilSquareIcon, UserIcon } from "@heroicons/react/24/solid";
import AdminEditTab from "@/components/AdminEditTab";
import Leaderboard from "@/components/Leaderboard";
import ReviewTab from "@/components/ReviewTab";
import { useGamification } from "@/hooks/useGamification";
import { isAdmin, APP_NAME, APP_VERSION } from "@/lib/constants";
import { createHomeStepCards, LOCALE_OPTIONS } from "@/utils/learningExperience";
import { getUnits, getTotalWordCount, normalizeVocabWordKey } from "@/utils/vocab";
import { loadLocale, saveLocale } from "@/utils/locale";
import { t, tpl } from "@/utils/ui";
import type { SupportedLocale } from "@/types/chinese-vocab";

type HomeTab = "learn" | "leader" | "review" | "profile" | "edit";

const WeatherBackground = dynamic(
  () => import("@/components/WeatherBackground").then((module) => module.WeatherBackground),
  { ssr: false },
);

const getLevelTier = (index: number) => {
  if (index < 3) return "beginner";
  if (index < 7) return "intermediate";
  return "advanced";
};

const getLevelTitle = (index: number) => getLevelTier(index).toUpperCase();

const SNAKE_PATH_WIDTH = 260;
const SNAKE_PATH_CENTER_X = SNAKE_PATH_WIDTH / 2;
const SNAKE_NODE_CENTER_Y = 44;
const SNAKE_NODE_STEP_Y = 240;
const getSnakeOffset = (index: number) => Math.sin(index * 1.2) * 60;

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

const getUnitIcon = (index: number, isLocked: boolean, isCompleted: boolean, isMastered: boolean) => {
  if (isLocked) return "🔒";
  if (isMastered) return "冠";
  if (isCompleted) return "✓";
  return index + 1;
};

const getProfileInitial = (name: string) => (name.trim().charAt(0) || "Q").toUpperCase();

const getProfileAvatarColor = (seed: string) => {
  const colors = ["var(--xh-red)", "var(--xh-navy)", "var(--xh-gold)", "var(--xh-jade)", "var(--xh-rose-gold)"];
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % colors.length;
  return colors[hash];
};

const getXpTitle = (totalXp: number) => {
  if (totalXp >= 50000) return "汉语宗师";
  if (totalXp >= 25000) return "成语掌门";
  if (totalXp >= 12000) return "语境达人";
  if (totalXp >= 6000) return "词汇高手";
  if (totalXp >= 3000) return "HSK 行者";
  if (totalXp >= 1500) return "声调猎人";
  if (totalXp >= 700) return "短语新星";
  if (totalXp >= 250) return "词语学徒";
  return "清词初心者";
};

const getXpTitleAccent = (totalXp: number) => {
  if (totalXp >= 50000) return "MASTER";
  if (totalXp >= 25000) return "SAGE";
  if (totalXp >= 12000) return "LEGEND";
  if (totalXp >= 6000) return "ELITE";
  if (totalXp >= 3000) return "PRO";
  if (totalXp >= 1500) return "RANGER";
  if (totalXp >= 700) return "RUNNER";
  if (totalXp >= 250) return "ROOKIE";
  return "STARTER";
};

export default function Home() {
  const router = useRouter();
  const { isAuthResolved, isOfflineMode, signInWithGoogle, signOutUser, stats, updateSettings, user, vocabEntries, theme, setTheme } =
    useGamification();
  const entries = vocabEntries;
  const [activeTab, setActiveTab] = useState<HomeTab>("learn");
  const [locale, setLocaleState] = useState<SupportedLocale>("ko");
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocaleState(loadLocale(window.localStorage));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);
  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") saveLocale(window.localStorage, newLocale);
  };
  const units = useMemo(() => getUnits([], entries), [entries]);
  const completedWordIds = useMemo(
    () =>
      units
        .filter((unit) => stats.completedUnits.includes(unit.id))
        .flatMap((unit) => unit.words.map((word) => word.id)),
    [stats.completedUnits, units],
  );
  const cards = useMemo(() => createHomeStepCards(entries, completedWordIds, locale), [entries, completedWordIds, locale]);
  const totalWords = getTotalWordCount([], entries);
  const showAdminTabs = isAdmin(user) && stats.settings.adminEditEnabled;
  const displayName = user?.displayName || user?.email || stats.displayName || "QingVoca Learner";
  const displayPhoto = user?.photoURL || null;
  const xpTitle = getXpTitle(stats.xp);
  const xpTitleAccent = getXpTitleAccent(stats.xp);
  const handleUnitSelect = (unitId: string, isLocked: boolean) => {
    if (isLocked) return;
    router.push(`/quiz/${unitId}`);
  };
  const handleReviewMistakes = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    router.push("/quiz/review");
  };
  const toggleAdminEdit = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.checked;
    updateSettings({ adminEditEnabled: next });
    if (!next && activeTab === "edit") setActiveTab("profile");
  };
  const snakePathPoints = cards.map((_, index) => ({
    x: SNAKE_PATH_CENTER_X + getSnakeOffset(index),
    y: SNAKE_NODE_CENTER_Y + index * SNAKE_NODE_STEP_Y,
  }));
  const snakePathD = snakePathPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const snakePathHeight = SNAKE_NODE_CENTER_Y * 2 + Math.max(cards.length - 1, 0) * SNAKE_NODE_STEP_Y;

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
          <WeatherBackground />
          <div className="unit-list">
            <svg
              className="connector-svg"
              aria-hidden="true"
              width={SNAKE_PATH_WIDTH}
              height={snakePathHeight}
              viewBox={`0 0 ${SNAKE_PATH_WIDTH} ${snakePathHeight}`}
            >
              {/* Solid background path */}
              <path
                d={snakePathD}
                fill="none"
                stroke="var(--border-light)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated dashed overlay */}
              <path
                className="connector-path-animated"
                d={snakePathD}
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
              const unit = units[index];
              const unitId = unit?.id ?? `unit-${card.step}`;
              const isLocked =
                !stats.settings.unlockAllLevels &&
                index > 0 &&
                Boolean(previousUnitId) &&
                !stats.completedUnits.includes(previousUnitId);
              const isCompleted = stats.completedUnits.includes(unitId);
              const isMastered = stats.masteredUnits.includes(unitId);
              const isCurrent = !isLocked && !isCompleted;
              const tier = getLevelTier(index);
              const failCount =
                unit?.words.reduce((sum, word) => {
                  const wordKey = normalizeVocabWordKey(word.word);
                  return sum + (stats.mistakes[word.id] ?? stats.mistakes[wordKey] ?? 0);
                }, 0) ?? 0;
              const showFailBadge = failCount > 0;
              const buttonState = isLocked ? "locked" : isMastered ? "mastered" : isCompleted ? "completed" : isCurrent ? "current" : "available";
              const offset = getSnakeOffset(index);

              return (
                <div
                  key={card.step}
                  className={`unit-node-container unit-node ${isLocked ? "locked" : "available"} ${tier}`}
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  <div
                    className={`no-underline unit-button ${buttonState} ${tier}`}
                    aria-disabled={isLocked}
                    role={isLocked ? undefined : "link"}
                    tabIndex={isLocked ? -1 : 0}
                    onClick={() => handleUnitSelect(unitId, isLocked)}
                    onKeyDown={(event) => {
                      if (isLocked) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleUnitSelect(unitId, false);
                      }
                    }}
                  >
                    <span className={typeof getUnitIcon(index, isLocked, isCompleted, isMastered) === "number" ? "font-24" : "font-30"}>
                      {getUnitIcon(index, isLocked, isCompleted, isMastered)}
                    </span>
                  </div>
                  {showFailBadge && !isLocked && (
                    <button
                      type="button"
                      className="fail-badge-dual"
                      aria-label={`${failCount} review mistakes`}
                      onClick={handleReviewMistakes}
                    >
                      <span className="fail-badge-circle" />
                      <span className="fail-badge-count">{failCount}</span>
                    </button>
                  )}
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
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "review" && (
        <ReviewTab locale={locale} />
      )}

      {activeTab === "leader" && (
        <Leaderboard />
      )}

      {activeTab === "profile" && (
        <section className="profile-container pb-120">
          <div className="review-card-modern text-center p-32">
            <div
              className="avatar-container"
              style={{
                backgroundColor: displayPhoto ? "transparent" : getProfileAvatarColor(user?.uid || displayName),
                color: "white",
                fontWeight: 900,
                fontSize: 44,
              }}
            >
              {displayPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayPhoto} alt={displayName} width={100} height={100} className="object-cover" />
              ) : (
                <span>{getProfileInitial(displayName)}</span>
              )}
              {isAdmin(user) && <div className="profile-admin-badge">ADMIN</div>}
            </div>

            <h2 className="font-24 font-900 text-main mb-4">{displayName}</h2>
            {user?.email && <p className="text-subtitle mt-0 mb-12">{user.email}</p>}

            <div className="profile-xp-title-wrap mb-16">
              <div className="profile-xp-title-pill">
                <span className="profile-xp-title-accent">{xpTitleAccent}</span>
                <span className="profile-xp-title-main">{xpTitle}</span>
                <span className="profile-xp-title-flag">清</span>
              </div>
            </div>

            <div className="stat-grid">
              <div className="profile-stat-card">
                <span className="font-12 font-800 text-secondary uppercase">Streak</span>
                <span className="font-24 font-900 text-kv-kurenai">🔥 {stats.streak}</span>
              </div>
              <div className="profile-stat-card">
                <span className="font-12 font-800 text-secondary uppercase">Total XP</span>
                <span className="font-24 font-900" style={{ color: "var(--xh-jade)" }}>✨ {stats.xp.toLocaleString()}</span>
              </div>
              <div className="profile-stat-card">
                <span className="font-12 font-800 text-secondary uppercase">Gems</span>
                <span className="font-24 font-900" style={{ color: "var(--xh-navy)" }}>💎 {stats.gems.toLocaleString()}</span>
              </div>
              <div className="profile-stat-card">
                <span className="font-12 font-800 text-secondary uppercase">Mastery</span>
                <span className="font-24 font-900" style={{ color: "var(--xh-gold)" }}>👑 {stats.masteredUnits.length}</span>
              </div>
            </div>

            {user ? (
              <button
                className="duo-button duo-button-primary w-auto px-32 mx-auto mb-16"
                type="button"
                disabled={!isAuthResolved}
                onClick={() => void signOutUser()}
              >
                {t("signOut", locale)}
              </button>
            ) : (
              <div className="profile-login-panel">
                <div className="font-48 mb-12">🔑</div>
                <h3 className="font-20 font-900 text-main mb-8">Save Your Progress</h3>
                <p className="text-subtitle mb-16">{t("signInPrompt", locale)}</p>
                <button
                  className="duo-button duo-button-outline flex-center gap-12 p-16 bg-google"
                  type="button"
                  disabled={!isAuthResolved || isOfflineMode}
                  onClick={() => void signInWithGoogle()}
                >
                  {t("signInWithGoogle", locale)}
                </button>
              </div>
            )}

            <div className="settings-section mt-24 pt-24 border-t-glass">
              <h3 className="font-18 font-900 text-main mb-16 text-left">Settings</h3>

              <div className="settings-item">
                <div className="flex flex-col">
                  <span className="font-16 font-700">{t("localeSelect", locale)}</span>
                  <span className="font-12 text-secondary">{t("settingsLocaleDescription", locale)}</span>
                </div>
                <div className="profile-locale-buttons">
                  {LOCALE_OPTIONS.map((option) => (
                    <button
                      key={option.locale}
                      className={`profile-locale-button ${option.locale === locale ? "active" : ""}`}
                      type="button"
                      onClick={() => setLocale(option.locale)}
                    >
                      {option.locale.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-item">
                <div className="flex flex-col">
                  <span className="font-16 font-700">{t("playChineseAudio", locale)}</span>
                  <span className="font-12 text-secondary">{t("settingsChineseAudioDescription", locale)}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={stats.settings.speechEnabled}
                    onChange={(event) => updateSettings({ speechEnabled: event.currentTarget.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="flex flex-col">
                  <span className="font-16 font-700">{t("soundEffects", locale)}</span>
                  <span className="font-12 text-secondary">{t("settingsSoundEffectsDescription", locale)}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={stats.settings.soundEffectsEnabled}
                    onChange={(event) => updateSettings({ soundEffectsEnabled: event.currentTarget.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="flex flex-col">
                  <span className="font-16 font-700">{t("hapticFeedback", locale)}</span>
                  <span className="font-12 text-secondary">{t("settingsHapticsDescription", locale)}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={stats.settings.hapticsEnabled}
                    onChange={(event) => updateSettings({ hapticsEnabled: event.currentTarget.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="flex flex-col">
                  <span className="font-16 font-700">{t("showPinyin", locale)}</span>
                  <span className="font-12 text-secondary">{t("settingsPinyinDescription", locale)}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={stats.settings.showPinyin}
                    onChange={(event) => updateSettings({ showPinyin: event.currentTarget.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {isAdmin(user) && (
                <div className="settings-item">
                  <div className="flex flex-col">
                    <span className="font-16 font-700">{t("unlockAllLevels", locale)}</span>
                    <span className="font-12 text-secondary">{t("settingsUnlockDescription", locale)}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={stats.settings.unlockAllLevels}
                      onChange={(event) => updateSettings({ unlockAllLevels: event.currentTarget.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              )}

              <div className="settings-item">
                <div className="flex flex-col">
                  <span className="font-16 font-700">{t("darkMode", locale)}</span>
                  <span className="font-12 text-secondary">{t("settingsDarkModeDescription", locale)}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={(event) => setTheme(event.currentTarget.checked ? "dark" : "light")}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {isAdmin(user) && (
                <div className="flex flex-col gap-2">
                  <div className="settings-item">
                    <div className="flex flex-col">
                      <span className="font-16 font-700">{t("openAdminEdit", locale)}</span>
                      <span className="font-12 text-secondary">{t("settingsAdminEditDescription", locale)}</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={stats.settings.adminEditEnabled}
                        onChange={toggleAdminEdit}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <p className="m-0 text-center font-12 leading-1-5 text-secondary">
                    {t("redgoldSourceNotePrefix", locale)}
                    <a href="https://heroyik.github.io/redgold" target="_blank" rel="noreferrer">
                      <span style={{ color: "var(--xh-red)" }}>Red</span>
                      <span style={{ color: "var(--xh-gold)" }}>Gold</span>
                    </a>
                    {t("redgoldSourceNoteSuffix", locale)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "edit" && showAdminTabs && (
        <section className="review-content admin-edit-content">
          <div className="review-card-modern admin-edit-card">
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
