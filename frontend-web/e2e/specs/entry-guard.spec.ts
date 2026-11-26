import { expect, test } from "../fixtures/test";
import { PENDING_INVITE_KEY, SESSION_KEY } from "../fixtures/seed";

const CYCLE_PATHS = ["/family/select", "/family/create", "/invite"];

/**
 * 003-ux-audit · Escenario 0 y 002 · FR-034/FR-035/SC-012.
 * La puerta vive en `useAuthGuard`, no en cada pantalla.
 */
test.describe("Puerta de entrada", () => {
  test("sin sesión, la raíz y el ciclo llevan siempre al login", async ({ openAs }) => {
    for (const path of ["/", ...CYCLE_PATHS]) {
      const page = await openAs(null, { path });
      await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 20_000 });
      await expect(page.getByRole("heading", { level: 1, name: "Kitho" })).toBeVisible();
    }
  });

  test("una entrada de historial tampoco salta la puerta", async ({ openAs }) => {
    const page = await openAs(null);
    await page.goto("/auth/login");
    await page.goto("/family/select");
    await expect(page).toHaveURL(/\/auth\/login$/);

    await page.goBack();
    await expect(page).not.toHaveURL(/\/family\/(select|create)/);
  });

  test("con sesión y sin familia, el ciclo de familia es el destino", async ({ openAs }) => {
    for (const path of ["/", "/family/members", "/settings", "/profile"]) {
      const page = await openAs("familyless", { path });
      await expect(page).toHaveURL(/\/family\/select$/, { timeout: 20_000 });
    }
  });

  test("con sesión y sin perfil, primero se completa el perfil", async ({ openAs }) => {
    const page = await openAs("newUser", { path: "/" });
    await expect(page).toHaveURL(/\/profile\/setup$/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: "Completa tu perfil" }),
    ).toBeVisible();
  });

  test("con familia, el ciclo redirige a Inicio", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/family/select" });
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
  });

  test("el código pendiente sobrevive y abre la unión directa", async ({ openAs }) => {
    const page = await openAs("familyless", {
      path: "/",
      localStorage: { [PENDING_INVITE_KEY]: "ABCD2345" },
    });
    await expect(page).toHaveURL(/\/invite$/, { timeout: 20_000 });
    await expect(page.getByLabel("Código de invitación")).toHaveValue("ABCD2345");
    await expect(
      page.getByRole("heading", { level: 1, name: "Unirme con un código" }),
    ).toBeVisible();
  });

  test("con sesión válida, el login reenvía al ciclo de familia", async ({ openAs }) => {
    const page = await openAs("familyless", { path: "/auth/login" });
    await expect(page).toHaveURL(/\/family\/select$/, { timeout: 20_000 });
  });

  test("un usuario inexistente con token vigente se limpia y vuelve al login", async ({
    openAs,
  }) => {
    const page = await openAs("ghost", { path: "/" });

    await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Kitho" })).toBeVisible();

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
    expect(stored).toBeNull();
  });

  test("un fallo de red al validar conserva la sesión y no expulsa al login", async ({
    openAs,
  }) => {
    const page = await openAs("admin");
    await page.route("**/api/v1/auth/session", (route) => route.abort());
    await page.goto("/");

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
    expect(stored).not.toBeNull();
  });
});
