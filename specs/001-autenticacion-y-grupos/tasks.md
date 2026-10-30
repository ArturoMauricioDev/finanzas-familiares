# Tasks: Autenticación, Registro y Gestión de Grupos Familiares

**Input**: Design documents from `/specs/001-autenticacion-y-grupos/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No new test tasks are generated because the specification does not explicitly request TDD. Existing test tasks T079-T080 were retained from the prior convergence pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`, `backend/alembic/`
- **Frontend Web**: `frontend-web/app/`, `frontend-web/components/`, `frontend-web/lib/`, `frontend-web/hooks/`
- **Frontend Mobile**: `frontend-mobile/app/`, `frontend-mobile/components/`, `frontend-mobile/lib/`, `frontend-mobile/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per constitution

- [x] T001 Create project structure per implementation plan (backend/, frontend-web/, frontend-mobile/, docker-compose.yml)
- [x] T002 Initialize backend with FastAPI dependencies (pyproject.toml/requirements.txt) in backend/
- [x] T003 [P] Initialize frontend-web with Next.js + TypeScript in frontend-web/
- [x] T004 [P] Initialize frontend-mobile with Expo + React Native + TypeScript in frontend-mobile/
- [x] T005 [P] Configure linting/formatting tools in `backend/`, `frontend-web/`, and `frontend-mobile/` (ruff/black, eslint/prettier)
- [x] T006 Create docker-compose.yml with backend, postgres services
- [x] T007 Setup environment configuration (.env.example) for all services

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Setup PostgreSQL connection and SQLAlchemy base in backend/app/db/
- [x] T009 Configure Alembic migrations framework in backend/alembic/
- [x] T010 [P] Implement core config (settings) in backend/app/core/config.py
- [x] T011 [P] Implement security utilities for JWT (create/verify tokens) in backend/app/core/security.py
- [x] T012 [P] Setup API routing structure with /api/v1 prefix in backend/app/api/
- [x] T013 [P] Implement error handling and HTTP exception handlers in backend/app/core/errors.py
- [x] T014 Create base dependencies (get_db, get_current_user) in backend/app/core/deps.py
- [x] T015 Setup CORS and middleware configuration in backend/app/main.py

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Inicio de sesión/registro con Google (Priority: P1) 🎯 MVP

**Goal**: Autenticación exclusiva con Google Sign-In, validación de token en backend, emisión de JWT propio con claims (user_id, family_id, role). Crear cuenta si es primer ingreso.

**Independent Test**: Iniciar sesión con cuenta Google válida -> obtener JWT propio con claims; usuario nuevo -> crear cuenta.

### Models for User Story 1
- [x] T016 [P] [US1] Create User model (id, google_id, email, nombre_visualizacion, foto_avatar, fecha_creacion) in backend/app/models/user.py
- [x] T017 [P] [US1] Create base model/mixins if needed in backend/app/models/base.py

### Migrations for User Story 1
- [x] T018 [US1] Generate Alembic migration for User model in backend/alembic/versions/

### Schemas for User Story 1
- [x] T019 [P] [US1] Create auth schemas (GoogleTokenRequest, TokenResponse, UserResponse) in backend/app/schemas/auth.py
- [x] T020 [P] [US1] Create user schemas in backend/app/schemas/user.py

### Services for User Story 1
- [x] T021 [US1] Implement Google token verification service in backend/app/services/auth_service.py
- [x] T022 [US1] Implement user creation/retrieval logic in backend/app/services/user_service.py

### API Endpoints for User Story 1
- [x] T023 [US1] Implement POST /auth/google endpoint in backend/app/api/v1/auth.py
- [x] T024 [US1] Implement POST /auth/refresh endpoint in backend/app/api/v1/auth.py

### Frontend for User Story 1
- [x] T025 [P] [US1] Setup Google Sign-In client config in frontend-web/lib/auth.ts
- [x] T026 [P] [US1] Setup Google Sign-In client config in frontend-mobile/lib/auth.ts
- [x] T027 [US1] Create auth pages/screens for Google login in frontend-web/app/auth/ and frontend-mobile/app/auth/

**Checkpoint**: User Story 1 functional - Google auth + JWT issuance working

---

## Phase 4: User Story 2 - Configuración inicial de perfil (Priority: P2)

**Goal**: Solicitar obligatoriamente nombre de visualización y foto avatar al primer ingreso; guardar y redirigir a selección de grupo.

**Independent Test**: Usuario nuevo tras login Google -> forzado a configurar perfil -> guardar -> redirigir a flujo de grupo.

### Schemas for User Story 2
- [x] T028 [P] [US2] Create profile update schema in backend/app/schemas/user.py

### Services for User Story 2
- [x] T029 [US2] Implement profile setup service logic in backend/app/services/user_service.py

### API Endpoints for User Story 2
- [x] T030 [US2] Implement PUT /users/me/profile endpoint in backend/app/api/v1/users.py

### Frontend for User Story 2
- [x] T031 [US2] Create profile setup form/page in frontend-web/app/profile/setup/
- [x] T032 [US2] Create profile setup screen in frontend-mobile/app/profile/setup/

**Checkpoint**: User Story 2 functional - profile setup enforced

---

## Phase 5: User Story 3 - Selección de grupo familiar (Priority: P3)

**Goal**: Usuario autenticado sin grupo debe elegir obligatoriamente crear grupo o unirse por enlace.

**Independent Test**: Usuario sin family_id/rol -> redirigido a opciones crear/unirse; debe seleccionar una.

### Frontend for User Story 3
- [x] T033 [US3] Create group selection screen/page (create or join) in frontend-web/app/family/select/
- [x] T034 [US3] Create group selection screen in frontend-mobile/app/family/select/
- [x] T035 [US3] Add route guards/redirect logic based on JWT claims (needs_profile_setup, needs_family_setup) in `frontend-web/hooks/` and `frontend-mobile/hooks/`

**Checkpoint**: User Story 3 functional - forced group selection

---

## Phase 6: User Story 4 - Creación de grupo familiar (Priority: P4)

**Goal**: Crear grupo con nombre y moneda local; creador se convierte automáticamente en admin. Rechazar si ya tiene grupo.

**Independent Test**: Usuario sin grupo crea grupo -> family creada, membership admin, tokens actualizados con family_id/role. Intento de crear segundo grupo -> 400.

### Models for User Story 4
- [x] T036 [P] [US4] Create Family model (id, nombre, moneda_local, creado_por, fecha_creacion) in backend/app/models/family.py
- [x] T037 [P] [US4] Create Membership model (id, user_id, family_id, role, parentesco, estado, fecha_union) in backend/app/models/membership.py

### Migrations for User Story 4
- [x] T038 [US4] Generate Alembic migration for Family and Membership models in backend/alembic/versions/

### Schemas for User Story 4
- [x] T039 [P] [US4] Create family schemas (CreateFamilyRequest, FamilyResponse) in backend/app/schemas/family.py
- [x] T040 [P] [US4] Create membership schemas in backend/app/schemas/membership.py

### Services for User Story 4
- [x] T041 [US4] Implement family creation service (validate no existing active membership, create family+membership admin) in backend/app/services/family_service.py

### API Endpoints for User Story 4
- [x] T042 [US4] Implement POST /families endpoint in backend/app/api/v1/families.py
- [x] T043 [US4] Implement GET /families/me endpoint in backend/app/api/v1/families.py

### Frontend for User Story 4
- [x] T044 [US4] Create group creation form in frontend-web/app/family/create/
- [x] T045 [US4] Create group creation screen in frontend-mobile/app/family/create/

**Checkpoint**: User Story 4 functional - group creation with admin role

---

## Phase 7: User Story 5 - Gestión de integrantes del grupo (Priority: P5)

**Goal**: Admin puede generar invitación, gestionar miembros (promover a admin, expulsar), límite 10 miembros. Miembro por defecto al unirse con opción de parentesco.

**Independent Test**: Admin genera invitación -> otro usuario se une con role member; al llegar a 10 miembros, siguiente unión rechazada con 400; solo admin puede promover/expulsar/generar invitación.

### Models for User Story 5
- [x] T046 [P] [US5] Create Invitation model (id, family_id, token, generado_por, fecha_creacion, expira_en, usado) in backend/app/models/invitation.py

### Migrations for User Story 5
- [x] T047 [US5] Generate Alembic migration for Invitation model in backend/alembic/versions/

### Schemas for User Story 5
- [x] T048 [P] [US5] Create invitation schemas in backend/app/schemas/invitation.py

### Services for User Story 5
- [x] T049 [US5] Implement invitation generation service (admin only, token generation) in backend/app/services/invitation_service.py
- [x] T050 [US5] Implement join via invitation service (validate token, check member count < 10, create membership member, mark token used) in backend/app/services/invitation_service.py
- [x] T051 [US5] Implement member management service (promote to admin, deactivate membership - admin only) in backend/app/services/family_service.py

### API Endpoints for User Story 5
- [x] T052 [US5] Implement POST /families/me/invitations (admin only) in backend/app/api/v1/invitations.py
- [x] T053 [US5] Implement POST /invitations/join in backend/app/api/v1/invitations.py
- [x] T054 [US5] Implement POST /families/me/members/:user_id/promote (admin only) in backend/app/api/v1/families.py
- [x] T055 [US5] Implement DELETE /families/me/members/:user_id (admin only) in backend/app/api/v1/families.py

### Frontend for User Story 5
- [x] T056 [US5] Create invite generation UI (admin only) in frontend-web/app/family/members/
- [x] T057 [US5] Create invite join flow in frontend-web/app/invite/
- [x] T058 [US5] Create member management UI (promote/expel) in frontend-web/app/family/members/
- [x] T059 [US5] Create invite screens in frontend-mobile/app/family/ and frontend-mobile/app/invite/

**Checkpoint**: All user stories functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, security, validation

- [x] T060 [P] Add role-based authorization checks in `backend/app/services/` across protected endpoints (ensure admin/member enforced)
- [x] T061 [P] Add validation for "no second group" and member limit (10) in `backend/app/services/family_service.py` and `backend/app/services/invitation_service.py`
- [x] T062 [P] Ensure JWT claims include user_id, family_id, role and refresh tokens on profile/family changes in `backend/app/core/security.py`, `backend/app/services/auth_service.py`, and `backend/app/services/family_service.py`
- [x] T063 [P] Add proper HTTP error codes (400, 401, 403) in `backend/app/api/v1/` per contracts
- [x] T064 [P] Add input validation with Pydantic schemas in `backend/app/schemas/`
- [x] T065 [P] Security hardening (token expiry, secure token generation for invitations) in `backend/app/core/security.py` and `backend/app/services/invitation_service.py`
- [x] T066 Run quickstart.md validation scenarios
- [x] T067 [P] Update documentation/README with setup instructions

---

## Phase 9: Convergence

**Purpose**: Close remaining gaps between spec/plan/tasks and the current implementation (appended by `/speckit.converge`).

- [x] T068 CRITICAL: Remove the unverified JWT fallback in `backend/app/services/auth_service.py` and reject any Google ID token failing signature/audience/issuer/expiry checks with 401 per FR-001, Edge Case "Token de Google inválido", and Constitution V (contradicts)
- [x] T069 Implement functional Google Sign-In in `frontend-mobile/app/auth/login.tsx` using the configured Expo Google client IDs, exchange the ID token via `POST /api/v1/auth/google`, and persist the returned tokens per FR-001 and US1/AC1 (missing)
- [x] T070 Build the mandatory profile setup screens in `frontend-web/app/profile/setup/` and `frontend-mobile/app/profile/setup/`, redirecting first-login users there, per FR-003 and US2/AC1-2 (missing)
- [x] T071 Build the group selection screens in `frontend-web/app/family/select/` and `frontend-mobile/app/family/select/` plus route guards that force create/join when no active family and survive reloads, per FR-004, US3/AC1-2, and SC-006 (missing)
- [x] T072 Build the group creation forms in `frontend-web/app/family/create/` and `frontend-mobile/app/family/create/`, persisting the refreshed tokens with family/role claims, per FR-005 and US4/AC1 (missing)
- [x] T073 Build the web invitation generation and join flow in `frontend-web/app/family/members/` and `frontend-web/app/invite/`, per FR-006, FR-009, and US5/AC1-2 (missing)
- [x] T074 Build the web member management UI (list, promote, expel) in `frontend-web/app/family/members/`, admin-only, per FR-010 and US5/AC4 (missing)
- [x] T075 Build the mobile invitation generation, join, and member management screens under `frontend-mobile/app/family/` and `frontend-mobile/app/invite/`, per FR-006, FR-009, FR-010, and US5 (missing)
- [x] T076 Make family creation atomic in `backend/app/services/family_service.py` by committing the Family and admin Membership in one transaction with rollback on failure per data-model and Constitution Restricciones Adicionales (ACID) (partial)
- [x] T077 Prevent an admin from expelling themselves or removing the last active admin in `backend/app/services/family_service.py` per FR-010 and `contracts/openapi.yaml` DELETE /families/me/members/:user_id (contradicts)
- [x] T078 Add schema validation for ISO 4217 `moneda_local`, non-empty profile fields, and invitation expiry bounds in `backend/app/schemas/` per FR-005, FR-003, and contracts (partial)
- [x] T079 Add pytest coverage in `backend/tests/` for the quickstart scenarios and SC-002 through SC-005 (401/403/400, 10-member limit, second-group rejection) per plan "Testing" and T066 (missing)
- [x] T080 Add Jest/React Native Testing Library coverage for the web and mobile auth, profile, family, and invitation flows per plan "Testing" and T066 (missing)
- [x] T081 Register the handlers from `backend/app/core/errors.py` in `backend/app/main.py` and map API errors to user-facing messages in both frontends per Constitution V and T013 (partial)
- [x] T082 Replace hardcoded `http://localhost:8000` with `NEXT_PUBLIC_API_URL`/`EXPO_PUBLIC_API_URL` and use the correct mobile Google client-ID variables in `frontend-web/lib/auth.ts` and `frontend-mobile/lib/auth.ts` per plan and T025-T026 (partial)
- [x] T083 Add the missing lint/format configuration (ruff/black for `backend/`, eslint/prettier for both frontends) per T005 (missing)
- [x] T084 Add a `README.md` with Docker Compose, Alembic, Google OAuth, and environment setup instructions per T067 (missing)
- [x] T085 Restrict CORS origins in `backend/app/main.py` and make the invitation link base URL configurable in `backend/app/services/invitation_service.py` per Constitution V and T065 (partial)

