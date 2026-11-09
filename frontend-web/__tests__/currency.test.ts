import {
  createCurrencySelection,
  getAllCurrencyCodes,
  isValidCurrencyCode,
  normalizeCurrencyCode,
  searchCurrencies,
} from "@/lib/currency";

describe("currency selection", () => {
  it("returns exactly five regional suggestions with the local currency first", () => {
    const mexico = createCurrencySelection({ country: "MX" });
    expect(mexico.suggested).toHaveLength(5);
    expect(mexico.suggested[0]).toMatchObject({
      code: "MXN",
      isLocal: true,
      source: "geolocation",
    });
    expect(mexico.suggested.map((option) => option.code)).toEqual([
      "MXN",
      "BRL",
      "ARS",
      "COP",
      "CLP",
    ]);

    const spain = createCurrencySelection({ country: "ES" });
    expect(spain.suggested[0]).toMatchObject({ code: "EUR", isLocal: true });
    expect(spain.suggested).toHaveLength(5);

    const unitedStates = createCurrencySelection({ country: "US" });
    expect(unitedStates.suggested[0]).toMatchObject({ code: "USD", isLocal: true });
    expect(unitedStates.suggested).toHaveLength(5);
  });

  it("uses the locale when geolocation is unavailable", () => {
    const selection = createCurrencySelection({ locale: "es-MX" });
    expect(selection.detectedCountry).toBe("MX");
    expect(selection.source).toBe("locale");
    expect(selection.selectedCode).toBe("MXN");
  });

  it("uses the device region from a combined format locale", () => {
    const selection = createCurrencySelection({ locale: "es-US" });
    expect(selection.detectedCountry).toBe("US");
    expect(selection.source).toBe("locale");
    expect(selection.selectedCode).toBe("USD");
  });

  it("prepends a local currency that is not part of the regional list", () => {
    const selection = createCurrencySelection({ country: "PE" });
    expect(selection.suggested).toHaveLength(5);
    expect(selection.suggested[0]).toMatchObject({ code: "PEN", isLocal: true });
  });

  it("searches ISO 4217 codes by code and translated name", () => {
    expect(searchCurrencies("JPY", "es")).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "JPY" })]),
    );
    expect(searchCurrencies("yen", "es")).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "JPY" })]),
    );
    expect(getAllCurrencyCodes()).toEqual(expect.arrayContaining(["MXN", "USD", "EUR"]));
  });

  it("normalizes and rejects invalid codes", () => {
    expect(normalizeCurrencyCode(" mxn ")).toBe("MXN");
    expect(isValidCurrencyCode("MXN")).toBe(true);
    expect(isValidCurrencyCode("MXNX")).toBe(false);
    expect(isValidCurrencyCode("ABC")).toBe(false);
  });
});