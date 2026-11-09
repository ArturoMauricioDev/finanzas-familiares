import {
  createCurrencySelection,
  getAllCurrencyCodes,
  isValidCurrencyCode,
  normalizeCurrencyCode,
  searchCurrencies,
} from "../lib/currency";

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

describe("mobile currency selection", () => {
  it("returns five regional suggestions with the local currency first", () => {
    const mexico = createCurrencySelection({ country: "MX" });
    expect(mexico.suggested).toHaveLength(5);
    expect(mexico.suggested[0]).toMatchObject({ code: "MXN", isLocal: true });
    expect(mexico.suggested.map((option) => option.code)).toEqual([
      "MXN",
      "BRL",
      "ARS",
      "COP",
      "CLP",
    ]);

    expect(createCurrencySelection({ country: "ES" }).suggested[0].code).toBe("EUR");
    expect(createCurrencySelection({ country: "US" }).suggested[0].code).toBe("USD");
  });

  it("falls back to the locale when location is denied", () => {
    const selection = createCurrencySelection({ locale: "es-MX" });
    expect(selection.source).toBe("locale");
    expect(selection.selectedCode).toBe("MXN");
  });

  it("uses the device region from a combined format locale", () => {
    const selection = createCurrencySelection({ locale: "es-US" });
    expect(selection.source).toBe("locale");
    expect(selection.selectedCode).toBe("USD");
  });

  it("searches other ISO 4217 currencies", () => {
    expect(searchCurrencies("JPY", "es")).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "JPY" })]),
    );
    expect(getAllCurrencyCodes()).toEqual(expect.arrayContaining(["MXN", "USD", "EUR"]));
  });

  it("normalizes currency codes", () => {
    expect(normalizeCurrencyCode(" eur ")).toBe("EUR");
    expect(isValidCurrencyCode("EUR")).toBe(true);
    expect(isValidCurrencyCode("EURO")).toBe(false);
  });
});