---

## Phase 10: Plan Alignment & Hardening

**Purpose**: Tasks derived from the refreshed `plan.md`, `data-model.md`, and `contracts/` that were not represented in the original task list.

- [x] T086 Add an Alembic migration creating `UNIQUE (user_id) WHERE estado = 'activo'` on `memberships` plus indexes on `memberships(family_id, estado)`, `memberships(user_id, estado)`, and `invitations(family_id, usado)` in `backend/alembic/versions/` per data-model.md constraints (missing)
- [x] T087 Lock the `families` row during `POST /invitations/join` before counting active members in `backend/app/services/invitation_service.py` to prevent concurrent joins exceeding 10 per data-model.md concurrency notes (missing)
- [x] T088 [P] Create shared API client modules in `frontend-web/lib/api.ts` and `frontend-mobile/lib/api.ts` covering auth, profile, families, and invitations with the configured base URL per plan.md project structure (missing)
- [x] T089 [P] Add the mobile Google Sign-In SDK dependency and Expo configuration in `frontend-mobile/package.json` and `frontend-mobile/app.json` for Android/iOS per FR-001 and T069 (missing)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational
  - US1 (P1) can start first
  - US2 depends on US1 (needs authenticated user)
  - US3 is UI flow (depends on US1/US2 context)
  - US4 depends on US2/US3 (needs user in setup flow)
  - US5 depends on US4 (needs existing family)
