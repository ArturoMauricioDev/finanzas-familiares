import { expect, test } from "../fixtures/test";

async function brokenImages(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  );
}

/** 002 · Escenario 13. Marca Kitho y metadatos, sin assets rotos. */
test.describe("Marca y metadatos", () => {
  test("el login explica el producto y se titula Kitho", async ({ openAs }) => {
    const page = await openAs(null, { path: "/auth/login" });

    await expect(page).toHaveTitle("Kitho: tu familia, en orden");
    await expect(page.getByRole("heading", { level: 1, name: "Kitho" })).toBeVisible();
    await expect(
      page.getByText("Crea tu familia o únete con un código"),
    ).toBeVisible();
    await expect(
      page.getByText("Entras con tu cuenta de Google. No publicamos nada en tu nombre."),
    ).toBeVisible();
    expect(await brokenImages(page)).toEqual([]);
  });

  test("Ajustes muestra la versión y el wordmark Kitho", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/settings" });

    await expect(page.getByRole("heading", { name: "Acerca de Kitho" })).toBeVisible();
    await expect(page.getByText(/Versión 0\.1\.0 · Kitho/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Kitho" })).toBeVisible();
    expect(await brokenImages(page)).toEqual([]);
  });

  test("«Finanzas Familiares» no aparece como nombre del producto", async ({ openAs }) => {
    for (const path of ["/auth/login", "/legal"]) {
      const page = await openAs(null, { path });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Finanzas Familiares");
    }

    const settings = await openAs("admin", { path: "/settings" });
    await expect(settings.locator("body")).not.toContainText("Finanzas Familiares");
  });

  test("las finanzas se anuncian como próximas, no como disponibles", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/" });
    await expect(page.getByRole("heading", { name: "Finanzas en camino" })).toBeVisible();
  });
});
