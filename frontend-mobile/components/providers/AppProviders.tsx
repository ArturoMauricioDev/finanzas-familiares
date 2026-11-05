import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LocaleProvider } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}