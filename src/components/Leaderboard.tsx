"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getDocsFromCache, limit, orderBy, query } from "firebase/firestore";
import { useGamification } from "@/hooks/useGamification";
import { db } from "@/lib/firebase";
import { canUseFirestore, markFirestoreFailure, markFirestoreSuccess } from "@/utils/firestoreAvailability";

type LeaderboardEntry = {
  id: string;
  displayName?: string;
  photoURL?: string;
  xp: number;
  gems?: number;
  imageError?: boolean;
};

function buildDemoAvatar(symbol: string, background: string) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`,
    `<rect width="120" height="120" rx="60" fill="${background}"/>`,
    `<circle cx="60" cy="60" r="50" fill="rgba(255,255,255,0.22)"/>`,
    `<text x="60" y="73" text-anchor="middle" font-size="52" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${symbol}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Demo seed users shown when Firestore has no real user data yet. */
const DEMO_USERS: LeaderboardEntry[] = [
  { id: "demo-kr-01", displayName: "Seo-yeon Kim", photoURL: buildDemoAvatar("🧑‍🎓", "#b6e3f4"), xp: 4820, gems: 320 },
  { id: "demo-jp-01", displayName: "Haruki Tanaka", photoURL: buildDemoAvatar("🐼", "#ffd5dc"), xp: 4350, gems: 280 },
  { id: "demo-us-01", displayName: "Emily Johnson", photoURL: buildDemoAvatar("🌻", "#c0aede"), xp: 3980, gems: 250 },
  { id: "demo-vn-01", displayName: "Minh Anh Nguyen", photoURL: buildDemoAvatar("🧑‍💻", "#d1f4d1"), xp: 3710, gems: 210 },
  { id: "demo-kr-02", displayName: "Ji-hoon Park", photoURL: buildDemoAvatar("🦊", "#ffeaa7"), xp: 3450, gems: 190 },
  { id: "demo-th-01", displayName: "Siriporn Chaiyaporn", photoURL: buildDemoAvatar("🌵", "#fab1a0"), xp: 2890, gems: 160 },
  { id: "demo-br-01", displayName: "Lucas Silva", photoURL: buildDemoAvatar("🧑‍🚀", "#81ecec"), xp: 2540, gems: 130 },
  { id: "demo-jp-02", displayName: "Yuki Watanabe", photoURL: buildDemoAvatar("🐯", "#a29bfe"), xp: 1980, gems: 90 },
  { id: "demo-fr-01", displayName: "Émilie Dubois", photoURL: buildDemoAvatar("🪴", "#fd79a8"), xp: 1320, gems: 60 },
  { id: "demo-de-01", displayName: "Lukas Müller", photoURL: buildDemoAvatar("🐧", "#00cec9"), xp: 870, gems: 40 },
];
const LEADERBOARD_CACHE_KEY = "qingvoca:leaderboard:cache";
const LEADERBOARD_CACHE_TTL_MS = 30 * 60 * 1000;

function getInitial(name?: string) {
  return (name?.trim().charAt(0) || "Q").toUpperCase();
}

function getAvatarColor(seed: string) {
  const colors = ["var(--xh-red)", "var(--xh-navy)", "var(--xh-gold)", "var(--xh-jade)", "var(--xh-rose-gold)"];
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % colors.length;
  return colors[hash];
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

function upsertCurrentLeader(leaders: LeaderboardEntry[], currentLeader: LeaderboardEntry | null) {
  if (!currentLeader || currentLeader.xp <= 0) return leaders;
  const withoutCurrent = leaders.filter((entry) => entry.id !== currentLeader.id);
  return [currentLeader, ...withoutCurrent];
}

function fillLeaderboardSlots(realLeaders: LeaderboardEntry[], currentLeader: LeaderboardEntry | null = null) {
  const visibleRealLeaders = upsertCurrentLeader(realLeaders, currentLeader)
    .filter((entry) => (entry.xp ?? 0) > 0)
    .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
  const usedIds = new Set(visibleRealLeaders.map((entry) => entry.id));
  const fillerLeaders = DEMO_USERS.filter((entry) => !usedIds.has(entry.id)).slice(0, Math.max(0, 10 - visibleRealLeaders.length));
  return [...visibleRealLeaders, ...fillerLeaders].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, 10);
}

export default function Leaderboard() {
  const { stats, user } = useGamification();
  const currentLeader: LeaderboardEntry | null = useMemo(
    () =>
      user
        ? {
            id: user.uid,
            displayName: user.displayName || user.email || stats.displayName || "QingVoca Learner",
            photoURL: user.photoURL ?? undefined,
            xp: stats.xp,
            gems: stats.gems,
          }
        : null,
    [stats.displayName, stats.gems, stats.xp, user],
  );
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>(() => readCachedLeaders() ?? []);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let isCancelled = false;

    const firestore = db;
    if (!firestore || readCachedLeaders() || !canUseFirestore()) return undefined;

    const loadLeaders = async () => {
      const leadersQuery = query(collection(firestore, "users"), orderBy("xp", "desc"), limit(10));

      try {
        const cacheSnapshot = await getDocsFromCache(leadersQuery);
        if (!isCancelled && !cacheSnapshot.empty) {
          const cachedLeaders = cacheSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LeaderboardEntry[];
          setLeaders(cachedLeaders);
          writeCachedLeaders(cachedLeaders);
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
        markFirestoreSuccess();
      } catch (error) {
        markFirestoreFailure(error);
      }
    };

    void loadLeaders();

    return () => {
      isCancelled = true;
    };
  }, []);

  const visibleLeaders = useMemo(() => fillLeaderboardSlots(leaders, currentLeader), [currentLeader, leaders]);

  return (
    <div className="p-20 max-w-600 mx-auto">
      <h2 className="font-24 font-900 text-kv-kurenai mb-20 text-center">Hall of Fame 🏆</h2>
      <div className="leaderboard-list">
        {visibleLeaders.map((entry, index) => {
          const hasUsablePhoto = Boolean(
            (entry.photoURL?.startsWith("http") || entry.photoURL?.startsWith("data:image/")) && !entry.imageError && !brokenImageIds.has(entry.id),
          );

          return (
            <div key={entry.id} className="leaderboard-item">
              <div className="rank-text">
                {index === 0 ? "👑" : index + 1}
              </div>
              <div
                className="user-avatar mr-12 relative"
                style={{
                  backgroundColor: hasUsablePhoto ? "transparent" : getAvatarColor(entry.id),
                  color: "white",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                {hasUsablePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.photoURL}
                    alt={entry.displayName || "QingVoca learner"}
                    className="object-cover rounded-full"
                    onError={() => {
                      setBrokenImageIds((current) => new Set(current).add(entry.id));
                      setLeaders((current) =>
                        current.map((leader) => leader.id === entry.id ? { ...leader, imageError: true } : leader),
                      );
                    }}
                  />
                ) : (
                  <span>{getInitial(entry.displayName)}</span>
                )}
              </div>
              <div className="leader-item-name">{entry.displayName || "QingVoca Learner"}</div>
              <div className="leader-item-xp">{(entry.xp ?? 0).toLocaleString()} XP</div>
            </div>
          );
        })}
        {visibleLeaders.length === 0 && (
          <div className="text-center text-secondary p-40">
            Be the first to join the leaderboard! 🚀
          </div>
        )}
      </div>
    </div>
  );
}
