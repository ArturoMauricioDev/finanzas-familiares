import { defaultLocale, supportedLocales, type Locale } from "./i18n/messages.generated";
import type { ThemeMode } from "./generated/tokens";

export type ThemePreference = ThemeMode | "system";

export const THEME_STORAGE_KEY = "kitho_theme";
export const LOCALE_STORAGE_KEY = "kitho_locale";
export const THEME_COOKIE_KEY = "kitho_theme";
export const LOCALE_COOKIE_KEY = "kitho_locale";

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getStoredTheme(): ThemePreference {
  if (!canUseDom()) return "system";
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function getStoredLocale(): Locale {
  if (!canUseDom()) return defaultLocale;
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return defaultLocale;
  }
}

function writeCookie(name: string, value: string): void {
  if (!canUseDom()) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function setStoredTheme(value: ThemePreference): void {
  if (!canUseDom()) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    return;
  }
  writeCookie(THEME_COOKIE_KEY, value);
}

export function setStoredLocale(value: Locale): void {
  if (!canUseDom()) return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
  } catch {
    return;
  }
  writeCookie(LOCALE_COOKIE_KEY, value);
}

export function readCookieFromString(cookieHeader: string, name: string): string | null {
  const prefix = `${name}=`;
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

export function resolveTheme(mode: ThemePreference, systemDark: boolean): ThemeMode {
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}
