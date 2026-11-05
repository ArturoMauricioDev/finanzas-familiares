import * as SecureStore from "expo-secure-store";

import {
  getLocalePreference,
  getThemePreference,
  isLocale,
  isThemePreference,
  normalizeLocale,
  resolveTheme,
  setLocalePreference,
  setThemePreference,
} from "../lib/preferences";
import { clearSession } from "../lib/session";

const store = SecureStore as unknown as { __clear: () => void };

beforeEach(() => {
  store.__clear();
});

describe("mobile preferences", () => {
  it("defaults to system theme and no stored language", async () => {
    expect(await getThemePreference()).toBe("system");
    expect(await getLocalePreference()).toBeNull();
  });

  it("persists and restores the theme", async () => {
    await setThemePreference("dark");
    expect(await getThemePreference()).toBe("dark");
  });

  it("persists and restores the locale", async () => {
    await setLocalePreference("en");
    expect(await getLocalePreference()).toBe("en");
  });

  it("does not clear preferences when the session is cleared", async () => {
    await setThemePreference("dark");
    await setLocalePreference("en");

    await clearSession();

    expect(await getThemePreference()).toBe("dark");
    expect(await getLocalePreference()).toBe("en");
  });

  it("validates and normalizes values", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
    expect(isLocale("en")).toBe(true);
    expect(normalizeLocale("fr")).toBe("es");
    expect(resolveTheme("system", true)).toBe("dark");
  });
});