"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

import type { Locale } from "@/lib/i18n/messages.generated";
import type { ThemePreference } from "@/lib/preferences";
import { LocaleProvider } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";

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
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
      <ThemeProvider initialMode={initialTheme}>
        <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
