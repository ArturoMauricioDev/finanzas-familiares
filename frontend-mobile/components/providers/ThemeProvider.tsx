import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";

import { colorsByMode, lightColors, type ThemeColors, type ThemeMode } from "../../lib/generated/tokens";
import {
  getThemePreference,
  resolveTheme,
  setThemePreference,
  type ThemePreference,
} from "../../lib/preferences";

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

export function ThemeProvider({
  children,
  initialMode = "system",
}: {
  children: ReactNode;
  initialMode?: ThemePreference;
}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemePreference>(initialMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    getThemePreference().then((stored) => {
      if (!active) return;
      setModeState(stored);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const resolved = resolveTheme(mode, systemScheme === "dark");

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colorsByMode[resolved].surface).catch(() => undefined);
  }, [resolved]);

  useEffect(() => {
    if (!hydrated) return;
    void setThemePreference(mode);
  }, [hydrated, mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      colors: colorsByMode[resolved],
      setMode: (nextMode) => {
        setModeState(nextMode);
        setHydrated(true);
        void setThemePreference(nextMode);
      },
    }),
    [mode, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
