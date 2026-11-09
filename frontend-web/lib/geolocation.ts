
import { countryFromLocale } from "./currency";

export type LocationSource = "geolocation" | "locale" | "fallback";

export interface LocationDetection {
  country: string | null;
  source: LocationSource;
}

const reverseGeocodeUrl = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function localeFallback(locale: string): LocationDetection {
  const country = countryFromLocale(locale);
  return { country, source: country ? "locale" : "fallback" };
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
  locale: string,
  timeoutMs: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: locale,
    });
    const response = await fetch(`${reverseGeocodeUrl}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { countryCode?: unknown };
    return typeof data.countryCode === "string" ? data.countryCode.toUpperCase() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function detectCountry(options: {
  locale?: string;
  timeoutMs?: number;
} = {}): Promise<LocationDetection> {
  const locale = options.locale ?? "es";
  const timeoutMs = options.timeoutMs ?? 5000;
  const fallback = localeFallback(locale);

  if (typeof navigator === "undefined" || !navigator.geolocation) return fallback;

  return new Promise<LocationDetection>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
          locale,
          timeoutMs,
        ).then((country) => {
          resolve(country ? { country, source: "geolocation" } : fallback);
        });
      },
      () => resolve(fallback),
      { timeout: timeoutMs, maximumAge: 600_000 },
    );
  });
}
