import {
  test as base,
  expect,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from "@playwright/test";

import { installGsiStub } from "./gsi";
import { loadSeed, storageFor, WEB_ORIGIN, type Identity, type SessionState } from "./seed";

export interface OpenOptions {
  /** Ruta inicial. Si se omite, la página queda en blanco para navegar a mano. */
  path?: string;
  /** Claves extra de `localStorage` (p. ej. `PENDING_INVITE_KEY`). */
  localStorage?: Record<string, string>;
  /** Cookies extra (p. ej. `kitho_theme` para el render del servidor). */
  cookies?: Array<{ name: string; value: string }>;
  /** Overrides del contexto (viewport, permisos, geolocalización, locale…). */
  context?: BrowserContextOptions;
  /** Desactiva el stub de Google si la prueba necesita el script real. */
  gsiStub?: boolean;
}

export type OpenAs = (
  identity: Identity | SessionState | null,
  options?: OpenOptions,
) => Promise<Page>;

export interface Fixtures {
  openAs: OpenAs;
}

export const test = base.extend<Fixtures>({
  openAs: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const openAs: OpenAs = async (identity, options = {}) => {
      const session =
        identity === null
          ? null
          : typeof identity === "string"
            ? loadSeed().users[identity]
            : identity;

      const context = await browser.newContext({
        baseURL: WEB_ORIGIN,
        locale: "es-ES",
        timezoneId: "Europe/Madrid",
        viewport: { width: 1440, height: 900 },
        storageState: storageFor(session, options.localStorage, options.cookies),
        ...options.context,
      });
      contexts.push(context);

      const page = await context.newPage();
      if (options.gsiStub !== false) {
        await installGsiStub(page);
      }
      if (options.path) {
        await page.goto(options.path);
      }
      return page;
    };

    await use(openAs);

    await Promise.all(contexts.map((context) => context.close()));
  },
});

export { expect };

/** Sin scroll horizontal: el criterio de reflow de la spec 002 (#4) y 003 (T032). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, "la página no debe tener scroll horizontal").toBeLessThanOrEqual(1);
}

/** Los tres `<nav>` del shell comparten etiqueta; el orden del DOM es sidebar, rail, tabs. */
export function primaryNavs(page: Page) {
  // Selector CSS, no `getByRole`: `getByRole` descarta del árbol de
  // accesibilidad los `<nav>` con `display:none`, así que a 320px solo devolvería
  // el de pestañas y se perdería el orden sidebar/rail/tabs que asume el test.
  return page.locator('nav[aria-label="Navegación principal"]');
}

/**
 * Alertas de la app. Excluye `#__next-route-announcer__`, el anunciador de rutas
 * que Next inyecta con `role="alert"` en el build de producción y que no es un
 * mensaje de la interfaz.
 */
export function appAlerts(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
