import { defaultLocale, messages, supportedLocales } from "../lib/i18n/messages.generated";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("mobile translation catalogs", () => {
  it("supports Spanish and English with Spanish by default", () => {
    expect([...supportedLocales]).toEqual(["es", "en"]);
    expect(defaultLocale).toBe("es");
  });

  it("keeps the same keys in both languages", () => {
    expect(flattenKeys(messages.es).sort()).toEqual(flattenKeys(messages.en).sort());
  });

  it("covers the required namespaces", () => {
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

  it("keeps web and mobile key shapes aligned", () => {
    expect(flattenKeys(messages.es)).toContain("nav.members");
    expect(flattenKeys(messages.en)).toContain("errors.details.invitationExpired");
    expect(messages.en.nav.home).toBe("Home");
  });
});