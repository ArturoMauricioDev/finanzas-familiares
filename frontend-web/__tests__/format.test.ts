import { formatCurrency, formatLocaleFor } from "@/lib/format";

describe("format locale", () => {
  it("uses the UI locale when no device locale is available", () => {
    expect(formatLocaleFor("es")).toBe("es");
    expect(formatLocaleFor("es", null)).toBe("es");
  });

  it("combines the UI language with the device region", () => {
    expect(formatLocaleFor("es", "en-US")).toBe("es-US");
    expect(formatLocaleFor("es", "en-GB")).toBe("es-GB");
  });

  it("keeps a device locale that cannot be parsed", () => {
    expect(formatLocaleFor("es", "not a locale")).toBe("not a locale");
  });

  it("formats currency with the combined locale", () => {
    expect(formatCurrency(1234.5, "USD", "es-US")).toContain("1,234.50");
  });
});
