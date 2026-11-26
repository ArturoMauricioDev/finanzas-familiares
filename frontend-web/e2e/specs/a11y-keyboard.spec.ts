import { expect, test } from "../fixtures/test";

/** 002 · Escenario 10 (teclado) y 003 · T032/T049 (foco y diálogos). */
test.describe("Accesibilidad (teclado)", () => {
  test("el enlace de salto lleva el foco al contenido principal", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/family/members" });
    await expect(page.getByRole("heading", { level: 1, name: "Familia E2E" })).toBeVisible();

    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(
      "Saltar al contenido principal",
    );

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("main-content");
  });

  test("Escape cierra el diálogo y devuelve el foco al disparador", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/settings" });
    const trigger = page.getByRole("button", { name: "Cerrar sesión" });

    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(() => Boolean(document.activeElement?.closest("dialog"))),
    ).toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(
      "Cerrar sesión",
    );
  });

  test("el wizard mueve el foco al encabezado de cada paso", async ({ openAs }) => {
    const page = await openAs("familyless", { path: "/family/create" });

    await page.getByLabel("Nombre de la familia").fill("Familia Foco");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(
      page.getByRole("heading", { name: "Elige la moneda de la familia" }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { name: "Tu rol en la familia" })).toBeFocused();
  });

  test("las flechas cambian el tema dentro del grupo de radios", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/settings" });

    await page.getByRole("radio", { name: "Sistema" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: "Claro" })).toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: "Oscuro" })).toBeChecked();
  });

  test("salir del wizard pide confirmación y Escape no descarta", async ({ openAs }) => {
    const page = await openAs("familyless", { path: "/family/create" });
    await page.getByLabel("Nombre de la familia").fill("Familia Escape");

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await expect(page.getByLabel("Nombre de la familia")).toHaveValue("Familia Escape");
  });
});
