# AGENTS.md — Kitho

Aplicación de finanzas familiares. Backend FastAPI + PostgreSQL, web Next.js 15, móvil Expo/React
Native. Monorepo: `backend/`, `frontend-web/`, `frontend-mobile/`, `design-tokens/`, `specs/`.

## Fuentes de verdad (en orden)

1. `.specify/memory/constitution.md` — reglas inmutables del producto y del stack.
2. `specs/###-*/spec.md` — qué se implementa. **No implementar nada fuera de la spec.**
3. `design-tokens/tokens.json` — única fuente de color, tipografía, spacing, radios, motion.
4. `docs/ux-playbook.md` — reglas de UX/UI y definición de hecho.
5. `.opencode/skills/kitho-ux/SKILL.md` — checklist operativa para cualquier cambio de UI.

## Comandos

```bash
# Backend
docker compose up -d
docker compose exec backend alembic upgrade head

# Web
cd frontend-web && pnpm install && pnpm run dev
pnpm run lint && pnpm run typecheck && pnpm test

# Móvil
cd frontend-mobile && pnpm install && pnpm start
pnpm run lint && pnpm run typecheck && pnpm test
```

## No negociables de UI

- Inicio **nunca** redirige. Toda entrada explica valor y siguiente paso.
- Entrada: sin sesión → login; con sesión y **sin** familia → ciclo de familia (elegir/crear/unirse);
  con sesión y **con** familia → Home. La regla vive en `useAuthGuard`, no en cada pantalla.
- Etapa actual: **solo ciclo de vida de la familia**. Finanzas = spec 004; hasta entonces se anuncian
  como "en camino", nunca como función disponible.
- Una acción primaria por pantalla; destructivas separadas y con confirmación que nombre el objeto.
- Matriz de estados obligatoria (carga, vacío, error con reintento, sin permiso, éxito, offline).
- Cero valores visuales fuera de tokens; cero paletas o fuentes paralelas.
- Sin jerga de modelo en la UI (`rol_permiso`, `parentesco`, `needs_*`).
- Accesibilidad AA: foco, teclado, live regions, estado seleccionado, touch ≥44.
- Copy completo en español e inglés.

## Proceso

- Feature nueva: `/speckit.specify` → completar `.specify/templates/ux-checklist.md` → `/speckit.plan`
  → `/speckit.tasks` → `/speckit.implement`.
- Cambio de UI: cargar la skill `kitho-ux` y seguir `docs/ux-playbook.md` §10 (DoD).
- Hallazgos de UX abiertos: `specs/003-ux-audit/audit.md` (no duplicar IDs).
- No instalar skills que reescriban el sistema visual (ui-ux-pro-max, design-system-builder).