- **Polish (Phase 8)**: Depends on all desired user stories
- **Convergence (Phase 9)**: Depends on implemented user stories; T068 is a security gate that should be completed before any deployment
- **Plan Alignment (Phase 10)**: Depends on the affected user stories and Phase 9 hardening tasks

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 for an authenticated session
- **User Story 3 (P3)**: Depends on US1/US2 context; independently testable with a user whose profile is complete
- **User Story 4 (P4)**: Depends on US3 selection flow; backend creation can be tested independently
- **User Story 5 (P5)**: Depends on US4 for an existing family; backend invitation/member endpoints can be tested independently

### Dependency Graph

```text
Phase 1 Setup
      |
Phase 2 Foundational
      |
      +-------------------+-------------------+-------------------+
      |                   |                   |                   |
     US1                 US2                 US3                 US4
   (auth)           (profile setup)     (group select)      (group create)
      |                   |                   |                   |
      +-------------------+-------------------+-------------------+
                                      |
                                     US5
                             (members & invitations)
                                      |
                              Phase 8 Polish
                                      |
                              Phase 9 Convergence
                                      |
                           Phase 10 Plan Alignment
```

### Within Each User Story

- Models before migrations/services
- Services before endpoints
- Backend before frontend integration
- Core implementation before UI
- Security/validation tasks before exposing a story to users

