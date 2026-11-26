import { expect, expectNoHorizontalScroll, primaryNavs, test } from "../fixtures/test";

const WIDTHS = [320, 375, 599, 600, 768, 839, 840, 1024, 1440];

/**
 * 002 · Escenario 4 y 003 · T032 (parte web).
 * >=840 sidebar · 600–839 rail · <600 tabs inferiores.
 */
test.describe("Navegación responsive", () => {
  for (const width of WIDTHS) {
    test(`a ${width}px no hay scroll horizontal y la navegación es la correcta`, async ({
      openAs,
    }) => {
      const page = await openAs("admin", {
        path: "/family/members",
        context: { viewport: { width, height: 900 } },
      });
      await expect(page.getByRole("heading", { level: 1, name: "Familia E2E" })).toBeVisible();
      await expectNoHorizontalScroll(page);

      const navs = primaryNavs(page);
      const [sidebar, rail, bottom] = [navs.nth(0), navs.nth(1), navs.nth(2)];

      if (width >= 840) {
        await expect(sidebar).toBeVisible();
        await expect(rail).toBeHidden();
        await expect(bottom).toBeHidden();
      } else if (width >= 600) {
        await expect(sidebar).toBeHidden();
        await expect(rail).toBeVisible();
        await expect(bottom).toBeHidden();
      } else {
        await expect(sidebar).toBeHidden();
        await expect(rail).toBeHidden();
        await expect(bottom).toBeVisible();
      }

      const current = page.locator('a[aria-current="page"]:visible');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAccessibleName("Miembros");
    });
  }

  test("en móvil web hay tres pestañas y Ajustes no es una de ellas", async ({ openAs }) => {
    const page = await openAs("admin", {
      path: "/family/members",
      context: { viewport: { width: 375, height: 812 } },
    });
    const bottom = primaryNavs(page).nth(2);
    await expect(bottom.getByRole("link")).toHaveCount(3);
    await expect(bottom.getByRole("link", { name: "Ajustes" })).toHaveCount(0);
    await expect(bottom.getByRole("link", { name: "Inicio" })).toBeVisible();
    await expect(bottom.getByRole("link", { name: "Miembros" })).toBeVisible();
    await expect(bottom.getByRole("link", { name: "Perfil" })).toBeVisible();
  });

  test("Ajustes y Perfil no desbordan a 320px", async ({ openAs }) => {
    for (const path of ["/settings", "/profile", "/"]) {
      const page = await openAs("admin", {
        path,
        context: { viewport: { width: 320, height: 640 } },
      });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
  });
});
