import {
  countryCurrency,
  currencyRegions,
  type CountryCode,
  type CurrencyRegion,
} from "./currencies.generated";

export type CurrencySource = "geolocation" | "locale" | "fallback" | "user";

export interface CurrencyOption {
  code: string;
  name: string;
  region: CurrencyRegion;
  isLocal: boolean;
  isSuggested: boolean;
  source: CurrencySource;
}

export interface CurrencySelection {
  detectedCountry: string | null;
  region: CurrencyRegion;
  suggested: CurrencyOption[];
  selectedCode: string;
  source: CurrencySource;
}

const fallbackCodes = [
  "AED",
  "ARS",
  "AUD",
  "BGN",
  "BOB",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "COP",
  "CRC",
  "CZK",
  "DKK",
  "DOP",
  "EUR",
  "GBP",
  "GTQ",
  "HKD",
  "HNL",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NIO",
  "NOK",
  "NZD",
  "PAB",
  "PEN",
  "PHP",
  "PKR",
  "PLN",
  "PYG",
  "RON",
  "RSD",
  "SAR",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TWD",
  "UAH",
  "USD",
  "UYU",
  "VES",
  "VND",
  "ZAR",
];

function runtimeCurrencyCodes(): string[] {
  const supportedValuesOf = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf;
  if (!supportedValuesOf) return [];
  try {
    return supportedValuesOf("currency");
  } catch {
    return [];
  }
}

export function getAllCurrencyCodes(): string[] {
  return [...new Set([...runtimeCurrencyCodes(), ...fallbackCodes])].sort();
}

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidCurrencyCode(value: string): boolean {
  const code = normalizeCurrencyCode(value);
  if (!/^[A-Z]{3}$/.test(code)) return false;
  return getAllCurrencyCodes().includes(code);
}

export function currencyName(code: string, locale: string = "es"): string {
  const DisplayNames = (
    Intl as unknown as {
      DisplayNames?: new (locales: string, options: { type: string }) => {
        of: (value: string) => string | undefined;
      };
    }
  ).DisplayNames;
  if (!DisplayNames) return code;
  try {
    return new DisplayNames(locale, { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryFromLocale(locale: string): string | null {
  try {
    const region = new Intl.Locale(locale).maximize().region;
    return region ? region.toUpperCase() : null;
  } catch {
    const parts = locale.replace("_", "-").split("-");
    const candidate = parts.find((part) => /^[A-Za-z]{2}$/.test(part) && part !== "es");
    return candidate ? candidate.toUpperCase() : null;
  }
}

export function regionForCountry(country: string | null): CurrencyRegion {
  if (!country) return "other";
  return countryCurrency[country.toUpperCase() as CountryCode]?.region ?? "other";
}

export function localCurrencyForCountry(country: string | null): string | null {
  if (!country) return null;
  return countryCurrency[country.toUpperCase() as CountryCode]?.currency ?? null;
}

function defaultRegionForLocale(locale: string): CurrencyRegion {
  const country = countryFromLocale(locale);
  const region = regionForCountry(country);
  return region === "other" ? "us" : region;
}

function suggestedCodesForRegion(region: CurrencyRegion): string[] {
  if (region === "other") return [...currencyRegions.us];
  return [...currencyRegions[region]];
}

export function buildCurrencyOptions(
  codes: string[],
  options: {
    locale?: string;
    localCode?: string | null;
    suggestedCodes?: string[];
    source?: CurrencySource;
  } = {},
): CurrencyOption[] {
  const locale = options.locale ?? "es";
  const localCode = options.localCode ? normalizeCurrencyCode(options.localCode) : null;
  const suggestedCodes = options.suggestedCodes ?? [];
  return codes
    .filter((code) => isValidCurrencyCode(code))
    .map((code) => ({
      code,
      name: currencyName(code, locale),
      region: regionForCountry(null),
      isLocal: code === localCode,
      isSuggested: suggestedCodes.includes(code),
      source: options.source ?? "user",
    }));
}

export function createCurrencySelection(options: {
  country?: string | null;
  locale?: string;
  source?: CurrencySource;
} = {}): CurrencySelection {
  const locale = options.locale ?? "es";
  const country = options.country?.toUpperCase() ?? countryFromLocale(locale);
  const region = country ? regionForCountry(country) : defaultRegionForLocale(locale);
  const localCode = localCurrencyForCountry(country);
  const baseCodes = suggestedCodesForRegion(region);
  const source =
    options.source ?? (options.country ? "geolocation" : country ? "locale" : "fallback");
  const selectedCode = localCode ?? currencyRegions.us[0];
  const ordered = localCode
    ? [localCode, ...baseCodes.filter((code) => code !== localCode)]
    : baseCodes;
  const suggestedCodes = ordered.slice(0, 5);
  const suggestions = suggestedCodes.map((code) => ({
    code,
    name: currencyName(code, locale),
    region,
    isLocal: code === localCode,
    isSuggested: true,
    source,
  }));

  return {
    detectedCountry: country ?? null,
    region,
    suggested: suggestions,
    selectedCode,
    source,
  };
}

export function searchCurrencies(
  query: string,
  locale: string = "es",
  limit = 20,
): CurrencyOption[] {
  const normalized = query.trim().toLocaleLowerCase(locale);
  const codes = getAllCurrencyCodes();
  const matches = normalized
    ? codes.filter((code) => {
        const name = currencyName(code, locale).toLocaleLowerCase(locale);
        return code.toLocaleLowerCase(locale).includes(normalized) || name.includes(normalized);
      })
    : codes;
  return buildCurrencyOptions(matches.slice(0, limit), { locale, source: "user" });
}
