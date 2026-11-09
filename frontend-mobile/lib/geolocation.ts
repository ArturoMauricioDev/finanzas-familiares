import * as Location from "expo-location";

import { countryFromLocale } from "./currency";


export type LocationSource = "geolocation" | "locale" | "fallback";

export interface LocationDetection {
  country: string | null;
  source: LocationSource;
}

function localeFallback(locale: string): LocationDetection {
  const country = countryFromLocale(locale);
  return { country, source: country ? "locale" : "fallback" };
}

export async function detectCountry(options: { locale?: string } = {}): Promise<LocationDetection> {
  const locale = options.locale ?? "es";
  const fallback = localeFallback(locale);

  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return fallback;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const country = places[0]?.isoCountryCode?.toUpperCase();
    return country ? { country, source: "geolocation" } : fallback;
  } catch {
    return fallback;
  }
}
