import { appAlerts, expect, test } from "../fixtures/test";

/** 002 · Escenario 14. Sesión expirada: login, sin errores técnicos, preferencias intactas. */
test.describe("Sesión expirada", () => {
  test("un token caducado lleva al login y conserva tema e idioma", async ({ openAs }) => {
    const page = await openAs("expired", {
      path: "/family/members",
      localStorage: { kitho_theme: "dark", kitho_locale: "en" },
      cookies: [
        { name: "kitho_theme", value: "dark" },
        { name: "kitho_locale", value: "en" },
      ],
    });

    await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Kitho" })).toBeVisible();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(appAlerts(page)).toHaveCount(0);
  });
});
