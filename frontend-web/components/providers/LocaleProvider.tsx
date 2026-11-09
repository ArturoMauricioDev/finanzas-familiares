"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  defaultLocale,
  messages,
  type Locale,
} from "@/lib/i18n/messages.generated";
import { formatLocaleFor } from "@/lib/format";
import { getStoredLocale, normalizeLocale, setStoredLocale } from "@/lib/preferences";

type TranslationValues = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  formatLocale: string;
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

function fallbackTranslate(key: string, values?: TranslationValues): string {
  const template = lookup(messages[defaultLocale], key) ?? key;
  return interpolate(template, values);
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  formatLocale: defaultLocale,
  setLocale: () => undefined,
  t: fallbackTranslate,
});

function LocaleBridge({
  children,
  formatLocale,
  locale,
  setLocale,
}: {
  children: ReactNode;
  formatLocale: string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  const translate = useTranslations();
  const t = useCallback(
    (key: string, values?: TranslationValues): string =>
      translate(key as never, values as never),
    [translate],
  );
  const value = useMemo<LocaleContextValue>(
    () => ({ formatLocale, locale, setLocale, t }),
    [formatLocale, locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [deviceLocale, setDeviceLocale] = useState<string>(defaultLocale);
  const [hydrated, setHydrated] = useState(false);
  const previousLocale = useRef(locale);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language) {
      setDeviceLocale(navigator.language);
    }
  }, []);

  const formatLocale = useMemo(
    () => formatLocaleFor(locale, deviceLocale),
    [deviceLocale, locale],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      if (previousLocale.current !== locale) {
        document.title = messages[locale].app.webTitle;
        previousLocale.current = locale;
      }
    }
    if (hydrated) {
      setStoredLocale(locale);
    }
  }, [hydrated, locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    setStoredLocale(normalized);
    setHydrated(true);
  }, []);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone="UTC"
      now={new Date(0)}
    >
      <LocaleBridge formatLocale={formatLocale} locale={locale} setLocale={setLocale}>
        {children}
      </LocaleBridge>
    </NextIntlClientProvider>
  );
}

export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext);
}
