import * as SecureStore from "expo-secure-store";

import type { ThemeMode } from "./generated/tokens";
import { defaultLocale, supportedLocales, type Locale } from "./i18n/messages.generated";

export type ThemePreference = ThemeMode | "system";

export const THEME_STORAGE_KEY = "kitho_theme";
export const LOCALE_STORAGE_KEY = "kitho_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const value = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export async function setThemePreference(value: ThemePreference): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, value);
  } catch {
    return;
  }
}

export async function getLocalePreference(): Promise<Locale | null> {
  try {
    const value = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export async function setLocalePreference(value: Locale): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, normalizeLocale(value));
  } catch {
    return;
  }
}

export function resolveTheme(mode: ThemePreference, systemDark: boolean): ThemeMode {
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}
