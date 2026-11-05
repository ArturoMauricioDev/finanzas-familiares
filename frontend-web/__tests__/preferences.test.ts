import {
  getStoredLocale,
  getStoredTheme,
  isLocale,
  isThemePreference,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  resolveTheme,
  setStoredLocale,
  setStoredTheme,
  THEME_STORAGE_KEY,
} from "../lib/preferences";
import { clearSession } from "../lib/session";

describe("web preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = "kitho_theme=; path=/; max-age=0";
    document.cookie = "kitho_locale=; path=/; max-age=0";
  });

  it("defaults to system theme and Spanish locale", () => {
    expect(getStoredTheme()).toBe("system");
    expect(getStoredLocale()).toBe("es");
  });

  it("persists theme in localStorage and a cookie", () => {
    setStoredTheme("dark");

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.cookie).toContain("kitho_theme=dark");
    expect(getStoredTheme()).toBe("dark");
  });

  it("persists locale in localStorage and a cookie", () => {
    setStoredLocale("en");

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.cookie).toContain("kitho_locale=en");
    expect(getStoredLocale()).toBe("en");
  });

  it("does not clear preferences when the session is cleared", () => {
    setStoredTheme("dark");
    setStoredLocale("en");

    clearSession();

    expect(getStoredTheme()).toBe("dark");
    expect(getStoredLocale()).toBe("en");
  });

  it("validates and normalizes preference values", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
    expect(isLocale("en")).toBe(true);
    expect(normalizeLocale("fr")).toBe("es");
  });

  it("resolves the system theme", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });
});