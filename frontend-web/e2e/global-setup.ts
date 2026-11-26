import { existsSync } from "node:fs";
import { request } from "@playwright/test";

import { API_URL, SEED_PATH } from "./fixtures/seed";

/**
 * Verifica que el stack E2E esté listo y explica qué hacer si no lo está.
 * El stack lo levanta `pnpm test:e2e` (ver `e2e/run.mjs`).
 */
export default async function globalSetup(): Promise<void> {
  const client = await request.newContext();
  try {
    const response = await client.get(`${API_URL}/health`, { timeout: 5_000 });
    if (!response.ok()) {
      throw new Error(`respondió ${response.status()}`);
    }
  } catch (error) {
    throw new Error(
      [
        `El backend E2E no responde en ${API_URL}/health (${(error as Error).message}).`,
        "Levanta el stack y ejecuta la suite con:",
        "  cd frontend-web && pnpm test:e2e",
        "No uses `playwright test` directamente: no arranca ni siembra el backend.",
      ].join("\n"),
    );
  } finally {
    await client.dispose();
  }

  if (!existsSync(SEED_PATH)) {
    throw new Error(
      [
        `No existe el seed de pruebas en ${SEED_PATH}.`,
        "Ejecuta `cd frontend-web && pnpm test:e2e`, que migra y siembra la base E2E.",
      ].join("\n"),
    );
  }
}
