import { expect, test } from "../fixtures/test";

const THEME_COOKIE = "kitho_theme";

async function cookieValue(page: import("@playwright/test").Page, name: string) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === name)?.value ?? null;
}

/**
 * 002 · Escenarios 1 y 2. El tema se resuelve con un script inline antes de que
 * React monte (evita el flash claro).
 */
test.describe("Tema", () => {
  test("el script inline aplica el tema del sistema sin esperar a React", async ({ openAs }) => {
    const page = await openAs("admin", { context: { colorScheme: "dark" } });
    // Sin los bundles de React, solo puede quedar el bootstrap inline.
    await page.route(/\/_next\/static\/chunks\//, (route) => route.abort());
    await page.goto("/family/members", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const colorScheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(colorScheme).toBe("dark");
  });

  test("sistema en claro resuelve a claro", async ({ openAs }) => {
    const page = await openAs("admin", {
      path: "/family/members",
      context: { colorScheme: "light" },
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("cambiar a oscuro persiste tras recargar aunque el sistema esté en claro", async ({
    openAs,
  }) => {
    const page = await openAs("admin", {
      path: "/settings",
      context: { colorScheme: "light" },
    });

    await page.getByRole("radio", { name: "Oscuro" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => localStorage.getItem("kitho_theme"))).toBe("dark");
    expect(await cookieValue(page, THEME_COOKIE)).toBe("dark");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Oscuro" })).toBeChecked();
  });

  test("el modo Sistema sigue al SO en caliente, sin recargar", async ({ openAs }) => {
    const page = await openAs("admin", {
      path: "/settings",
      context: { colorScheme: "light" },
    });

    await page.getByRole("radio", { name: "Sistema" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("con movimiento reducido las animaciones se acortan", async ({ openAs }) => {
    const page = await openAs("admin", {
      path: "/family/members",
      context: { reducedMotion: "reduce" },
    });

    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const duration = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "animate-spin";
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).animationDuration;
      probe.remove();
      return value;
    });
    expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
  });
});