### Parallel Opportunities

- Setup tasks T003, T004, T005 can run in parallel
- Foundational tasks T010, T011, T012, T013 can run in parallel
- Models within a story marked [P] can run in parallel
- Frontend web and mobile tasks for the same story can run in parallel once the API contract is stable
- T088 and T089 can run in parallel with UI implementation after the API contract is stable
- Different user stories can be worked on by different team members once dependencies are met

---

## Parallel Examples

### User Story 1 (Auth)

```bash
# Backend auth pieces
Task: "T019 [P] [US1] Create auth schemas in backend/app/schemas/auth.py"
Task: "T020 [P] [US1] Create user schemas in backend/app/schemas/user.py"

# Frontend clients in parallel
Task: "T025 [P] [US1] Setup Google Sign-In client config in frontend-web/lib/auth.ts"
Task: "T026 [P] [US1] Setup Google Sign-In client config in frontend-mobile/lib/auth.ts"
Task: "T068 Fix backend Google token verification in backend/app/services/auth_service.py"
Task: "T089 [P] Configure mobile Google Sign-In SDK in frontend-mobile/"
```

### User Story 2 (Profile)

```bash
Task: "T031 [US2] Create profile setup form/page in frontend-web/app/profile/setup/"
Task: "T032 [US2] Create profile setup screen in frontend-mobile/app/profile/setup/"
```

