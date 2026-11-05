"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { colorsByMode, lightColors, type ThemeColors, type ThemeMode } from "@/lib/generated/tokens";
import {
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ThemePreference,
} from "@/lib/preferences";

interface ThemeContextValue {
  mode: ThemePreference;
  resolved: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemePreference) => void;
}

const defaultValue: ThemeContextValue = {
  mode: "system",
  resolved: "light",
  colors: lightColors,
  setMode: () => undefined,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({
  children,
  initialMode = "system",
}: {
  children: ReactNode;
  initialMode?: ThemePreference;
}) {
  const [mode, setModeState] = useState<ThemePreference>(initialMode);
  const [hydrated, setHydrated] = useState(false);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    setModeState(getStoredTheme());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const resolved = resolveTheme(mode, systemDark);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  useEffect(() => {
    if (!hydrated) return;
    setStoredTheme(mode);
  }, [hydrated, mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      colors: colorsByMode[resolved],
      setMode: (nextMode) => {
        setModeState(nextMode);
        setStoredTheme(nextMode);
        setHydrated(true);
      },
    }),
    [mode, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
