export const FIRESTORE_QUOTA_BLOCKED_KEY = "qingvoca:firestore:quota-blocked";
export const FIRESTORE_SYNC_STATE_KEY = "qingvoca:firestore:sync-state";

const GENERAL_COOLDOWN_MS = 5 * 60 * 1000;
const TRANSIENT_COOLDOWN_MS = 10 * 60 * 1000;
const QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type FirestoreSyncStatus = "available" | "cooldown" | "quotaBlocked" | "offline";

export type FirestoreSyncState = {
  status: FirestoreSyncStatus;
  lastErrorCode?: string;
  lastErrorAt?: number;
  nextRetryAt?: number;
  lastSuccessfulSyncAt?: number;
  lastRemoteReadAt?: number;
};

function storageAvailable() {
  return typeof window !== "undefined";
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "unknown";
}

export function isFirestoreQuotaError(error: unknown) {
  return getErrorCode(error) === "resource-exhausted";
}

export function classifyFirestoreError(error: unknown): FirestoreSyncStatus {
  const code = getErrorCode(error);
  if (code === "resource-exhausted") return "quotaBlocked";
  if (code === "unavailable" || code === "deadline-exceeded") return "cooldown";
  if (code === "permission-denied") return "cooldown";
  return "cooldown";
}

function cooldownFor(error: unknown) {
  const code = getErrorCode(error);
  if (code === "resource-exhausted") return QUOTA_COOLDOWN_MS;
  if (code === "unavailable" || code === "deadline-exceeded") return TRANSIENT_COOLDOWN_MS;
  return GENERAL_COOLDOWN_MS;
}

export function readFirestoreSyncState(): FirestoreSyncState {
  if (!storageAvailable()) return { status: "available" };
  try {
    const saved = window.localStorage.getItem(FIRESTORE_SYNC_STATE_KEY);
    if (!saved) return { status: "available" };
    const parsed = JSON.parse(saved) as FirestoreSyncState;
    return parsed && typeof parsed === "object" ? parsed : { status: "available" };
  } catch {
    return { status: "available" };
  }
}

export function writeFirestoreSyncState(state: FirestoreSyncState) {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(FIRESTORE_SYNC_STATE_KEY, JSON.stringify(state));
    if (state.status === "quotaBlocked") {
      window.sessionStorage.setItem(FIRESTORE_QUOTA_BLOCKED_KEY, "1");
    } else if (state.status === "available") {
      window.sessionStorage.removeItem(FIRESTORE_QUOTA_BLOCKED_KEY);
    }
  } catch {}
}

export function canUseFirestore(now = Date.now()) {
  if (!storageAvailable()) return false;
  if (!window.navigator.onLine) return false;
  try {
    if (window.sessionStorage.getItem(FIRESTORE_QUOTA_BLOCKED_KEY) === "1") {
      const state = readFirestoreSyncState();
      return Boolean(state.nextRetryAt && now >= state.nextRetryAt);
    }
  } catch {}

  const state = readFirestoreSyncState();
  if (state.status === "available") return true;
  return Boolean(state.nextRetryAt && now >= state.nextRetryAt);
}

export function markFirestoreFailure(error: unknown) {
  if (!storageAvailable()) return;
  const now = Date.now();
  const status = classifyFirestoreError(error);
  writeFirestoreSyncState({
    ...readFirestoreSyncState(),
    status,
    lastErrorCode: getErrorCode(error),
    lastErrorAt: now,
    nextRetryAt: now + cooldownFor(error),
  });
}

export function markFirestoreSuccess() {
  writeFirestoreSyncState({
    ...readFirestoreSyncState(),
    status: "available",
    lastSuccessfulSyncAt: Date.now(),
    nextRetryAt: undefined,
  });
}

export function markFirestoreRemoteRead() {
  writeFirestoreSyncState({
    ...readFirestoreSyncState(),
    status: "available",
    lastRemoteReadAt: Date.now(),
  });
}

export function clearFirestoreCooldown() {
  writeFirestoreSyncState({
    ...readFirestoreSyncState(),
    status: "available",
    nextRetryAt: undefined,
  });
}
