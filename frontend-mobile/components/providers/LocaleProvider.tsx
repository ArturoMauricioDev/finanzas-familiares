import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { defaultLocale, messages, type Locale } from "../../lib/i18n/messages.generated";
import { formatLocaleFor } from "../../lib/format";
import {
  getLocalePreference,
  normalizeLocale,
  setLocalePreference,
} from "../../lib/preferences";

type TranslationValues = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  formatLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
}

function deviceLocaleTag(): string {
  try {
    const primary = getLocales()[0];
    if (!primary) return defaultLocale;
    if (primary.languageTag) return primary.languageTag;
    if (primary.languageCode) {
      return primary.regionCode
        ? `${primary.languageCode}-${primary.regionCode}`
        : primary.languageCode;
    }
  } catch {
    return defaultLocale;
  }
  return defaultLocale;
}

function createI18n(locale: Locale): I18n {
  const i18n = new I18n(messages);
  i18n.defaultLocale = defaultLocale;
  i18n.locale = locale;
  i18n.enableFallback = true;
  i18n.missingBehavior = "guess";
  return i18n;
}

const defaultI18n = createI18n(defaultLocale);
const defaultT = (key: string, values?: TranslationValues) =>
  defaultI18n.t(key, values) as string;

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  formatLocale: defaultLocale,
  setLocale: () => undefined,
  t: defaultT,
});

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [deviceLocale] = useState(deviceLocaleTag);

  useEffect(() => {
    let active = true;
    getLocalePreference().then((stored) => {
      if (!active) return;
      setLocaleState(stored ?? defaultLocale);
    });
    return () => {
      active = false;
    };
  }, []);

  const i18n = useMemo(() => createI18n(locale), [locale]);
  const t = useMemo(
    () => (key: string, values?: TranslationValues) => i18n.t(key, values) as string,
    [i18n],
  );
  const formatLocale = useMemo(
    () => formatLocaleFor(locale, deviceLocale),
    [deviceLocale, locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      formatLocale,
      setLocale: (nextLocale) => {
        const normalized = normalizeLocale(nextLocale);
        setLocaleState(normalized);
        void setLocalePreference(normalized);
      },
      t,
    }),
    [formatLocale, locale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext);
}
