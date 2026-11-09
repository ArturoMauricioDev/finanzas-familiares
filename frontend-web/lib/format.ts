export function formatLocaleFor(uiLocale: string, deviceLocale?: string | null): string {
  if (!deviceLocale) return uiLocale;
  try {
    const region = new Intl.Locale(deviceLocale).maximize().region;
    return region ? `${uiLocale}-${region}` : deviceLocale;
  } catch {
    return deviceLocale;
  }
}

export function formatCurrency(amount: number, currency: string, locale: string = "es"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: string = "es",
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  value: Date | string | number,
  locale: string = "es",
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}
