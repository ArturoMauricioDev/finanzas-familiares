"use client";

import { NextIntlClientProvider } from "next-intl";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  defaultLocale,
  messages,
  type Locale,
} from "@/lib/i18n/messages.generated";
import { getStoredLocale, normalizeLocale, setStoredLocale } from "@/lib/preferences";

type TranslationValues = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
}

function lookup(source: unknown, key: string): string | null {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
  return typeof value === "string" ? value : null;
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

function createTranslate(locale: Locale) {
  return (key: string, values?: TranslationValues): string => {
    const template = lookup(messages[locale], key) ?? lookup(messages[defaultLocale], key);
    return template ? interpolate(template, values) : key;
  };
}

const defaultTranslate = createTranslate(defaultLocale);

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => undefined,
  t: defaultTranslate,
});

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (hydrated) {
      setStoredLocale(locale);
    }
  }, [hydrated, locale]);

  const t = useMemo(() => createTranslate(locale), [locale]);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        const normalized = normalizeLocale(nextLocale);
        setLocaleState(normalized);
        setStoredLocale(normalized);
        setHydrated(true);
      },
      t,
    }),
    [locale, t],
  );

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages[locale]}
        timeZone="UTC"
        now={new Date(0)}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext);
}
