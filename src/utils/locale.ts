import type { SupportedLocale } from "../types/chinese-vocab";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from "../types/chinese-vocab";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["ko", "ja", "en"];

export function isSupportedLocale(locale: string | null | undefined): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function loadLocale(storage: Pick<Storage, "getItem"> | undefined): SupportedLocale {
  if (!storage) return DEFAULT_LOCALE;
  return normalizeLocale(storage.getItem(LOCALE_STORAGE_KEY));
}

export function saveLocale(storage: Pick<Storage, "setItem"> | undefined, locale: SupportedLocale): void {
  if (!storage) return;
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}
