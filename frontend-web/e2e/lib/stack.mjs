import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const WEB_DIR = path.resolve(here, "../..");
export const ROOT_DIR = path.resolve(WEB_DIR, "..");
export const COMPOSE_FILE = path.join(ROOT_DIR, "docker-compose.e2e.yml");
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8001";

/** Ejecuta un comando y espera a que termine; rechaza si sale con código != 0. */
export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT_DIR,
      stdio: options.stdio ?? "inherit",
      env: { ...process.env, ...options.env },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} terminó con código ${code}`));
    });
  });
}

export function compose(...args) {
  return run("docker", ["compose", "-f", COMPOSE_FILE, ...args]);
}

export async function waitForHealth(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch {
      // el contenedor aún está arrancando
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`El backend E2E no respondió en ${API_URL}/health`);
}

/**
 * Levanta el stack aislado, migra y siembra. No arranca la web: eso lo hace
 * Playwright (`webServer`) o `lighthouse.mjs` (build + start de producción).
 */
export async function startStack() {
  console.log("→ Levantando PostgreSQL y backend E2E…");
  await compose("up", "-d", "--wait");
  await waitForHealth();

  console.log("→ Aplicando migraciones…");
  await compose("exec", "-T", "backend-e2e", "alembic", "upgrade", "head");

  console.log("→ Sembrando identidades de prueba…");
  await compose("exec", "-T", "backend-e2e", "python", "-m", "scripts.seed_e2e", "--reset");
}

export async function stopStack() {
  await compose("stop").catch(() => undefined);
}
