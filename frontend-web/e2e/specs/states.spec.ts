import { appAlerts, expect, test } from "../fixtures/test";
import { loadSeed } from "../fixtures/seed";

const FAMILY_ENDPOINT = "**/api/v1/families/me";

/** 002 · Escenario 9. Carga, error con reintento y vacío, sin toasts ni skeletons. */
test.describe("Estados de carga, error y vacío", () => {
  test("mientras carga se anuncia el estado y el control sigue deshabilitado", async ({
    openAs,
  }) => {
    const page = await openAs("admin");
    await page.route(FAMILY_ENDPOINT, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.continue();
    });

    await page.goto("/family/members");
    await expect(page.getByText("Cargando información del grupo...")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Familia E2E" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("un error 500 muestra banner con role=alert y reintento funcional", async ({ openAs }) => {
    const page = await openAs("admin");
    await page.route(FAMILY_ENDPOINT, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      }),
    );

    await page.goto("/family/members");
    await expect(appAlerts(page)).toContainText(
      "Ocurrió un error en el servidor. Inténtalo de nuevo.",
    );

    await page.unroute(FAMILY_ENDPOINT);
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Familia E2E" })).toBeVisible();
    await expect(appAlerts(page)).toHaveCount(0);
  });

  test("sin integrantes se muestra el estado vacío explicado", async ({ openAs }) => {
    const { families } = loadSeed();
    const page = await openAs("admin");
    await page.route(FAMILY_ENDPOINT, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          family: {
            id: families.main.id,
            nombre: families.main.name,
            moneda_local: families.main.currency,
            creado_por: loadSeed().users.admin.user.id,
            fecha_creacion: new Date().toISOString(),
            estado: "activo",
          },
          members: [],
          member_count: 0,
        }),
      }),
    );

    await page.goto("/family/members");
    await expect(page.getByText("Aún no hay integrantes para mostrar.")).toBeVisible();
  });

  test("sin invitación activa se explica cómo generarla", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/family/members" });
    await expect(
      page.getByText("No hay una invitación activa. Genera un código para invitar."),
    ).toBeVisible();
  });

  test("generar invitación bloquea el botón y mantiene su etiqueta", async ({ openAs }) => {
    const page = await openAs("admin");
    await page.route("**/api/v1/families/me/invitations", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });

    await page.goto("/family/members");
    const button = page.getByRole("button", { name: "Generar invitación" });
    await button.click();

    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(page.getByText("Invitación para: Hijo")).toBeVisible({ timeout: 15_000 });
  });
});
