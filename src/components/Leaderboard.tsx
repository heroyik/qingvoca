"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LeaderboardEntry = {
  id: string;
  displayName?: string;
  photoURL?: string;
  xp: number;
  gems?: number;
};

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

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(db));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const firestore = db;
    if (!firestore) return undefined;

    const timeoutId = setTimeout(() => {
      setLeaders([]);
      setLoading(false);
    }, 10000);

    try {
      const leadersQuery = query(collection(firestore, "users"), orderBy("xp", "desc"), limit(10));
      unsubscribe = onSnapshot(
        leadersQuery,
        (snapshot) => {
          clearTimeout(timeoutId);
          setLeaders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LeaderboardEntry[]);
          setLoading(false);
        },
        async () => {
          try {
            const fallbackQuery = query(collection(firestore, "users"), limit(50));
            const snapshot = await getDocs(fallbackQuery);
            const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LeaderboardEntry[];
            entries.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
            setLeaders(entries.slice(0, 10));
          } finally {
            clearTimeout(timeoutId);
            setLoading(false);
          }
        },
      );
    } catch {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setLeaders([]);
        setLoading(false);
      }, 0);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) return <div className="flex-center p-40 text-secondary">Loading Rankings...</div>;

  return (
    <div className="leaderboard-list">
      <h2 className="text-title m-0 text-center">🏆 Hall of Fame</h2>
      {leaders.map((entry, index) => (
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
      {leaders.length === 0 && (
        <div className="text-center text-secondary p-40">로그인하면 리더보드에 학습 기록이 표시됩니다.</div>
      )}
    </div>
  );
}