### User Story 3 (Group Selection)

```bash
Task: "T033 [US3] Create group selection screen/page in frontend-web/app/family/select/"
Task: "T034 [US3] Create group selection screen in frontend-mobile/app/family/select/"
Task: "T035 [US3] Add route guards in frontend-web/hooks/ and frontend-mobile/hooks/"
```

### User Story 4 (Group Creation)

```bash
Task: "T044 [US4] Create group creation form in frontend-web/app/family/create/"
Task: "T045 [US4] Create group creation screen in frontend-mobile/app/family/create/"
Task: "T072 [US4] Wire group creation forms to POST /families"
```

### User Story 5 (Members & Invitations)

```bash
Task: "T056 [US5] Create invite generation UI in frontend-web/app/family/members/"
Task: "T057 [US5] Create invite join flow in frontend-web/app/invite/"
Task: "T058 [US5] Create member management UI in frontend-web/app/family/members/"
Task: "T059 [US5] Create invite screens in frontend-mobile/app/family/ and frontend-mobile/app/invite/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup + Foundational
2. Complete Phase 3 (US1): Google auth + JWT
3. Complete T068 (strict token verification) before demoing
4. Test independently and demo

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add US1 -> Auth working (MVP)
3. Add US2 -> Profile setup
4. Add US3 + US4 -> Forced group selection and creation
5. Add US5 -> Full group management
6. Complete Phase 9 and Phase 10 -> Hardened, converged implementation

### Notes

- [P] = parallelizable tasks
- [USx] = maps to user story from spec
- All file paths are explicit per plan structure
- Follow constitution: FastAPI validates, Docker Compose for services, no scope creep
- T068 is a release blocker: do not deploy while the unverified token fallback exists

---

## Phase 11: Convergence

**Purpose**: Close remaining gaps between the specification/plan and the current implementation (appended by `/speckit.converge`).

- [x] T090 Fix invitation expiry handling to use timezone-aware UTC datetimes for creation and comparison (normalizing naive values) so `POST /invitations/join` rejects expired tokens with 400 instead of 500 on PostgreSQL, and add a PostgreSQL-backed regression test per FR-006, US5/AC2-AC3, data-model `expira_en`, and quickstart Escenario 2 (contradicts)
- [x] T091 Add Jest + React Testing Library flow tests for web auth, profile setup, family selection/creation, invitation join, and member management, plus Jest + React Native Testing Library flow tests for the equivalent mobile screens per T080 and plan "Testing" (partial)
- [x] T092 Add a shared Spanish user-facing error mapping for 400/401/403/404/422 responses and use it in both frontends instead of surfacing raw backend details, with tests per T081 and Constitution V (partial)
- [x] T093 Add backend pytest cases proving members are denied promote and expel actions and that the last active admin cannot be removed per T079 and SC-005 (partial)
- [x] T094 Remove or document the unused root Playwright dependency and lockfile (`package.json`, `package-lock.json`) so tooling stays within the specified project scope per Constitution I (unrequested)
