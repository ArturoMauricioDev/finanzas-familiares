import { expect, test } from "../fixtures/test";

const LOCALE_COOKIE = "kitho_locale";

/**
 * 002 · Escenario 3. El selector de idioma vive en Ajustes, así que la
 * traducción en caliente se comprueba allí; los errores se comprueban ya en
 * inglés sobre la pantalla que los provoca.
 */
test.describe("Idioma", () => {
  test("cambiar a inglés actualiza la pantalla y persiste tras recargar", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/settings" });
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();

    await page.getByRole("radio", { name: "English" }).check();

    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Language" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await page.evaluate(() => localStorage.getItem("kitho_locale"))).toBe("en");
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === LOCALE_COOKIE)?.value).toBe("en");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByRole("radio", { name: "Español" }).check();
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("un error de backend se muestra en el idioma activo", async ({ openAs }) => {
    const page = await openAs("familyless", {
      path: "/invite",
      localStorage: { kitho_locale: "en" },
      cookies: [{ name: LOCALE_COOKIE, value: "en" }],
    });

    await expect(page.getByRole("heading", { level: 1, name: "Join with a code" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByLabel("Invitation code").fill("aaaa2222");
    await page.getByRole("button", { name: "Join the family" }).click();

    await expect(page.getByText("The invitation code is invalid.")).toBeVisible();
  });

  test.fixme(
    "un error ya visible se traduce sin recargar",
    async () => {
      // No es alcanzable en web: el único selector de idioma está en Ajustes y
      // las pantallas con errores (Miembros, Invitación) no lo incluyen. La
      // traducción en caliente de un error ya renderizado queda cubierta por
      // `frontend-web/__tests__/i18n.test.ts` y `locale.test.tsx`.
    },
  );
});
