import { defaultLocale, messages, supportedLocales } from "../lib/i18n/messages.generated";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("translation catalogs", () => {
  it("supports Spanish and English with Spanish as default", () => {
    expect([...supportedLocales]).toEqual(["es", "en"]);
    expect(defaultLocale).toBe("es");
  });

  it("keeps identical keys between Spanish and English", () => {
    expect(flattenKeys(messages.es).sort()).toEqual(flattenKeys(messages.en).sort());
  });

  it("includes every required namespace", () => {
    for (const namespace of [
      "common",
      "auth",
      "profile",
      "family",
      "invite",
      "members",
      "settings",
      "avatar",
      "errors",
      "a11y",
      "legal",
    ]) {
      expect(messages.es).toHaveProperty(namespace);
    }
  });

  it("translates the same visible key differently per locale", () => {
    expect(messages.es.nav.home).toBe("Inicio");
    expect(messages.en.nav.home).toBe("Home");
  });
});