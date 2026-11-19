# Implementation Plan: Ciclo de vida de la familia (Día 1)

**Branch**: `003-ux-audit` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ux-audit/spec.md`

**Alcance de este plan**: B1 (entrada, perfil mínimo, crear/unirse con consecuencias) ya está
implementado y se trata como comportamiento de referencia, con un ajuste pendiente: la pantalla de
elegir familia pasa a jerarquía **contextual** (FR-029/FR-030). El trabajo planificado es **B2**: el
rol viaja con la invitación y se elimina del formulario de unirse.

## Summary

Quien invita declara el rol de la persona invitada (`padre`, `madre`, `hijo`, `hija`) al generar un
código de un solo uso. Ese rol se guarda con la invitación y se aplica al unirse: padre/madre →
administrador, hijo/hija → miembro. Quien se une deja de elegir rol; su pantalla queda con un solo
campo. Los códigos ya emitidos sin rol incorporan como miembro.

Enfoque técnico: dos columnas nullable en `invitations` (rol familiar y parentesco opcional), una
migración Alembic, el rol obligatorio en la petición de creación, y `join_invitation` derivando la
membresía desde la invitación en lugar de desde el cuerpo de la petición. Web y móvil añaden el
selector de rol en la pantalla de invitar y lo muestran en el código generado.

La pantalla de elegir familia se vuelve contextual: con código pendiente, "unirme" es la primaria y
se confirma con el código ya cargado; sin código, "crear" es la primaria. Quien trae código no pasa
por la elección porque el login lo lleva directo a unirse.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (Next.js 15 y Expo/React Native)

**Primary Dependencies**: FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PostgreSQL; Next.js 15,
next-intl; Expo Router, i18n-js

**Storage**: PostgreSQL (columnas nuevas en `invitations`; sin tablas nuevas)

**Testing**: pytest (backend), Jest + Testing Library (web y móvil), `jest-axe` (accesibilidad)

**Target Platform**: navegador (web) e iOS/Android (móvil)

**Project Type**: monorepo web + móvil + API

**Performance Goals**: generar un código y unirse responden en menos de 1 s percibido en uso normal;
la pantalla de invitar se renderiza sin esperas adicionales

**Constraints**: máximo 10 integrantes activos por familia; códigos de un solo uso con 7 días de
validez; una sola moneda por familia (sin cambios); rol inmutable durante esta etapa; verificación
responsive en 375/768/1024/1440 (web) e iOS/Android (móvil); gate UX de `ux-checklist.md`

**Scale/Scope**: 1 cambio de contrato (invitaciones), 1 migración, 2 pantallas de invitación
(web/móvil), 2 pantallas de elección de familia con jerarquía contextual, 10 claves de copy nuevas
en 2 idiomas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumple | Verificación |
| --- | --- | --- |
| I. Naturaleza y alcance | ✅ | El trabajo está en `spec.md`; finanzas quedan para la spec 004 |
| II. Stack obligatorio | ✅ | FastAPI + SQLAlchemy + PostgreSQL, Next.js, Expo; sin dependencias nuevas |
| III. Reglas de dominio | ✅ | "Administrador (Padre/Madre)" es exactamente FR-012/FR-013; moneda única intacta |
| IV. No objetivos | ✅ | Sin bancos, pagos, SMS ni PDF |
| V. Estructura y errores | ✅ | Códigos 400/403/409 ya usados; validación en backend; mensajes traducidos |
| VI. Cero código sombra | ✅ | `specs/003-ux-audit/spec.md` aprobada antes de tocar modelo |
| Identidad de marca | ✅ | Solo "Kitho" en textos nuevos |

Sin violaciones: no se requiere sección de complejidad adicional.

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
├── audit.md             # Hallazgos y secuencia
├── decision-day-one.md  # D0–D5
├── copy-deck-b.md       # Copy B1 es/en
└── ux-checklist.md      # Gate de la skill kitho-ux (B2)
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
├── app/(app)/family/members/page.tsx      # selector de rol al invitar
├── app/(onboarding)/family/select/page.tsx # jerarquía contextual (FR-029/B1)
├── components/family/InviteCode.tsx       # muestra el rol de la invitación
├── lib/api.ts                             # payload de createInvitation
└── __tests__/flows.test.tsx

frontend-mobile/
├── app/(app)/(tabs)/family/members.tsx    # selector de rol al invitar
├── app/(onboarding)/family/select.tsx     # jerarquía contextual (FR-029/B1)
├── components/family/InviteCode.tsx
├── lib/api.ts
└── __tests__/flows.test.tsx

shared/i18n/{es,en}.json                   # claves nuevas (generadas a ambos frontends)
```

**Structure Decision**: se respeta el monorepo existente. El backend es la autoridad del rol; los
frontends solo declaran el rol al invitar y lo muestran. No se crean módulos nuevos.

## Phase 0 — Research

Ver [research.md](./research.md). Decisiones: rol persistido en la invitación, contrato de unión sin
rol, default de menor privilegio en el selector, y códigos heredados como miembros.

## Phase 1 — Design

- [data-model.md](./data-model.md): entidades, columnas y transición de estado de la invitación.
- [contracts/api-invitations.md](./contracts/api-invitations.md): contrato de crear invitación,
  listar y unirse.
- [quickstart.md](./quickstart.md): escenarios ejecutables de validación end-to-end.

### Re-evaluación del Constitution Check

Tras el diseño: se mantienen los siete puntos en verde. El contrato de unión deja de aceptar rol,
lo que refuerza el Principio V (backend como única autoridad) y no introduce dependencias nuevas.