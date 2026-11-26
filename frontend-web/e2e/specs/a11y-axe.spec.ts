import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "../fixtures/test";
import { waitForGsiButton } from "../fixtures/gsi";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  nodes: Array<{ target: Array<string | string[]> }>;
}

function format(violations: AxeViolation[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.nodes
          .map((node) => node.target.map(String).join(" "))
          .join("\n  ")}`,
    )
    .join("\n\n");
}

async function audit(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, format(results.violations)).toEqual([]);
}

/**
 * 002 · Escenario 10 y 003 · T032 (parte automática de accesibilidad).
 * Lighthouse añade la puntuación >=95; axe cubre las reglas WCAG A/AA.
 */
test.describe("Accesibilidad (axe)", () => {
  test("Login", async ({ openAs }) => {
    const page = await openAs(null, { path: "/auth/login" });
    await waitForGsiButton(page);
    await audit(page);
  });

  test("Miembros", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/family/members" });
    await expect(page.getByRole("heading", { level: 1, name: "Familia E2E" })).toBeVisible();
    await audit(page);
  });

  test("Ajustes", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/settings" });
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();
    await audit(page);
  });

  test("Inicio", async ({ openAs }) => {
    const page = await openAs("admin", { path: "/" });
    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
    await audit(page);
  });

  test("Unirse con un código", async ({ openAs }) => {
    const page = await openAs("familyless", { path: "/invite" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await audit(page);
  });

  test("Crear familia (paso 1)", async ({ openAs }) => {
    const page = await openAs("familyless", { path: "/family/create" });
    await expect(page.getByRole("heading", { level: 1, name: "Crear familia" })).toBeVisible();
    await audit(page);
  });

  test("Confirmación destructiva con el diálogo abierto", async ({ openAs }) => {
    const page = await openAs("solo", { path: "/family/members" });
    await page.getByRole("button", { name: "Eliminar familia" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await audit(page);
  });
});
