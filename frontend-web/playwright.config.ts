import { defineConfig } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT ?? 3100);
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8001";
const baseURL = process.env.E2E_WEB_ORIGIN ?? `http://127.0.0.1:${webPort}`;

/**
 * Playwright cubre solo la web. La app móvil (iOS/Android) necesita Maestro o
 * Detox; ver `specs/002-ui-styles-and-views/quickstart.md`.
 *
 * El backend E2E (:8001) y el seed los gestiona `e2e/run.mjs`, no este archivo:
 * así `playwright test` nunca apunta a la base de datos de desarrollo.
 */
export default defineConfig({
  testDir: "./e2e/specs",
  outputDir: "./e2e/.artifacts/results",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  // Las pruebas de integración comparten actores desechables del seed; con un
  // worker el reparto es determinista y los códigos de un solo uso no chocan.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "./e2e/.artifacts/report", open: "never" }],
  ],
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    // Build de producción, no `next dev`: el servidor de desarrollo compila cada
    // ruta en la primera visita (los primeros tests agotan su espera) y su
    // websocket de HMR impide que `networkidle` se estabilice. El build además
    // garantiza que la suite valida lo mismo que se despliega.
    command: `pnpm exec next build && pnpm exec next start -p ${webPort}`,
    url: `${baseURL}/auth/login`,
    // `E2E_REUSE_SERVER=1` reutiliza un `next start` ya levantado (iteración local).
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      NEXT_PUBLIC_API_URL: apiUrl,
      // Valor de mentira: el script de Google se sustituye por un stub en las
      // pruebas. Sin un valor, `GoogleOAuthProvider` no renderiza el botón.
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "e2e-stub.apps.googleusercontent.com",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
