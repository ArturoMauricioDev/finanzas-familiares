# Implementation Plan: Ciclo de vida de la familia (Día 1)

**Branch**: `003-ux-audit` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ux-audit/spec.md`

**Alcance de este plan**: B1 (entrada, perfil mínimo, crear/unirse con consecuencias) ya está
implementado y se trata como comportamiento de referencia, con un ajuste pendiente: la pantalla de
elegir familia pasa a jerarquía **contextual** (FR-029/FR-030) y se aplica el copy cálido
(FR-032/FR-033). El trabajo planificado es **B2 ampliado**: el rol viaja con la invitación, el
catálogo se amplía a tío/abuelo/otro y el vínculo familiar solo aparece con **Otro**.

Se añade además la **puerta de entrada** (FR-034/FR-035, SC-012): sin sesión la app nunca muestra el
ciclo de familia, el login es la primera pantalla y la secuencia es login → perfil mínimo (solo si
falta) → ciclo de familia → Home, conservando el código de invitación a través del login.

Se incorpora además el **wizard de crear familia** (FR-036...FR-044, SC-013...SC-016): el alta pasa de un
formulario único a tres pasos guiados en una sola ruta, con borrador persistido en cliente
(`zustand` + `persist`). Es la primera pieza que ejercita la decisión de estado de cliente reservada
para la spec 004.

## Summary

Quien invita declara el rol de la persona invitada (`padre`, `madre`, `hijo`, `hija`, `tío`,
`abuelo` u `otro`) al generar un código de un solo uso. Ese rol se guarda con la invitación y se
aplica al unirse: padre/madre → administrador; hijo/hija/tío/abuelo/otro → miembro. El **vínculo
familiar** es texto libre, obligatorio solo cuando el rol es **Otro**, y no se muestra ni se envía
con cualquier otro rol. Quien se une deja de elegir rol; su pantalla queda con un solo campo. Los
códigos ya emitidos sin rol incorporan como miembro.

Enfoque técnico: dos columnas nullable en `invitations` (rol familiar y parentesco), una migración
Alembic que **amplía el enum de PostgreSQL** (`familyroleenum` con tío/abuelo/otro), validación
cruzada en Pydantic (`parentesco` obligatorio si y solo si `rol_familiar == otro`), y
`join_invitation` derivando la membresía desde la invitación. Web y móvil amplían el selector,
ocultan el campo de vínculo salvo en **Otro**, y aplican el copy cálido acordado.

La pantalla de elegir familia se vuelve contextual: con código pendiente, "unirme" es la primaria y
se confirma con el código ya cargado; sin código, "crear familia" es la primaria. Quien trae código
no pasa por la elección porque el login lo lleva directo a unirse.

La **puerta de entrada** se hace explícita en `useAuthGuard` (web y móvil): sin sesión se muestra el
login y nunca las pantallas del ciclo (elegir, crear, unirse); el login preserva el código de
invitación pendiente y, al autenticarse, entra directo a unirse. La secuencia queda fijada como
login → perfil mínimo (solo si falta) → ciclo de familia → Home (FR-034, FR-035, SC-012).

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (Next.js 15 y Expo/React Native)

**Primary Dependencies**: FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PostgreSQL; Next.js 15,
next-intl; Expo Router, i18n-js; `zustand` ^5 (estado de cliente: borrador del wizard)

**Storage**: PostgreSQL (columnas en `invitations`; ampliación del tipo enum `familyroleenum`; sin
tablas nuevas)

**Testing**: pytest (backend), Jest + Testing Library (web y móvil), `jest-axe` (accesibilidad)

**Target Platform**: navegador (web) e iOS/Android (móvil)

**Project Type**: monorepo web + móvil + API

**Performance Goals**: generar un código y unirse responden en menos de 1 s percibido en uso normal;
la pantalla de invitar se renderiza sin esperas adicionales y el campo de vínculo aparece sin
recargar

**Constraints**: máximo 10 integrantes activos por familia; códigos de un solo uso con 7 días de
validez; una sola moneda por familia (sin cambios); rol inmutable durante esta etapa; la entrada
exige sesión y respeta el orden login → perfil → ciclo → Home (FR-034/FR-035); el código de
invitación pendiente se conserva a través del login (FR-030); el wizard de crear familia hace una
sola llamada a `POST /families` al confirmar el paso 3 (FR-041); verificación responsive en
375/768/1024/1440 (web) e iOS/Android (móvil); gate UX de `ux-checklist.md` y `docs/ux-playbook.md` §10

**Scale/Scope**: 1 cambio de contrato (invitaciones), 1 migración que amplía el enum + columnas
existentes, 2 pantallas de invitación (web/móvil), 2 pantallas de elección/creación de familia,
guard de entrada en web y móvil con pruebas de gating, Home (copy de invitación), copy nuevo para
7 roles y 3 copys de flujo en español e inglés

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumple | Verificación |
| --- | --- | --- |
| I. Naturaleza y alcance | ✅ | El trabajo está en `spec.md`; finanzas quedan para la spec 004 |
| II. Stack obligatorio | ✅ | FastAPI + SQLAlchemy + PostgreSQL, Next.js, Expo; se añade **una** dependencia de cliente (`zustand`) justificada para el borrador del wizard y el piloto de estado de la spec 004 |
| III. Reglas de dominio | ✅ | "Administrador (Padre/Madre)" se mantiene; tío/abuelo/otro son miembros; moneda única intacta |
| IV. No objetivos | ✅ | Sin bancos, pagos, SMS ni PDF |
| V. Estructura y errores | ✅ | Códigos 400/403/409/422; validación de rol y vínculo en backend; mensajes traducidos |
| VI. Cero código sombra | ✅ | `specs/003-ux-audit/spec.md` aprobada antes de tocar modelo y UI |
| Identidad de marca | ✅ | Solo "Kitho" en textos nuevos |
| UX (`kitho-ux` / playbook §10) | ✅ | Una acción primaria, 8 estados, copy es/en, tokens, AA, sin jerga; ver `ux-checklist.md` |

Sin violaciones: no se requiere sección de complejidad adicional.

La puerta de entrada (FR-034/FR-035) refuerza el Principio V: ninguna pantalla del ciclo se muestra
sin sesión y el backend sigue siendo la autoridad (los endpoints exigen token).

## Project Structure

### Documentation (this feature)

```text
specs/003-ux-audit/
├── plan.md              # Este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── api-invitations.md
├── spec.md              # Fuente de verdad
├── audit.md            # Hallazgos y secuencia
├── decision-day-one.md  # D0–D5
├── copy-deck-b.md       # Copy B1/B2 es/en (incluye roles y vínculo condicional)
└── ux-checklist.md      # Gate de la skill kitho-ux (B2 ampliado)
```

### Source Code (repository root)

```text
backend/
├── alembic/versions/              # migración: rol y parentesco en invitations
└── app/
    ├── models/invitation.py       # columnas nuevas
    ├── schemas/invitation.py      # CreateInvitationRequest / JoinInvitationRequest
    ├── services/invitation_service.py
    └── api/v1/invitations.py

