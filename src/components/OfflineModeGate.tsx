"use client";

import { useGamification } from "@/hooks/useGamification";

export default function OfflineModeGate() {
  const { isAuthResolved, isInitialized, isOfflineMode, isOfflineModeBlocked, isOnline } = useGamification();

  if (isOnline || !isInitialized || !isAuthResolved) return null;

  if (isOfflineModeBlocked) {
    return (
      <div className="offline-blocker">
        <div className="offline-blocker-card">
          <div className="offline-pill offline-pill-danger">Offline Locked</div>
          <h2 className="offline-title">인터넷 연결이 필요합니다</h2>
          <p className="offline-copy">로그인 동기화가 필요한 상태입니다. 다시 온라인이 되면 정상 사용으로 돌아갑니다.</p>
        </div>
      </div>
    );
  }

  if (!isOfflineMode) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <strong>Offline Mode</strong>
      <span>학습 기록은 로컬에 유지되고, 온라인 복귀 시 가능한 데이터가 동기화됩니다.</span>
    </div>
  );
}
