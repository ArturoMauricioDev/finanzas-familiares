# Implementation Plan: Autenticación, Registro y Gestión de Grupos Familiares

**Branch**: `001-auth-family-groups` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-auth-family-groups/spec.md`

## Summary

Implementar autenticación exclusiva con Google Sign-In (Web Next.js y Móvil React Native/Expo), emisión de JWT propio con claims (user_id, family_id, role), flujo obligatorio para configurar perfil (nombre de visualización y foto avatar), selección obligatoria entre crear grupo o unirse por invitación, creación de grupo con moneda local y rol admin automático, y gestión de integrantes con límite de 10 miembros, roles admin/member, invitaciones y permisos restringidos al administrador.

## Technical Context

**Language/Version**: Python 3.11 (Backend FastAPI), TypeScript (Next.js Web, React Native/Expo Móvil)  
**Primary Dependencies**: FastAPI, SQLAlchemy, Pydantic, Next.js, React Native, Expo, Google Sign-In SDKs, python-jose/PyJWT  
**Storage**: PostgreSQL (relacional, ACID). Uso de DECIMAL para montos conforme a constitución  
**Testing**: pytest (backend), Jest/Testing Library (web), Jest/React Native Testing Library (móvil)  
**Target Platform**: Web (Next.js) + Móvil (Android/iOS via Expo) + API REST (FastAPI)  
**Project Type**: Web application + Mobile application (frontend-web, frontend-mobile) + API (backend)  
**Performance Goals**: Autenticación < 10s (SC-001), respuestas API < 200ms p95 (objetivo razonable)  
**Constraints**: Límite 10 miembros por grupo, moneda única por grupo, transacciones mensuales solo lectura tras cierre, aislación por grupo y autorización por rol en backend  
**Scale/Scope**: Núcleo familiar (máx 10 usuarios), funcionalidad acotada a auth/grupos conforme a No-Objetivos  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution compliance review:**
- [x] Stack matches constitution (Next.js TS, RN/Expo TS, FastAPI, PostgreSQL, SQLAlchemy, Docker) - conforme a Principio II
- [x] Scope within stated objectives (auth + family groups) - no banking/notifications/payments/reports PDF per Principio IV
- [x] Domain rules respected (roles admin/member, moneda única, DECIMAL precision implied) - Principio III
- [x] Backend is authority for validation/authorization - Principio V
- [x] Errors use HTTP semantics - Principio V
- [x] Docker Compose for services - Principio II/V
- [x] No shadow code; follows spec - Principio VI

No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-family-groups/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/           # Routers (auth, users, families, invitations)
│   ├── core/          # Config, security (JWT), deps
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── db/            # Session, base
├── alembic/           # Migrations
└── tests/

frontend-web/
├── app/               # Next.js App Router
├── components/
├── lib/               # Auth, API clients
└── hooks/

frontend-mobile/
├── app/               # Expo Router
├── components/
├── lib/
└── hooks/

docker-compose.yml
```

**Structure Decision**: Multi-project structure per constitution (backend, frontend-web, frontend-mobile). Matches modular/containerized setup. 

## Complexity Tracking

*No violations - tracking not needed.*