frontend-web/
├── hooks/useAuthGuard.ts                  # puerta de entrada: login primero, ciclo requiere sesión (FR-034/FR-035)
├── app/(auth)/auth/login/page.tsx         # login con valor; conserva el código de invitación pendiente
├── lib/session.ts                         # código pendiente + reconciliación de familia
├── app/(app)/family/members/page.tsx      # selector ampliado + vínculo condicional
├── app/(onboarding)/family/select/page.tsx # jerarquía contextual (FR-029/B1)
├── app/(onboarding)/family/create/page.tsx # wizard de 3 pasos (FR-036...FR-044)
├── lib/store/familyDraft.ts               # borrador zustand + persist del wizard
├── components/ui/Stepper.tsx              # progreso del wizard (nuevo en el inventario)
├── app/(app)/page.tsx                     # copy "Agregar integrantes a tu familia"
├── components/family/InviteCode.tsx       # muestra el rol de la invitación
├── lib/api.ts                             # payload de createInvitation
├── lib/types.ts                           # FamilyRole ampliado
└── __tests__/flows.test.tsx

frontend-mobile/
├── hooks/useAuthGuard.ts                  # puerta de entrada: login primero, ciclo requiere sesión (FR-034/FR-035)
├── app/(auth)/auth/login.tsx              # login con valor; conserva el código de invitación pendiente
├── lib/session.ts                         # código pendiente + reconciliación de familia
├── app/(app)/(tabs)/family/members.tsx    # selector ampliado + vínculo condicional
├── app/(onboarding)/family/select.tsx     # jerarquía contextual (FR-029/B1)
├── app/(onboarding)/family/create.tsx     # wizard de 3 pasos (FR-036...FR-044)
├── lib/store/familyDraft.ts               # borrador zustand + persist del wizard
├── components/ui/Stepper.tsx              # progreso del wizard (nuevo en el inventario)
├── app/(app)/(tabs)/index.tsx             # copy "Agregar integrantes a tu familia"
├── components/family/InviteCode.tsx
├── lib/api.ts
├── lib/types.ts                           # FamilyRole ampliado
└── __tests__/flows.test.tsx

