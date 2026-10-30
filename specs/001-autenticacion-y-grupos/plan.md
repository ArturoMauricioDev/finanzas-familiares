# Implementation Plan: Autenticación, Registro y Gestión de Grupos Familiares

**Branch**: `001-autenticacion-y-grupos` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-autenticacion-y-grupos/spec.md`

## Summary

Implementar autenticación exclusiva con Google Sign-In (Web Next.js y Móvil React Native/Expo),
emisión de JWT propio con claims (`user_id`, `family_id`, `role`), flujo obligatorio para
configurar perfil (nombre de visualización y foto avatar), selección obligatoria entre crear
grupo o unirse por invitación, creación de grupo con moneda local y rol admin automático, y
gestión de integrantes con límite de 10 miembros, roles admin/member, invitaciones y permisos
restringidos al administrador.

El diseño se apoya en cuatro decisiones transversales:

1. **Verificación fail-closed**: el backend sólo acepta Google ID tokens verificados por
   `google-auth` (firma, audiencia, emisor y expiración); cualquier fallo produce `401`.
2. **Transacciones atómicas**: la creación de grupo + membresía admin y la unión por invitación +
   consumo del token se confirman en una sola transacción.
3. **Validación en backend**: moneda ISO 4217, campos de perfil no vacíos, límites de expiración
   de invitación y reglas de unicidad/rol se validan antes de persistir.
4. **Clientes desacoplados**: ambos frontends consumen la API mediante URLs y Client IDs
   configurables por entorno, nunca valores hardcodeados.

## Technical Context

**Language/Version**: Python 3.11 (Backend FastAPI); TypeScript (Next.js Web; React Native/Expo Móvil)

**Primary Dependencies**: FastAPI 0.115, SQLAlchemy 2.0, Pydantic 2.9, Alembic, python-jose,
google-auth; Next.js 15 / React (RC), `@react-oauth/google`; Expo 52, React Native 0.76,
Expo Router, Google Sign-In SDK para móvil

**Storage**: PostgreSQL 16 (relacional, ACID). UUID como PK. `DECIMAL` con 2 decimales reservado
para montos financieros futuros, conforme al Principio III

**Testing**: pytest + FastAPI TestClient/httpx (backend); Jest + Testing Library (web);
Jest + React Native Testing Library (móvil)

**Target Platform**: Web (Next.js) + Móvil (Android/iOS via Expo) + API REST (FastAPI)

**Project Type**: Aplicación web + aplicación móvil + API (multi-proyecto)

**Performance Goals**: Autenticación completa < 10 s (SC-001); respuestas API < 200 ms p95

**Constraints**: Máximo 10 miembros activos por grupo; un único grupo activo por usuario; una
moneda local por grupo; verificación de token fail-closed; errores HTTP semánticos
(400/401/403/404/422); operaciones de escritura transaccionales; aislamiento y autorización por
rol en backend

**Scale/Scope**: Núcleo familiar (máx. 10 usuarios), 4 entidades (User, Family, Membership,
Invitation), 5 historias de usuario y 10 requisitos funcionales

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-design compliance review (Principios I–VI):**

- [x] **I. Naturaleza y Alcance**: la funcionalidad se limita a autenticación, perfil, grupos e
  integrantes; no se añaden funciones no documentadas.
- [x] **II. Stack Tecnológico**: Next.js/TypeScript, React Native/Expo/TypeScript, FastAPI,
  PostgreSQL, SQLAlchemy y Docker Compose son el stack obligatorio.
- [x] **III. Reglas de Dominio**: roles admin/member, un grupo activo por usuario, moneda única,
  límite de 10 miembros y autorización en backend respetados.
- [x] **IV. No-Objetivos**: sin Open Banking, scraping, SMS/correo, pasarelas de pago ni reportes
  PDF.
- [x] **V. Estructura y Errores**: estructura modular, FastAPI como autoridad de validación,
  códigos HTTP semánticos y mensajes de UI claros.
- [x] **VI. Comportamiento SDD**: la implementación se deriva estrictamente de `spec.md`; no se
  introducirá código sombra.

**Gate result**: PASS — sin violaciones que justificar.

## Key Design Decisions

| Área | Decisión | Motivo |
|------|----------|--------|
| Verificación Google | Usar `id_token.verify_oauth2_token` con `GOOGLE_CLIENT_ID`; eliminar cualquier decodificación sin verificar | Evita bypass de autenticación (FR-001, edge case token inválido, Principio V) |
| JWT propio | Access + refresh con `user_id`, `family_id`, `role`; el refresh relee la membresía activa antes de emitir | Claims siempre vigentes tras crear/unirse a grupo (FR-002, T062) |
| Creación de grupo | Family + Membership admin en una sola transacción con rollback | Atomicidad ACID y consistencia del núcleo familiar (FR-005) |
| Unión por invitación | Validar token/expiración/uso y contar miembros activos dentro de la transacción; crear membresía y marcar `usado` juntos | Evita carreras y dobles uniones (FR-006, FR-008) |
| Invitaciones | Token `secrets.token_urlsafe(32)`, único, con expiración configurable y un solo uso | Enlaces verificables y revocables por expiración (FR-006) |
| Roles | `admin` requerido en el servicio para invitar, promover y expulsar; proteger auto-expulsión y último admin | Cumple FR-010 y SC-005 |
| Validación | Pydantic: `moneda_local` ISO 4217 (3 letras), perfil no vacío, `expira_en_horas` acotado | Errores tempranos y consistentes (FR-003, FR-005) |
| Frontend | Guards de onboarding por estado de sesión (`needs_profile_setup`, `needs_family_setup`) persistido y renovado vía refresh | Flujo obligatorio y resistente a recargas (FR-003, FR-004, SC-006) |
| Configuración | `NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL` y Client IDs por entorno; CORS con lista permitida | Paridad de entornos y menor superficie de riesgo (Principio V) |
| Pruebas | Backend pytest para contratos/reglas; web y móvil Jest/Testing Library para flujos | Verificación de SC-002 a SC-005 y quickstart reproducible |

## Project Structure

### Documentation (this feature)

```text
specs/001-autenticacion-y-grupos/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/          # Routers: auth, users, families, invitations
│   ├── core/            # config, security (JWT), deps, errors
│   ├── db/              # session, base
│   ├── models/          # User, Family, Membership, Invitation
│   ├── schemas/         # Pydantic request/response models
│   └── services/        # auth, user, family, invitation logic
├── alembic/             # Migrations
└── tests/
    ├── contract/        # API contract tests
    ├── integration/     # DB + service flows
    └── unit/            # Pure logic tests

