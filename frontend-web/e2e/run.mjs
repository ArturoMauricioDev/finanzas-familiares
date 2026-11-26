#!/usr/bin/env node
/**
 * Orquestador de las pruebas E2E.
 *
 * 1. Levanta el stack aislado (`docker-compose.e2e.yml`): PostgreSQL propio y
 *    backend en :8001. No toca la base de datos de desarrollo.
 * 2. Aplica migraciones y siembra identidades.
 * 3. Compila la web y arranca `next start` en :3100. Playwright reutiliza ese
 *    servidor (`E2E_REUSE_SERVER`); no lo arranca él para que el apagado sea
 *    determinista (ver `stopWeb`).
 * 4. Ejecuta Playwright y apaga el servidor y el stack, salvo `--keep`.
 *
 * Uso:
 *   pnpm test:e2e
 *   pnpm test:e2e --keep                 # deja el stack arriba para depurar
 *   pnpm test:e2e --grep invitation      # argumentos extra van a Playwright
 *   pnpm test:e2e --ui
 */
import { spawn } from "node:child_process";
import path from "node:path";

import { API_URL, COMPOSE_FILE, ROOT_DIR, WEB_DIR, run, startStack, stopStack } from "./lib/stack.mjs";

const argv = process.argv.slice(2);
const keep = argv.includes("--keep");
const passthrough = argv.filter((arg) => arg !== "--keep");

const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const WEB_ORIGIN = process.env.E2E_WEB_ORIGIN ?? `http://127.0.0.1:${WEB_PORT}`;
const WEB_ENV = {
  ...process.env,
  NEXT_PUBLIC_API_URL: API_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "e2e-stub.apps.googleusercontent.com",
  NEXT_TELEMETRY_DISABLED: "1",
};

async function waitForWeb(url, timeoutMs = 120_000) {
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
  throw new Error(`La web E2E no respondió en ${url}`);
}

/**
 * `next start` corre en su propio grupo de procesos (`detached`). Matar el grupo
 * completo evita el `next-server` huérfano que dejaba el puerto 3100 ocupado y
 * rompía la siguiente ejecución.
 */
async function stopWeb(child) {
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

async function main() {
  let failure = null;
  let web = null;

  try {
    await startStack();

    console.log("→ Compilando la web para producción...");
    await run("pnpm", ["exec", "next", "build"], { cwd: WEB_DIR, env: WEB_ENV });

    console.log(`→ Arrancando next start en ${WEB_ORIGIN}...`);
    web = spawn("pnpm", ["exec", "next", "start", "-p", String(WEB_PORT)], {
      cwd: WEB_DIR,
      stdio: "inherit",
      detached: true,
      env: WEB_ENV,
    });
    await waitForWeb(`${WEB_ORIGIN}/auth/login`);

    console.log("→ Ejecutando Playwright...");
    await run("pnpm", ["exec", "playwright", "test", ...passthrough], {
      cwd: WEB_DIR,
      env: {
        E2E_API_URL: API_URL,
        E2E_REUSE_SERVER: "1",
        E2E_WEB_PORT: String(WEB_PORT),
        E2E_WEB_ORIGIN: WEB_ORIGIN,
      },
    });
  } catch (error) {
    failure = error;
  } finally {
    await stopWeb(web);
    if (keep) {
      console.log(`→ Stack E2E en marcha (${API_URL}). Apágalo con:`);
      console.log(`   docker compose -f ${path.relative(ROOT_DIR, COMPOSE_FILE)} down`);
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