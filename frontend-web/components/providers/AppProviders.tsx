"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

import type { Locale } from "@/lib/i18n/messages.generated";
import type { ThemePreference } from "@/lib/preferences";
import { LocaleProvider, useI18n } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";

function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}
      locale={locale}
    >
      {children}
    </GoogleOAuthProvider>
  );
}

export function AppProviders({
  children,
  initialTheme,
  initialLocale,
}: {
  children: ReactNode;
  initialTheme: ThemePreference;
  initialLocale: Locale;
}) {
  return (
    <ThemeProvider initialMode={initialTheme}>
      <LocaleProvider initialLocale={initialLocale}>
        <GoogleAuthProvider>{children}</GoogleAuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