frontend-web/
├── app/
│   ├── auth/login/
│   ├── profile/setup/
│   ├── family/select/
│   ├── family/create/
│   ├── family/members/
│   └── invite/
├── components/
├── lib/                 # API client, auth helpers
├── hooks/               # Session/guards
└── tests/

frontend-mobile/
├── app/
│   ├── auth/login.tsx
│   ├── profile/setup.tsx
│   ├── family/select.tsx
│   ├── family/create.tsx
│   └── invite/
├── components/
├── lib/                 # API client, auth helpers
├── hooks/               # Session/guards
└── tests/

docker-compose.yml
```

**Structure Decision**: estructura multi-proyecto conforme al Principio II y al plan original
(`backend/`, `frontend-web/`, `frontend-mobile/`), orquestada con Docker Compose. Los tests se
organizan por tipo en backend y por flujo en cada frontend.

## Phase 0 / Phase 1 Outputs

- `research.md`: decisiones resueltas, incluyendo verificación estricta de tokens, atomicidad,
  validación, configuración y estrategia de pruebas.
- `data-model.md`: entidades, campos, relaciones, restricciones e índices.
- `contracts/openapi.yaml`: contrato REST (endpoints, payloads, códigos de error).
- `quickstart.md`: escenarios de validación end-to-end y comandos de ejecución de pruebas.

## Post-Design Constitution Check

*Re-evaluación posterior al diseño (Phase 1):*

- [x] **I**: el diseño no incorpora funcionalidad fuera de `spec.md`.
- [x] **II**: stack y contenedorización sin cambios.
- [x] **III**: se refuerzan unicidad de grupo activo, límite de 10 y roles; no se tocan reglas
  financieras futuras.
- [x] **IV**: sin integraciones prohibidas.
- [x] **V**: verificación fail-closed, validación Pydantic, errores semánticos y CORS acotado.
- [x] **VI**: cada decisión traza a un FR, SC, caso límite o principio constitucional.

**Post-design gate result**: PASS.

## Complexity Tracking

*No violations - tracking not needed.*