shared/i18n/{es,en}.json                   # claves nuevas (generadas a ambos frontends)
```

**Structure Decision**: se respeta el monorepo existente. El backend es la autoridad del rol y del
vínculo; los frontends solo declaran el rol al invitar, ocultan el vínculo salvo en **Otro** y lo
muestran. El wizard de creación añade dos piezas por app (`lib/store/familyDraft.ts` y
`components/ui/Stepper.tsx`), ambas duplicadas web/móvil como el resto de `lib/`; el backend no
cambia.

## Phase 0 — Research

Ver [research.md](./research.md). Decisiones: rol persistido en la invitación, contrato de unión sin
rol, default de menor privilegio en el selector, códigos heredados como miembros, catálogo ampliado
de roles, vínculo condicional, copys cálidos y puerta de entrada con el orden login → perfil → ciclo
→ Home (R12).

## Phase 1 — Design

- [data-model.md](./data-model.md): entidades, enum ampliado, regla del vínculo y transiciones.
- [contracts/api-invitations.md](./contracts/api-invitations.md): contrato de crear invitación,
  listar y unirse, con validación condicional.
- [quickstart.md](./quickstart.md): escenarios ejecutables de validación end-to-end.
- [ux-checklist.md](./ux-checklist.md): gate de la skill `kitho-ux` actualizado.
- [copy-deck-b.md](./copy-deck-b.md): textos finales es/en.

## Phase 2 — Wizard de crear familia (diseño)

- **Pasos**: 1 Nombre · 2 Moneda · 3 Rol + resumen.
- **Ruta**: única (`family/create`), `step` en el store; `POST /families` al confirmar el paso 3.
- **Store** (`lib/store/familyDraft.ts`, duplicado web/móvil): `{step, nombre, moneda, rolFamiliar,
  setField, next, back, reset}` con `persist` (`kitho_family_draft`). Web: `localStorage` +
  `skipHydration`/`rehydrate` para evitar mismatch SSR. Móvil: adapter sobre `lib/storage.ts`.
- **Componente** `Stepper` en `components/ui` (web y móvil): `progressbar`, `aria-current="step"`,
  live region "Paso n de 3"; tokens-only.
- **Matriz de estados**: carga inicial (detección de moneda), carga de acción (crear), vacío (n/a
  justificado), error de carga (detección), error de acción local, sin permiso (n/a), éxito,
  offline/timeout.

## UX Gate (skill `kitho-ux`)

Toda pantalla tocada cumple, antes de cerrar B2:

1. **Una acción primaria**: "Generar invitación" en Miembros; "Crear familia" en la elección y en
   el formulario de creación; "Unirme con mi código" cuando hay código pendiente; en el wizard,
   "Continuar" (pasos 1–2) y "Crear familia" (paso 3).
2. **Copy cálido y sin jerga**: **Crear familia** (nunca "crear grupo") y **Agregar integrantes a
   tu familia** (nunca "Invita a tu familia"); el vínculo se llama **Vínculo familiar**, no
   `parentesco`; los roles visibles son Padre, Madre, Hijo, Hija, Tío, Abuelo y Otro.
3. **Matriz de 8 estados** (carga, carga de acción, vacío, error de carga, error de acción, sin
   permiso, éxito, offline) declarada en `ux-checklist.md` para Miembros, Invitar, Crear, Elegir y
   Home.
4. **Campo condicional accesible**: al elegir **Otro**, el campo aparece con etiqueta asociada,
   `aria-required`, foco visible y error local si se envía vacío; al cambiar a otro rol, el campo se
   oculta y su valor no se envía. El cambio se anuncia a tecnologías de asistencia.
5. **Accesibilidad AA**: foco, teclado, live regions, estado seleccionado expuesto, touch ≥44,
   contraste 4.5:1/3:1, zoom 200% y movimiento reducido.
6. **Tokens**: cero valores fuera de `design-tokens/tokens.json`.
7. **Responsive**: 375 / 768 / 1024 / 1440 y iOS/Android, sin cards dentro de cards.
8. **Puerta de entrada**: sin sesión, login primero y nunca las pantallas del ciclo; tras el login,
   perfil mínimo (solo si falta) y después el ciclo; el código de invitación pendiente sobrevive al
   login y lleva directo a unirse (FR-034/FR-035, SC-012).
9. **Wizard**: progreso anunciado ("Paso n de 3") y `aria-current`, foco al encabezado del paso,
   "Atrás" sin pérdida, "Salir" con confirmación que nombre el objeto, y reutilización de
   `CurrencySelect`/`TextField`/`RadioGroup`(web)/`ChoiceGroup`(móvil)/`Stepper` sin duplicar
   (FR-036...FR-044, SC-013...SC-016).

### Re-evaluación del Constitution Check

Tras el diseño: se mantienen los nueve puntos en verde. El contrato de unión deja de aceptar rol y
la validación condicional del vínculo refuerza el Principio V (backend como única autoridad). Se
introduce **una** dependencia de cliente (`zustand`) para el borrador del wizard, justificada en R14
y sin sustituir el stack del Principio II; no se introducen valores visuales fuera de tokens.