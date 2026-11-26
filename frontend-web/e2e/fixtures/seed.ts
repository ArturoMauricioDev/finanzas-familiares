import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Raíz de `frontend-web/e2e`.
 *
 * Playwright transpila los tests a CommonJS (el `package.json` web no declara
 * `type: "module"`), así que aquí no se puede usar `import.meta`. Playwright
 * ejecuta los tests con el directorio de `playwright.config.ts` como `cwd`.
 */
export const E2E_DIR = path.resolve(process.cwd(), "e2e");

/**
 * El seed lo escribe el contenedor `backend-e2e` en `/app/.e2e/seed.json`, que el
 * volumen de `backend/` expone como `backend/.e2e/seed.json`.
 */
export const SEED_PATH =
  process.env.E2E_SEED_FILE ?? path.resolve(E2E_DIR, "../../backend/.e2e/seed.json");

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8001";
export const WEB_ORIGIN = process.env.E2E_WEB_ORIGIN ?? "http://127.0.0.1:3100";

export const SESSION_KEY = "finanzas_familiares_session";
export const PENDING_INVITE_KEY = "finanzas_familiares_pending_invite";
export const THEME_KEY = "kitho_theme";
export const LOCALE_KEY = "kitho_locale";

export interface SessionUser {
  id: string;
  email: string;
  nombre_visualizacion: string | null;
  foto_avatar: string | null;
  family_id: string | null;
  role: string | null;
}

/** Mismo contrato que `SessionState` de `frontend-web/lib/session.ts`. */
export interface SessionState {
  access_token: string;
  refresh_token: string;
  user: SessionUser;
  needs_profile_setup: boolean;
  needs_family_setup: boolean;
}

export type Identity = "admin" | "member" | "solo" | "familyless" | "newUser" | "expired";

export interface Seed {
  generatedAt: string;
  apiUrl: string;
  users: Record<Identity, SessionState>;
  families: {
    main: { id: string; name: string; currency: string };
    solo: { id: string; name: string; currency: string };
  };
  actors: Array<{ key: string; session: SessionState }>;
  invitations: { expired: string; used: string; legacy: string };
}

let cached: Seed | null = null;

export function loadSeed(): Seed {
  if (!cached) {
    cached = JSON.parse(readFileSync(SEED_PATH, "utf8")) as Seed;
  }
  return cached;
}

/**
 * Actores desechables para las pruebas que mutan datos (crear/unirse/abandonar).
 * Con `workers: 1` el índice es determinista; `retry` desplaza al bloque
 * siguiente para que un reintento no herede el estado del intento fallido.
 */
export function actor(index: number, retry = 0): SessionState {
  const { actors } = loadSeed();
  const slot = index + retry * 12;
  const entry = actors[slot];
  if (!entry) {
    throw new Error(
      `seed_e2e: no hay actor para el índice ${index} (retry ${retry}); reinicia con \`pnpm test:e2e\``,
    );
  }
  return entry.session;
}

export interface ExtraCookie {
  name: string;
  value: string;
}

export function storageFor(
  session: SessionState | null,
  extra: Record<string, string> = {},
  cookies: ExtraCookie[] = [],
) {
  const items = [
    ...(session ? [{ name: SESSION_KEY, value: JSON.stringify(session) }] : []),
    ...Object.entries(extra).map(([name, value]) => ({ name, value })),
  ];
  return {
    cookies: cookies.map((cookie) => ({
      ...cookie,
      domain: "127.0.0.1",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
    origins: [{ origin: WEB_ORIGIN, localStorage: items }],
  };
}
