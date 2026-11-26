import { expect, test } from "../fixtures/test";
import { actor } from "../fixtures/seed";

const GEOCODE_ENDPOINT = "https://api.bigdatacloud.net/**";

async function goToCurrencyStep(page: import("@playwright/test").Page, name: string) {
  await page.goto("/family/create");
  await page.getByLabel("Nombre de la familia").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Elige la moneda de la familia" }),
  ).toBeVisible();
  return page.getByLabel("Moneda local (ISO 4217)");
}

async function optionCodes(select: import("@playwright/test").Locator) {
  const labels = await select.locator("option").allTextContents();
  return labels.map((label) => label.slice(0, 3));
}

/** 002 · Escenario 17 y 003 · flujo de alta. */
test.describe("Selector de moneda regional", () => {
  test("con geolocalización en México se detecta MXN y va primero", async ({ openAs }) => {
    const page = await openAs(actor(12), {
      context: {
        // Locale español de España: si se usara el locale saldría EUR.
        locale: "es-ES",
        permissions: ["geolocation"],
        geolocation: { latitude: 19.4326, longitude: -99.1332 },
      },
    });
    await page.route(GEOCODE_ENDPOINT, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ countryCode: "MX" }),
      }),
    );

    const select = await goToCurrencyStep(page, "Familia México");

    await expect(select).toHaveValue("MXN");
    await expect(page.getByText("Moneda local detectada: MXN")).toBeVisible();
    expect((await optionCodes(select)).slice(0, 5)).toEqual([
      "MXN",
      "BRL",
      "ARS",
      "COP",
      "CLP",
    ]);
  });

  test("sin permiso de geolocalización cae al locale y luego a USD", async ({ openAs }) => {
    const page = await openAs(actor(13), {
      context: { locale: "es-ES", permissions: [] },
    });

    const select = await goToCurrencyStep(page, "Familia España");

    await expect(select).toHaveValue("EUR");
    expect((await optionCodes(select)).slice(0, 5)).toEqual([
      "EUR",
      "GBP",
      "CHF",
      "SEK",
      "PLN",
    ]);
  });

  test("Otros busca sobre ISO 4217 y la familia se crea con la moneda elegida", async ({
    openAs,
  }) => {
    const page = await openAs(actor(14), {
      context: { locale: "es-ES", permissions: [] },
    });

    const select = await goToCurrencyStep(page, "Familia Yen");
    await select.selectOption("__other__");

    await page.getByRole("searchbox", { name: "Buscar otra moneda" }).fill("JPY");
    await page.getByRole("option", { name: /^JPY/ }).click();

    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { name: "Tu rol en la familia" })).toBeVisible();
    await expect(page.getByText("Moneda: JPY")).toBeVisible();

    await page.getByRole("radio", { name: "Madre" }).check();
    await page.getByRole("button", { name: "Crear familia" }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
    await expect(page.getByText("Familia Yen")).toBeVisible();
    await expect(page.getByText("Moneda: JPY")).toBeVisible();
  });

  test("una búsqueda sin resultados lo dice sin romper el formulario", async ({ openAs }) => {
    const page = await openAs(actor(15), {
      context: { locale: "es-ES", permissions: [] },
    });
    const select = await goToCurrencyStep(page, "Familia Sin Resultados");
    await select.selectOption("__other__");

    await page.getByRole("searchbox", { name: "Buscar otra moneda" }).fill("ZZZZ");
    await expect(page.getByText("No encontramos monedas con esa búsqueda.")).toBeVisible();
  });

  test.fixme("el selector refleja la moneda elegida en Otros", async () => {
    // Hallazgo: tras elegir una moneda en «Otros» (p. ej. JPY), el <select>
    // vuelve a mostrar la primera sugerencia porque `options` solo contiene las
    // 5 sugerencias + «Otros». El valor guardado sí es correcto, pero el
    // control muestra otra moneda. Ver T184 / CurrencySelect.
  });
});
