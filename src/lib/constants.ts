import type { User } from "firebase/auth";

export const APP_VERSION = "1.0.2";
export const APP_NAME = "QingVoca";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/qingvoca";
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

/** Returns true if the given Firebase user matches the configured admin email. */
export function isAdmin(user: User | null | undefined): boolean {
  return Boolean(ADMIN_EMAIL && user?.email === ADMIN_EMAIL);
}
