# Tasks: Autenticación, Registro y Gestión de Grupos Familiares

**Input**: Design documents from `/specs/001-autenticacion-y-grupos/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`
- **Frontend Web**: `frontend-web/app/`, `frontend-web/components/`
- **Frontend Mobile**: `frontend-mobile/app/`, `frontend-mobile/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per constitution

- [x] T001 Create project structure per implementation plan (backend/, frontend-web/, frontend-mobile/, docker-compose.yml)
- [x] T002 Initialize backend with FastAPI dependencies (pyproject.toml/requirements.txt) in backend/
- [x] T003 [P] Initialize frontend-web with Next.js + TypeScript in frontend-web/
- [x] T004 [P] Initialize frontend-mobile with Expo + React Native + TypeScript in frontend-mobile/
- [x] T005 [P] Configure linting/formatting tools (black/ruff for backend, eslint/prettier for frontends)
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
- [ ] T031 [US2] Create profile setup form/page in frontend-web/app/profile/setup/
- [ ] T032 [US2] Create profile setup screen in frontend-mobile/app/profile/setup/

**Checkpoint**: User Story 2 functional - profile setup enforced

---

## Phase 5: User Story 3 - Selección de grupo familiar (Priority: P3)

**Goal**: Usuario autenticado sin grupo debe elegir obligatoriamente crear grupo o unirse por enlace.

**Independent Test**: Usuario sin family_id/rol -> redirigido a opciones crear/unirse; debe seleccionar una.

### Frontend for User Story 3
- [ ] T033 [US3] Create group selection screen/page (create or join) in frontend-web/app/family/select/
- [ ] T034 [US3] Create group selection screen in frontend-mobile/app/family/select/
- [ ] T035 [US3] Add route guards/redirect logic based on JWT claims (needs_profile_setup, needs_family_setup) in frontends

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
- [ ] T044 [US4] Create group creation form in frontend-web/app/family/create/
- [ ] T045 [US4] Create group creation screen in frontend-mobile/app/family/create/

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
- [ ] T056 [US5] Create invite generation UI (admin only) in frontend-web/app/family/members/
- [ ] T057 [US5] Create invite join flow in frontend-web/app/invite/
- [ ] T058 [US5] Create member management UI (promote/expel) in frontend-web/app/family/members/
- [ ] T059 [US5] Create invite screens in frontend-mobile/app/family/ and frontend-mobile/app/invite/

**Checkpoint**: All user stories functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, security, validation

- [x] T060 [P] Add role-based authorization checks across protected endpoints (ensure admin/member enforced)
- [x] T061 [P] Add validation for "no second group" and member limit (10) in all relevant services
- [x] T062 [P] Ensure JWT claims include user_id, family_id, role; update tokens on profile/family changes
- [x] T063 [P] Add proper HTTP error codes (400, 401, 403) per contracts
- [x] T064 [P] Add input validation with Pydantic schemas
- [x] T065 [P] Security hardening (token expiry, secure token generation for invitations)
- [ ] T066 Run quickstart.md validation scenarios
- [ ] T067 [P] Update documentation/README with setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational
  - US1 (P1) can start first
  - US2 depends on US1 (needs authenticated user)
  - US3 is UI flow (depends on US1/US2 context)
  - US4 depends on US2/US3 (needs user in setup flow)
  - US5 depends on US4 (needs existing family)
- **Polish (Phase 8)**: Depends on all desired user stories

### Within Each User Story

- Models before migrations/services
- Services before endpoints
- Backend before frontend integration
- Core implementation before UI

### Parallel Opportunities

- Setup tasks T003,T004,T005 can run in parallel
- Foundational tasks T010,T011,T012,T013 can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on by different team members once dependencies met

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup + Foundational
2. Complete Phase 3 (US1): Google auth + JWT
3. Test independently and demo

### Incremental Delivery
1. Setup + Foundational → Foundation ready
2. Add US1 → Auth working (MVP)
3. Add US2 → Profile setup
4. Add US3+US4 → Group creation
5. Add US5 → Full group management

### Notes
- [P] = parallelizable tasks
- [USx] = maps to user story from spec
- All file paths are explicit per plan structure
- Follow constitution: FastAPI validates, Docker Compose for services, no scope creep
