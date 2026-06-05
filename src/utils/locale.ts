import type { SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from "../types/chinese-vocab";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["ko", "ja", "en"];

export function isSupportedLocale(locale: string | null | undefined): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function getDeviceLocale(language: string | null | undefined): SupportedLocale {
  const normalized = language?.trim().toLowerCase().replace("_", "-");
  if (!normalized) return "en";
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  return "en";
}

export function getDefaultLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return getDeviceLocale(navigator.language);
}

export function loadLocale(storage: Pick<Storage, "getItem"> | undefined, fallback: SupportedLocale = getDefaultLocale()): SupportedLocale {
  if (!storage) return fallback;
  const saved = storage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(saved) ? saved : fallback;
}

export function saveLocale(storage: Pick<Storage, "setItem"> | undefined, locale: SupportedLocale): void {
  if (!storage) return;
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}
