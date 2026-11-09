import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { AppProviders } from "@/components/providers/AppProviders";
import { brand, darkColors, lightColors } from "@/lib/generated/tokens";
import { defaultLocale, messages } from "@/lib/i18n/messages.generated";
import {
  LOCALE_COOKIE_KEY,
  THEME_COOKIE_KEY,
  isThemePreference,
  normalizeLocale,
  readCookieFromString,
  type ThemePreference,
} from "@/lib/preferences";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: lightColors.surface },
    { media: "(prefers-color-scheme: dark)", color: darkColors.surface },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const localeCookie = readCookieFromString(cookieStore.toString(), LOCALE_COOKIE_KEY);
  const locale = localeCookie ? normalizeLocale(localeCookie) : defaultLocale;

  return {
    title: { default: messages[locale].app.webTitle, template: `%s · ${brand.name}` },
    description: messages[locale].app.description,
    applicationName: brand.name,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const themeCookie = readCookieFromString(cookieHeader, THEME_COOKIE_KEY);
  const initialTheme: ThemePreference = isThemePreference(themeCookie) ? themeCookie : "system";
  const localeCookie = readCookieFromString(cookieHeader, LOCALE_COOKIE_KEY);
  const initialLocale = localeCookie ? normalizeLocale(localeCookie) : defaultLocale;

  const themeBootstrap = `(function(){try{var stored=window.localStorage.getItem("kitho_theme");var allowed=["light","dark","system"];var mode=allowed.indexOf(stored)>=0?stored:${JSON.stringify(initialTheme)};var resolved=mode==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):mode;document.documentElement.dataset.theme=resolved;document.documentElement.style.colorScheme=resolved;}catch(error){}})();`;

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders initialTheme={initialTheme} initialLocale={initialLocale}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
