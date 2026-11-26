#!/usr/bin/env node
/**
 * Lighthouse (solo accesibilidad) sobre el build de producción.
 *
 * 002 · Escenario 10: Login, Miembros y Ajustes deben puntuar >= 95 en la
 * categoría de accesibilidad, sin violaciones críticas.
 *
 * Por qué un script y no `lighthouse` a secas:
 * - necesita el backend E2E levantado y sembrado;
 * - necesita una sesión en `localStorage` para las rutas protegidas;
 * - `next build` inlinea `NEXT_PUBLIC_API_URL`, así que el build debe hacerse
 *   con la URL del backend E2E.
 *
 * Uso:
 *   pnpm test:lighthouse
 *   pnpm test:lighthouse --keep     # deja el stack y el `next start` arriba
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

import { API_URL, WEB_DIR, startStack, stopStack } from "./lib/stack.mjs";

const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const WEB_ORIGIN = process.env.E2E_WEB_ORIGIN ?? `http://127.0.0.1:${WEB_PORT}`;
const THRESHOLD = 0.95;

const ROUTES = [
  { path: "/auth/login", label: "Login", authenticated: false },
  { path: "/family/members", label: "Miembros", authenticated: true },
  { path: "/settings", label: "Ajustes", authenticated: true },
];

const argv = process.argv.slice(2);
const keep = argv.includes("--keep");

function loadSession() {
  const seedPath = process.env.E2E_SEED_FILE ?? path.resolve(WEB_DIR, "../backend/.e2e/seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  return seed.users.admin;
}

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // aún arrancando
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`La web no respondió en ${url}`);
}

function startNext() {
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(WEB_PORT)], {
    cwd: WEB_DIR,
    stdio: "inherit",
    // Grupo propio para poder matar `next start` y su `next-server` juntos.
    detached: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: API_URL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "e2e-stub.apps.googleusercontent.com",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  return child;
}

async function stopNext(child) {
  if (!child) return;
  const kill = (signal) => {
    try {
      process.kill(-child.pid, signal);
    } catch {
      try {
        child.kill(signal);
      } catch {
        // ya terminó
      }
    }
  };
  kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  kill("SIGKILL");
}

/** Chrome de Playwright: no dependemos de un Chrome del sistema. */
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  return chromium.executablePath();
}

async function seedSession(port, session) {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  try {
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(`${WEB_ORIGIN}/auth/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate((value) => {
      window.localStorage.setItem("finanzas_familiares_session", JSON.stringify(value));
    }, session);
  } finally {
    // Desconecta sin cerrar Chrome: Lighthouse reutiliza este perfil.
    await browser.close();
  }
}

async function audit(route, session) {
  // `chrome-launcher` en WSL crea el perfil en un `C:\...` relativo al cwd, que
  // acaba como carpeta basura dentro de `frontend-web/`. Le pasamos un perfil
  // propio en /tmp y desactivamos su gestión (`userDataDir: false`) para que no
  // lo traduzca a una ruta de Windows: el Chromium que lanzamos es Linux.
  const profileDir = mkdtempSync(path.join(tmpdir(), "kitho-lighthouse-"));
  const chrome = await chromeLauncher.launch({
    chromePath: chromePath(),
    userDataDir: false,
    chromeFlags: [
      `--user-data-dir=${profileDir}`,
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
    ],
  });

  try {
    if (route.authenticated) {
      await seedSession(chrome.port, session);
    }

    const result = await lighthouse(`${WEB_ORIGIN}${route.path}`, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["accessibility"],
      formFactor: "desktop",
      screenEmulation: { disabled: true },
      throttlingMethod: "provided",
    });

    const score = result?.lhr.categories.accessibility.score ?? 0;
    const finalPath = result?.lhr.finalDisplayedUrl
      ? new URL(result.lhr.finalDisplayedUrl).pathname
      : "";
    // Evita un falso verde: sin la sesión sembrada, /family/members y /settings
    // redirigen a login y Lighthouse puntuaría el login tres veces.
    if (finalPath !== route.path) {
      throw new Error(
        `Lighthouse acabó en ${finalPath || "(sin URL)"} en lugar de ${route.path}`,
      );
    }
    const failures = (result?.lhr.categories.accessibility.auditRefs ?? [])
      .filter((ref) => result?.lhr.audits[ref.id]?.score !== null)
      .filter((ref) => (result?.lhr.audits[ref.id]?.score ?? 1) < 1)
      .map((ref) => `${ref.id}: ${result?.lhr.audits[ref.id]?.title}`);

    return { score, failures };
  } finally {
    await chrome.kill();
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

async function main() {
  let failure = null;
  let next = null;

  try {
    await startStack();
    const session = loadSession();

    console.log("→ Compilando la web para producción…");
    await new Promise((resolve, reject) => {
      const child = spawn("pnpm", ["exec", "next", "build"], {
        cwd: WEB_DIR,
        stdio: "inherit",
        env: {
          ...process.env,
          NEXT_PUBLIC_API_URL: API_URL,
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: "e2e-stub.apps.googleusercontent.com",
          NEXT_TELEMETRY_DISABLED: "1",
        },
      });
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`next build terminó con código ${code}`)),
      );
    });

    console.log(`→ Arrancando next start en ${WEB_ORIGIN}…`);
    next = startNext();
    await waitForServer(`${WEB_ORIGIN}/auth/login`);

    const results = [];
    for (const route of ROUTES) {
      console.log(`→ Auditando ${route.label}…`);
      results.push({ ...route, ...(await audit(route, session)) });
    }

    console.log("\nAccesibilidad (Lighthouse, umbral >= 95):");
    for (const result of results) {
      const score = Math.round(result.score * 100);
      console.log(`  ${result.label.padEnd(10)} ${String(score).padStart(3)}  ${result.path}`);
      for (const item of result.failures) console.log(`      · ${item}`);
    }

    const failing = results.filter((result) => result.score < THRESHOLD);
    if (failing.length > 0) {
      throw new Error(
        `Lighthouse por debajo de ${THRESHOLD * 100}: ${failing
          .map((result) => `${result.label} (${Math.round(result.score * 100)})`)
          .join(", ")}`,
      );
    }
  } catch (error) {
    failure = error;
  } finally {
    if (next) {
      await stopNext(next);
    }
    if (keep) {
      console.log(`→ Stack E2E en marcha (${API_URL}).`);
    } else {
      await stopStack();
    }
  }

  if (failure) {
    console.error(`\n✖ ${failure.message}`);
    process.exit(1);
  }
}

await main();
