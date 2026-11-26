import { expect, test } from "../fixtures/test";

const CHART_LIBRARY = /recharts|victory/i;

const ROUTES = ["/auth/login", "/", "/family/members", "/profile", "/settings"];

/**
 * 002 · Escenario 11 (parte web).
 *
 * `ChartContainer` importa `ChartCanvas` con `next/dynamic`, y ninguna ruta
 * actual lo monta. Por eso Recharts no debe descargarse: si alguien lo importa
 * de forma estática, el nombre del chunk de `next dev` contiene `recharts` y
 * este test lo detecta.
 *
 * El chequeo estático de imports vive en `scripts/check-ui.mjs` (T120); aquí se
 * comprueba el comportamiento real del navegador.
 */
test.describe("Gráficos fuera del bundle inicial", () => {
  for (const path of ROUTES) {
    test(`${path} no descarga Recharts ni Victory`, async ({ openAs }) => {
      const page = await openAs("admin");
      const scripts: string[] = [];

      page.on("request", (request) => {
        const url = request.url();
        if (request.resourceType() === "script" || /\.m?js(\?|$)/.test(url)) {
          scripts.push(url);
        }
      });

      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      expect(
        scripts.filter((url) => CHART_LIBRARY.test(url)),
        `Recharts/Victory se descargaron en ${path}`,
      ).toEqual([]);
    });
  }
});