"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getDocsFromCache, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LeaderboardEntry = {
  id: string;
  displayName?: string;
  photoURL?: string;
  xp: number;
  gems?: number;
};

/** Demo seed users shown when Firestore has no real user data yet. */
const DEMO_USERS: LeaderboardEntry[] = [
  { id: "demo-kr-01", displayName: "Seo-yeon Kim", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=seo-yeon&backgroundColor=b6e3f4", xp: 4820, gems: 320 },
  { id: "demo-jp-01", displayName: "Haruki Tanaka", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=haruki&backgroundColor=ffd5dc", xp: 4350, gems: 280 },
  { id: "demo-us-01", displayName: "Emily Johnson", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily&backgroundColor=c0aede", xp: 3980, gems: 250 },
  { id: "demo-vn-01", displayName: "Minh Anh Nguyen", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh-anh&backgroundColor=d1f4d1", xp: 3710, gems: 210 },
  { id: "demo-kr-02", displayName: "Ji-hoon Park", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=ji-hoon&backgroundColor=ffeaa7", xp: 3450, gems: 190 },
  { id: "demo-th-01", displayName: "Siriporn Chaiyaporn", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=siriporn&backgroundColor=fab1a0", xp: 2890, gems: 160 },
  { id: "demo-br-01", displayName: "Lucas Silva", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucas-silva&backgroundColor=81ecec", xp: 2540, gems: 130 },
  { id: "demo-jp-02", displayName: "Yuki Watanabe", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=yuki&backgroundColor=a29bfe", xp: 1980, gems: 90 },
  { id: "demo-fr-01", displayName: "Émilie Dubois", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=emilie-dubois&backgroundColor=fd79a8", xp: 1320, gems: 60 },
  { id: "demo-de-01", displayName: "Lukas Müller", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=lukas-mueller&backgroundColor=00cec9", xp: 870, gems: 40 },
];
const LEADERBOARD_CACHE_KEY = "qingvoca:leaderboard:cache";
const FIRESTORE_QUOTA_BLOCKED_KEY = "qingvoca:firestore:quota-blocked";
const LEADERBOARD_CACHE_TTL_MS = 10 * 60 * 1000;

function getInitial(name?: string) {
  return (name?.trim().charAt(0) || "Q").toUpperCase();
}

function getAvatarColor(index: number) {
  const colors = ["var(--xh-red)", "var(--xh-navy)", "var(--xh-gold)", "var(--xh-jade)", "var(--xh-rose-gold)"];
  return colors[index % colors.length];
}

function getRankColor(index: number) {
  if (index === 0) return "var(--xh-gold)";
  if (index === 1) return "var(--xh-ink-light)";
  if (index === 2) return "var(--xh-rose-gold)";
  return "var(--text-secondary)";
}

function isResourceExhausted(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "resource-exhausted");
}

function readCachedLeaders() {
  try {
    const cached = window.sessionStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as { savedAt?: number; leaders?: LeaderboardEntry[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > LEADERBOARD_CACHE_TTL_MS) return null;
    return Array.isArray(parsed.leaders) ? parsed.leaders : null;
  } catch {
    return null;
  }
}

function writeCachedLeaders(leaders: LeaderboardEntry[]) {
  try {
    window.sessionStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), leaders }));
  } catch {}
}

function markQuotaBlocked() {
  try {
    window.sessionStorage.setItem(FIRESTORE_QUOTA_BLOCKED_KEY, "1");
  } catch {}
}

function isQuotaBlocked() {
  try {
    return window.sessionStorage.getItem(FIRESTORE_QUOTA_BLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>(() => readCachedLeaders() ?? []);
  const [loading, setLoading] = useState(() => Boolean(db) && !readCachedLeaders() && !isQuotaBlocked());

  useEffect(() => {
    let isCancelled = false;

    const firestore = db;
    if (!firestore || readCachedLeaders() || isQuotaBlocked()) return undefined;

    const loadLeaders = async () => {
      const leadersQuery = query(collection(firestore, "users"), orderBy("xp", "desc"), limit(10));

      try {
        const cacheSnapshot = await getDocsFromCache(leadersQuery);
        if (!isCancelled && !cacheSnapshot.empty) {
          const cachedLeaders = cacheSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LeaderboardEntry[];
          setLeaders(cachedLeaders);
          writeCachedLeaders(cachedLeaders);
          setLoading(false);
          return;
        }
      } catch {}

      try {
        const snapshot = await getDocs(leadersQuery);
        const nextLeaders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LeaderboardEntry[];
        if (!isCancelled) {
          setLeaders(nextLeaders);
          writeCachedLeaders(nextLeaders);
        }
      } catch (error) {
        if (isResourceExhausted(error)) markQuotaBlocked();
        if (!isCancelled) setLeaders([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void loadLeaders();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) return <div className="flex-center p-40 text-secondary">Loading Rankings...</div>;

  // Use demo users when no real Firestore data is available
  const displayLeaders = leaders.length > 0 ? leaders : DEMO_USERS;
  const visibleLeaders = displayLeaders.filter((entry) => (entry.xp ?? 0) > 0);

  return (
    <div className="leaderboard-list">
      <h2 className="text-title m-0 text-center">🏆 Hall of Fame</h2>
      {visibleLeaders.map((entry, index) => (
        <div key={entry.id} className="leaderboard-item">
          <div className="rank-text" style={{ color: getRankColor(index) }}>
            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
          </div>
          <div className="user-avatar mr-12" style={{ backgroundColor: getAvatarColor(index) }}>
            {entry.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.photoURL} alt={entry.displayName || "QingVoca learner"} />
            ) : (
              getInitial(entry.displayName)
            )}
          </div>
          <div className="leader-item-name">{entry.displayName || "QingVoca Learner"}</div>
          <div className="leader-item-xp">{(entry.xp ?? 0).toLocaleString()} XP</div>
        </div>
      ))}
    </div>
  );
}
