---

description: "Task list — Ciclo de vida de la familia (B2 ampliado + entrada protegida)"
---

# Tasks: Ciclo de vida de la familia (Día 1)

**Input**: Diseño en `/specs/003-ux-audit/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api-invitations.md](./contracts/api-invitations.md),
[quickstart.md](./quickstart.md), [ux-checklist.md](./ux-checklist.md)

**Tests**: se incluyen tareas de prueba porque la Definición de Hecho de UI
(`docs/ux-playbook.md` §10) exige `typecheck`, `lint` y tests en verde con `jest-axe` sin
violaciones. No se adopta TDD estricto.

**Organización**: por historia de usuario. El baseline B1 + B2 (rol viaja en la invitación, contrato
de unión sin rol) ya está implementado y se marca `[X]`; el trabajo nuevo es el **B2 ampliado**:
catálogo de roles `tío/abuelo/otro`, vínculo familiar condicional y copys cálidos.

## Format: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencia de una tarea incompleta)
- **[Story]**: US1, US2, US3, US4; las fases de setup, base y pulido no llevan etiqueta
- Toda tarea incluye la ruta exacta del archivo que toca

## Path Conventions

Monorepo: `backend/`, `frontend-web/`, `frontend-mobile/`, `shared/`, `specs/003-ux-audit/`.

---

## Phase 1: Setup

**Propósito**: confirmar la línea base antes de tocar el contrato.

- [X] T001 Ejecutar la línea base completa (`docker compose exec backend pytest -q`; en
      `frontend-web/` y `frontend-mobile/`: `pnpm run typecheck && pnpm run lint && pnpm test`;
      `node scripts/check-ui.mjs`, `node scripts/check-shared.mjs`, `node scripts/check-contrast.mjs`)
      y anotar el resultado en `specs/003-ux-audit/audit.md` §8.

---

## Phase 2: Foundational (bloquea US2 y US3)

**Propósito**: ampliar el catálogo de roles, la migración del enum y la validación condicional del
vínculo. Sin esta fase, ni invitar con tío/abuelo/otro ni validar el vínculo pueden funcionar.

**⚠️ CRÍTICO**: US2 y US3 nuevas no empiezan hasta completar T007–T011.

- [X] T002 Añadir a `backend/app/models/invitation.py` las columnas nullable `rol_familiar`
      (Enum) y `parentesco` (`String(80)`), sin índices nuevos ni backfill.
- [X] T003 Crear la revisión `backend/alembic/versions/005_invitation_family_role.py`
      (`revision="005"`, `down_revision="004"`) que añade ambas columnas nullable.
- [X] T004 Ajustar `backend/app/schemas/invitation.py`: `CreateInvitationRequest.rol_familiar`
      obligatorio; `JoinInvitationRequest` deja solo `codigo` (1–32) o `token`; las respuestas
      exponen `rol_familiar` y `parentesco`.
- [X] T005 Implementar en `backend/app/services/invitation_service.py`: `create_invitation` guarda
      rol y parentesco; `join_invitation` toma el rol de la invitación y deriva `admin` para
      `padre|madre`, `member` para el resto y para `null`.
- [X] T006 Actualizar `frontend-web/lib/types.ts` y `frontend-mobile/lib/types.ts` con
      `rol_familiar` y `parentesco` en `Invitation` y `JoinInvitationResponse`.
- [X] T007 [P] Ampliar `FamilyRoleEnum` en `backend/app/models/membership.py` con los valores
      `tio`, `abuelo` y `otro` (además de `padre|madre|hijo|hija`).
- [X] T008 [P] Crear `backend/alembic/versions/006_family_role_extra_values.py`
      (`revision="006"`, `down_revision="005"`) con `ALTER TYPE familyroleenum ADD VALUE IF NOT
      EXISTS 'tio'`, `'abuelo'`, `'otro'`; `downgrade()` documenta que PostgreSQL no elimina valores
      de enum de forma limpia y no los borra.
- [X] T009 [P] Ampliar el tipo `FamilyRole` en `frontend-web/lib/types.ts` y
      `frontend-mobile/lib/types.ts` con `"tio" | "abuelo" | "otro"`, manteniendo ambos archivos
      idénticos.
- [X] T010 Añadir `model_validator` en `CreateInvitationRequest`
      (`backend/app/schemas/invitation.py`): `parentesco` obligatorio y no vacío (1–80) si y solo si
      `rol_familiar == otro`; con cualquier otro rol, presente → `422`.
- [X] T011 Ajustar `backend/app/services/invitation_service.py`: `create_invitation` persiste
      `parentesco` solo cuando el rol es `otro` (si no, lo fuerza a nulo); confirmar que
      `join_invitation` mapea `tio|abuelo|otro` y `null` a `member`.

**Checkpoint**: migración `006` reversible en `upgrade`, backend compila, rol y vínculo validados en
el backend.

---

## Phase 3: User Story 1 — Entrar y entender para qué sirve Kitho (Priority: P1)

**Goal**: la entrada explica qué es Kitho hoy, qué viene después y qué pasa con los datos, con una
sola acción de acceso (B1, regresión).

**Independent Test**: una persona que solo ve `frontend-web/app/(auth)/auth/login/page.tsx` puede
decir en una frase qué hace Kitho y qué no hace todavía.

- [X] T012 [P] [US1] Afirmar en `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/login.test.tsx` la promesa, las finanzas "en camino" y una sola
      acción primaria (FR-001, FR-002, SC-005, SC-009).
- [X] T013 [US1] Revisar el login web y móvil contra FR-002 (qué ocurre con los datos) con copy
      es/en en `shared/i18n/{es,en}.json`.

**Checkpoint**: US1 verificada; sin cambios de comportamiento en esta ampliación.

---

## Phase 4: User Story 2 — Crear la familia o unirse con un código (Priority: P1)

**Goal**: quien no tiene familia ve jerarquía contextual (con código → unirme; sin código → crear) y
quien se une envía solo el código y recibe el rol de la invitación, incluidos tío/abuelo/otro como
miembros.

**Independent Test**: con un código generado con rol `madre` la segunda cuenta entra como
administrador; con rol `tio|abuelo|otro` entra como miembro; el payload de unión es `{ codigo }`.

- [X] T014 [P] [US2] Hacer contextual `frontend-web/app/(onboarding)/family/select/page.tsx`
      leyendo `getPendingInviteCode()` de `frontend-web/lib/session.ts` (FR-029, FR-030).
- [X] T015 [P] [US2] Replicar la jerarquía contextual en
      `frontend-mobile/app/(onboarding)/family/select.tsx` (FR-029, FR-030).
- [X] T016 [US2] Ajustar `frontend-web/lib/api.ts` y `frontend-mobile/lib/api.ts` para que la unión
      envíe solo `codigo` o `token` (sin `rol_familiar` ni `parentesco`).
- [X] T017 [US2] Ampliar `backend/tests/test_invitations.py`: invitaciones con `tio`, `abuelo`
      y `otro` producen membresía `member`; `padre|madre` producen `admin`; un rol en el cuerpo de
      unión se ignora; `null` heredado → `member`.
- [X] T018 [P] [US2] Actualizar `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx`: la unión envía `{ codigo }`, con código pendiente
      la primaria es "unirme" y sin código es "crear" (FR-029, FR-030, SC-011).

**Checkpoint**: unirse aplica el rol de la invitación para los siete valores; la elección es
contextual.

---

## Phase 5: User Story 3 — Invitar declarando el rol de la persona invitada (Priority: P1)

**Goal**: quien administra elige `padre`, `madre`, `hijo`, `hija`, `tío`, `abuelo` u `otro`; el campo
**Vínculo familiar** aparece y se exige solo con **Otro**; los copys son cálidos.

**Independent Test**: generar un código con cada rol y verificar en la respuesta y en la lista de
miembros el permiso resultante; con **Otro** el vínculo es obligatorio y con el resto el campo no se
muestra.

- [X] T019 [US3] Selector de rol base (padre/madre/hijo/hija) con default `hijo`, `InviteCode` que
      muestra el rol y la caducidad, y tipos `createInvitation` en
      `frontend-web/app/(app)/family/members/page.tsx`,
      `frontend-mobile/app/(app)/(tabs)/family/members.tsx`,
      `frontend-web/components/family/InviteCode.tsx`,
      `frontend-mobile/components/family/InviteCode.tsx`, `frontend-web/lib/api.ts` y
      `frontend-mobile/lib/api.ts`.
- [X] T020 [US3] En `frontend-web/app/(app)/family/members/page.tsx` ampliar las opciones a los
      siete roles y mostrar el `TextField` de vínculo **solo** cuando `inviteRole === "otro"`,
      obligatorio (error local `family.inviteKinshipRequired`), con `aria-required`; al cambiar a
      otro rol, ocultarlo, limpiar el valor y no enviar `parentesco` (FR-031).
- [X] T021 [US3] Replicar en `frontend-mobile/app/(app)/(tabs)/family/members.tsx` las mismas siete
      opciones y el campo condicional, con `accessibilityState`/`accessibilityLabel` y sin enviar
      `parentesco` salvo en **Otro** (FR-031).
- [X] T022 [P] [US3] Añadir/ajustar en `shared/i18n/es.json` y `shared/i18n/en.json`:
      `family.familyRoleTio|Abuelo|Otro`, `family.inviteKinshipLabel` ("Vínculo familiar", sin
      "(opcional)"), `family.inviteKinshipHint`, `family.inviteKinshipRequired`,
      `family.createFamily` ("Crear familia" / "Create family") y `dashboard.checkInvite`
      ("Agregar integrantes a tu familia" / "Add members to your family"); regenerar con
      `node scripts/generate-shared.mjs`.
- [X] T023 [P] [US3] Cambiar el botón de creación a **Crear familia** en
      `frontend-web/app/(onboarding)/family/create/page.tsx` y
      `frontend-mobile/app/(onboarding)/family/create.tsx` (FR-032).
- [X] T024 [P] [US3] Cambiar la invitación de Home a **Agregar integrantes a tu familia** en
      `frontend-web/app/(app)/page.tsx` y `frontend-mobile/app/(app)/(tabs)/index.tsx` (FR-033).
- [X] T025 [US3] Mostrar el rol de la invitación (incluidos Tío/Abuelo/Otro) en
      `frontend-web/components/family/InviteCode.tsx` y
      `frontend-mobile/components/family/InviteCode.tsx` con `family.invitationFor` (FR-025,
      FR-027).
- [X] T026 [US3] Ampliar `backend/tests/test_invitations.py`: crear con `rol_familiar` inválido →
      `422`; `otro` sin `parentesco` → `422`; `hijo` con `parentesco` → `422`; `201` devuelve
      `rol_familiar` y `parentesco` (nulo salvo en **Otro**); no administrador → `403`.
- [X] T027 [P] [US3] Ampliar las pruebas de flujo en `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx`: el selector ofrece siete roles; el campo de
      vínculo aparece solo con **Otro**, es obligatorio y no se envía en el resto; los copys
      **Crear familia** y **Agregar integrantes a tu familia** aparecen; `jest-axe` sin violaciones
      en el estado con campo visible (FR-022, FR-023, SC-010).

**Checkpoint**: invitar con cualquier rol produce la membresía y el permiso esperados; el vínculo
solo existe con **Otro**; los copys cálidos están aplicados.

---

## Phase 6: User Story 4 — Volver a entrar cuando ya hay familia (Priority: P2)

**Goal**: quien ya tiene familia llega directo a Home y no vuelve a ver el ciclo de familia.

**Independent Test**: con una cuenta con familia, `/family/select` y `/invite` redirigen a Home;
Home muestra el estado y las finanzas "en camino".

- [X] T028 [P] [US4] Afirmar en `frontend-web/__tests__/useAuthGuard.test.tsx` y
      `frontend-mobile/__tests__/useAuthGuard.test.tsx` que con familia activa el ciclo redirige a
      `/` (FR-004).
- [X] T029 [US4] Verificar que `frontend-web/app/(app)/page.tsx` y
      `frontend-mobile/app/(app)/(tabs)/index.tsx` renderizan estado de familia y anuncian finanzas
      "en camino" (FR-020, SC-005).

**Checkpoint**: el regreso no paga onboarding otra vez.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Propósito**: puerta de calidad de la skill `kitho-ux` antes de cerrar el B2 ampliado.

- [X] T030 [P] Regenerar y verificar el sistema visual y el contraste:
      `node scripts/generate-shared.mjs`, `node scripts/check-shared.mjs`, `node scripts/check-ui.mjs`
      y `node scripts/check-contrast.mjs` (cero valores fuera de `design-tokens/tokens.json`,
      FR-019, FR-022, SC-010).
- [X] T031 Añadir/confirmar `jest-axe` de contraste, estado seleccionado y campo condicional en
      `frontend-web/__tests__/flows.test.tsx` (FR-022, FR-023, SC-010).
- [ ] T032 Verificar a 375, 768, 1024 y 1440 px (web) y en iOS/Android (móvil), con zoom 200%,
      texto grande y movimiento reducido; comprobar que no hay cards dentro de cards ni más de dos
      líneas por fila (FR-024, FR-028) y marcar el resultado en `specs/003-ux-audit/ux-checklist.md`
      (**requiere navegador/dispositivo**).
- [ ] T033 Ejecutar los escenarios 2b, 2c y 7 de `specs/003-ux-audit/quickstart.md` en español
      e inglés y anotar el resultado en `specs/003-ux-audit/audit.md` §8
      (**requiere cuentas Google reales**).
- [X] T034 [P] Revisar que no queden claves sin usar ni textos fuera de
      `specs/003-ux-audit/copy-deck-b.md` en `shared/i18n/{es,en}.json`; ajustar el copy deck con
      cualquier texto final (FR-017, SC-007).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: primero; fija la línea base.
- **Foundational (T007–T011)**: depende de T001 y bloquea US2 y US3 nuevas.
- **US1 (T012–T013)** y **US4 (T028–T029)**: regresión; pueden ir en paralelo.
- **US2 (T017–T018)** y **US3 (T020–T027)**: dependen de T007–T011; comparten archivos de tests de
  flujo, así que T018/T027 se serializan.
- **Polish (T030–T034)**: depende de US2 y US3 completas.
- **Entrada protegida (T037–T040)**: independiente del contrato de invitaciones; depende de B1 ya
  implementado (`useAuthGuard`, login) y comparte archivos de pruebas de guard y de flujo con
  US1/US4, así que se serializa con T012/T013 y T028.

### Within each story

- T007/T008/T009 en paralelo → T010 → T011 → clientes y UI.
- T022 (copy) antes de las pantallas que lo usan (T023, T024).
- Selector y campo condicional antes de las pruebas de flujo (T027).
- Backend en verde antes de validar la pantalla.

### User Story Dependencies

- **US1**: independiente; solo regresión.
- **US2**: depende de Foundational; se prueba con invitaciones de cada rol.
- **US3**: depende de Foundational; se prueba con la respuesta de creación y la pantalla de Miembros.
- **US4**: independiente; solo regresión.

### Parallel Opportunities

- T007, T008 y T009 tocan archivos distintos: en paralelo.
- T022 y T023/T024: copy primero; luego web y móvil en paralelo.
- T018 y T026/T027 comparten archivos de tests; no paralelizar entre sí.
- T030, T031 y T034 son independientes entre sí.

---

## Parallel Example: User Story 3

```bash
Task: "Ampliar opciones y campo condicional en frontend-web/app/(app)/family/members/page.tsx"
Task: "Ampliar opciones y campo condicional en frontend-mobile/app/(app)/(tabs)/family/members.tsx"
Task: "Añadir claves familyRoleTio/Abuelo/Otro y copy en shared/i18n/{es,en}.json"
```

---

## Implementation Strategy

### MVP de este corte

El baseline B1+B2 ya está desplegado, así que el incremento mínimo con valor es el **B2 ampliado**:
Foundational (T007–T011) + US3 (T020–T027) + US2 de verificación (T017–T018). US1 y US4 son regresión.

1. T001 → T007–T011 (base) → T020–T027 y T017–T018.
2. Validar con `quickstart.md` escenarios 2b, 2c y 7.
3. Completar T030–T034 antes de declarar cerrado B2 ampliado.

### Entrega incremental

1. Base + roles → se puede generar un código con tío/abuelo/otro.
2. US3 → selector ampliado, vínculo condicional y copys cálidos.
3. US2 → verificación de la unión con cada rol.
4. Polish → puerta `kitho-ux` y documentación de resultados.
5. Entrada protegida → login primero, ciclo inaccesible sin sesión y código pendiente preservado
   (FR-034/FR-035/SC-012).

---

## Notes

- [P] = archivos distintos y sin dependencia de una tarea incompleta.
- Las tareas de UI no están hechas sin la matriz de estados de `docs/ux-playbook.md` §5 y la
  Definición de Hecho §10 (8 estados, copy es/en, tokens, teclado, `jest-axe`, 4 anchos).
- El campo de vínculo condicional añade un estado nuevo a la matriz (`ux-checklist.md`).
- Se introduce **una** dependencia de cliente: `zustand` ^5 (borrador del wizard, R14; piloto de la
  decisión de estado global de la spec 004). No se toca la moneda única.
- Finanzas y presupuestos siguen fuera de alcance (spec 004): solo se anuncian como "en camino".
- **Estado al 2026-11-20**: T001–T031 y T034 completadas. Backend 58 passed / 2 skipped; web 130
  tests; móvil 131 tests; typecheck y lint sin errores (5 warnings previos de `set-state-in-effect`
  en móvil); migración `006` aplicada y revertida con el enum `familyroleenum` de 7 valores;
  `check-shared`, `check-ui` (107 archivos) y `check-contrast` (38 pares) en verde.
- **T032 y T033 siguen abiertas**: exigen navegador, dispositivo/emulador y cuentas Google reales,
  no disponibles en este entorno.
- **Entrada protegida (nueva, 2026-11-20)**: T037–T040 cubren FR-034/FR-035/SC-012 (login primero,
  ciclo inaccesible sin sesión, secuencia login → perfil → ciclo → Home y conservación del código
  pendiente a través del login). El guard ya aplicaba la regla; T037–T040 añaden la verificación y
  quedan cerradas: guard `it.each` sin sesión en las tres rutas del ciclo, orden del primer acceso sin
  Home prematuro y código pendiente → `/invite` en web y móvil. Web 135 tests y móvil 136 en verde;
  typecheck y lint sin errores (5 warnings previos de `set-state-in-effect` en móvil).
- **Convergence T035 y T036 completadas**: la lista de integrantes usa la relación humana
  ("Padre · Administrador · Tú") y el feedback de acciones (invitar, promover, dar de baja) es local
  al control; claves i18n sin uso `roleFamilyLabel`, `rolePermissionLabel` y `memberStatusActive`
  eliminadas. Web 130 tests y móvil 131 en verde; `check-shared`/`check-ui`/`check-contrast` OK.
- **Wizard de crear familia (2026-11-25)**: T041–T048 completadas (T049 manual pendiente).
  `zustand` 5.1.0 en web y móvil; `Stepper` en `components/ui` por app; borrador
  `kitho_family_draft` con `skipHydration` + rehidratación en cliente; tests del store aislado y
  flujo por pasos. Web 143 tests y móvil 147 en verde; typecheck y lint sin errores (5 warnings
  previos de `set-state-in-effect` en móvil); `jest-axe` sin violaciones en los tres pasos;
  `check-shared` sincronizado, `check-ui` 109 archivos y `check-contrast` 38 pares en verde.

---

## Phase 8: Convergence

- [X] T035 (MEDIUM) Mostrar la relación humana en la lista de integrantes —"Padre · Administrador ·
      Tú"— sin las etiquetas de campo "Rol familiar:"/"Permiso:" ni la línea de estado "Activo" en
      `frontend-web/app/(app)/family/members/page.tsx` y
      `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, ajustando `shared/i18n/{es,en}.json` y
      las pruebas de flujo de ambos frontends per FR-017 / plan UX Gate (`kitho-ux`) (partial).
- [X] T036 (MEDIUM) Mover el feedback de éxito y de error de las acciones de integrantes (promover,
      dar de baja, generar invitación) junto al control que lo produce, en lugar del banner superior,
      en `frontend-web/app/(app)/family/members/page.tsx` y
      `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, con pruebas de flujo y `jest-axe` per
      FR-016 / FR-026 (partial).

---

## Phase 9: Entrada protegida (login → familia) — FR-034/FR-035/SC-012

**Goal**: sin sesión, la app muestra el login y nunca el ciclo de familia; la secuencia es login →
perfil mínimo (solo si falta) → ciclo de familia → Home; el código de invitación pendiente sobrevive
al login.

**Independent Test**: sin sesión, abrir `/family/select`, `/family/create` o `/invite` lleva a
`/auth/login`; con sesión nueva, el orden es login → perfil (si falta) → ciclo → Home; un enlace de
invitación sin sesión, tras autenticarse, llega directo a `/invite`.

- [X] T037 [P] [US1] Afirmar en `frontend-web/__tests__/useAuthGuard.test.tsx` y
      `frontend-mobile/__tests__/useAuthGuard.test.tsx` que sin sesión las rutas del ciclo
      (`/family/select`, `/family/create`, `/invite`) redirigen a `/auth/login` y que nunca se
      renderiza una pantalla del ciclo (FR-034, SC-012).
- [X] T038 [US1] Afirmar en `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx` que la secuencia del primer acceso es login → perfil
      (solo si falta) → ciclo de familia → Home, sin llegar a Home antes de tener familia (FR-035,
      SC-012).
- [X] T039 [P] [US2] Afirmar en `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx` que el código de invitación pendiente sobrevive al
      login y lleva directo a `/invite` sin pasar por `/family/select` (FR-030, FR-034, SC-012).
- [X] T040 [US4] Confirmar y, si aparece cualquier hueco, ajustar la única fuente de la regla en
      `frontend-web/hooks/useAuthGuard.ts` y `frontend-mobile/hooks/useAuthGuard.ts` para que ninguna
      ruta del ciclo sea accesible sin sesión y el login preceda siempre al ciclo (FR-034, FR-035).

**Checkpoint**: la puerta de entrada queda verificada; sin sesión no hay acceso al ciclo y el orden
login → perfil → ciclo → Home se cumple con el código pendiente preservado.

---

## Phase 10: Wizard de crear familia (FR-036...FR-044, SC-013...SC-016) — US5

**Goal**: alta de familia en 3 pasos guiados, en ruta única, con borrador persistido en cliente.

**Independent Test**: completar el wizard con valores válidos crea la familia una sola vez y llega
a Home; validaciones bloquean el avance; "Atrás" conserva; "Salir" descarta el borrador.

- [X] T041 [P] [US5] Añadir `zustand@^5` a `frontend-web/package.json` y
      `frontend-mobile/package.json` y crear `frontend-web/lib/store/familyDraft.ts` y
      `frontend-mobile/lib/store/familyDraft.ts` (`{step, nombre, moneda, rolFamiliar, setField,
      next, back, reset}`) con `persist` (`kitho_family_draft`); web con `localStorage` +
      `skipHydration`/`rehydrate`, móvil con adapter sobre `lib/storage.ts`. Revisar `audit.md` §4 y
      registrar cualquier hueco de onboarding con un ID `UX-xx` nuevo (FR-043, R14).
- [X] T042 [P] [US5] Crear `frontend-web/components/ui/Stepper.tsx` y
      `frontend-mobile/components/ui/Stepper.tsx` (progressbar, `aria-current`/estado, live region
      "Paso n de 3"), tokens-only, y exportarlos en `components/ui/index.ts` (FR-042).
- [X] T043 [P] [US5] Añadir las claves `family.wizard*` en `shared/i18n/{es,en}.json`
      (copy-deck §4c) y regenerar con `node scripts/generate-shared.mjs` (FR-017, SC-007).
- [X] T044 [US5] Reescribir `frontend-web/app/(onboarding)/family/create/page.tsx` como wizard de
      tres pasos con el store y `Stepper`: validación por paso, "Atrás", "Salir" con confirmación,
      foco al encabezado y anuncio de progreso; rol con `RadioGroup` (FR-036...FR-040, FR-042).
- [X] T045 [US5] Replicar el wizard en `frontend-mobile/app/(onboarding)/family/create.tsx` con la
      misma lógica y accesibilidad; rol con `ChoiceGroup` (FR-036...FR-042).
- [X] T046 [US5] Enviar `POST /families` solo al confirmar el paso 3, conservar
      `applyFamilyCreated` + `clearPendingInviteCode` + `router.replace("/")`, limpiar el borrador y
      mapear errores por paso (moneda → paso 2) (FR-041, FR-044, SC-013).
- [X] T047 [US5] Reescribir los tests de `create` en `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx` como recorrido por pasos; añadir tests del store
      aislado y `jest-axe` por paso (SC-014, SC-016).
- [X] T048 [P] [US5] Actualizar `specs/003-ux-audit/ux-checklist.md` §8 y `copy-deck-b.md` §4c con
      el resultado; verificar `check-shared`, `check-ui` y `check-contrast` (FR-019, FR-022).
- [ ] T049 [US5] Verificación manual del wizard a 375/768/1024/1440, zoom 200% y iOS/Android
      (**requiere navegador/dispositivo**).

---

## Phase 11: Validación de sesión en la entrada (UX-17, FR-034/FR-035)

**Goal**: la entrada no confía solo en el JWT local; valida usuario y membresía contra el backend,
reconcilia los flags y conserva la sesión ante fallos de red transitorios.

**Independent Test**: un access token vigente de un usuario inexistente lleva al login y limpia la
sesión; una membresía nueva se refleja al entrar; un fallo de red al validar no expulsa al login.

- [X] T050 [P] [US1] Añadir `GET /api/v1/auth/session` (valida usuario y membresía activa sin rotar
      tokens; `401` si el usuario no existe) en `backend/app/api/v1/auth.py`,
      `backend/app/services/auth_service.py` y `backend/app/schemas/auth.py` (FR-034, UX-17).
- [X] T051 [P] [US1] Cubrir el endpoint en `backend/tests/test_auth.py`: sin token, perfil
      incompleto, con membresía activa y usuario inexistente (`401`) (SC-012, UX-17).
- [X] T052 [US1] Implementar `validateSession` (una vez por access token, dedupe y single-flight) y
      `applySessionInfo` en `frontend-web/lib/api.ts`, `frontend-web/lib/session.ts` y
      `frontend-web/lib/types.ts`; validar la entrada en `frontend-web/hooks/useAuthGuard.ts`
      reconciliando flags y limpiando la sesión solo ante `401` (FR-034, FR-035, UX-17).
- [X] T053 [US1] Ajustar el `catch` de `refreshSession` para limpiar la sesión solo ante `401` y
      conservar el estado local ante fallos de red/5xx (FR-016, UX-17).
- [X] T054 [P] [US1] Añadir la identidad `ghost` (token válido para un usuario inexistente) en
      `backend/scripts/seed_e2e.py` y `frontend-web/e2e/fixtures/seed.ts`, y las pruebas E2E de sesión
      obsoleta, fallback sin red y login con sesión en
      `frontend-web/e2e/specs/entry-guard.spec.ts` (SC-012, UX-17).
- [X] T055 [P] [US1] Registrar UX-17 en `specs/003-ux-audit/audit.md` §4/§8 y dejar **UX-16 abierto**
      (salida al login desde el ciclo de familia) como deuda explícita de este corte (UX-16, UX-17).
- [ ] T056 [US1] Cerrar UX-16: acción "Cerrar sesión / Usar otra cuenta" en el layout del ciclo de
      familia y en el login (web y móvil), que limpie sesión y código pendiente y navegue a
      `/auth/login` (**fuera de este corte**).

---

## Phase 12: Convergence

**Goal**: cerrar los huecos detectados entre la spec/plan/contrato y el código del ciclo de vida de
la familia, sin reescribir tareas previas. Orden: HIGH → MEDIUM → LOW.

- [X] T057 [US1] Capturar el código de invitación desde el enlace de entrada y persistirlo **antes**
      del login, de modo que tras autenticarse la persona llegue directo a "Unirme" (web: leer el
      código de la URL en `/invite` o en `useAuthGuard`; móvil: manejar el deep link con
      `expo-linking`), sin depender de teclearlo en el campo per FR-030 (partial).
- [X] T058 [US3] Revisar, justificar o retirar la acción "Promover" (`promote_member` en web, móvil y
      backend) en la pantalla de Miembros, ya que la spec declara los roles fijos tras unirse y esa
      capacidad fuera de alcance per Assumptions ("Roles fijos en esta etapa") (contradicts).
- [X] T059 [US3] Persistir en cliente la última invitación creada (sin endpoint nuevo) y mostrarla con
      rol y caducidad tras una recarga, en vez de caer en "No hay una invitación activa" per FR-027
      (partial).
- [X] T060 [US2] Alinear la etiqueta de la acción de crear en la pantalla de elegir familia al literal
      **"Crear familia"** (hoy `family.createCta` = "Crear mi familia") en web y móvil per FR-032
      (partial).
- [X] T061 [US5] Mostrar los errores de acción del wizard junto al paso que los origina, no al inicio
      del card, conservando el retorno al paso 2 ante error de moneda per FR-044 (partial).
- [X] T062 [US5] Omitir la confirmación de "Salir" del wizard cuando el borrador esté vacío; pedirla
      solo cuando haya datos, per FR-040 (partial).
- [X] T063 [US5] Limpiar el borrador (`kitho_family_draft`) al redirigir fuera del wizard a una persona
      que ya tiene familia, per FR-043 (partial).
- [X] T064 [US3] Rechazar con `422` un `parentesco` no vacío (aunque sea solo espacios) enviado con un
      rol distinto de **Otro**, como indica el contrato de invitaciones, en vez de normalizarlo a
      `None` per FR-031 (partial).

---

## Phase 13: Invitación ya aceptada

**Goal**: que un código de invitación ya aceptado deje de mostrarse a quien lo emitió, con un
endpoint de consulta de estado, sin exponer un listado de invitaciones (FR-045, SC-017, UX-18).

- [X] T065 [US3] Añadir `GET /families/me/invitations/{invitation_id}` en
      `backend/app/api/v1/invitations.py` y `get_invitation` en
      `backend/app/services/invitation_service.py`: solo administradores (`403`), `404` si la
      invitación no existe o no pertenece a la familia, `200` con `InvitationResponse` (incluye
      `usado`).
- [X] T066 [P] [US3] Añadir pruebas backend del endpoint en `backend/tests/test_invitations.py`:
      estado tras aceptar, `404` de otra familia y `403` de miembro.
- [X] T067 [US3] Añadir `api.getInvitation(id)` en `frontend-web/lib/api.ts` y
      `frontend-mobile/lib/api.ts`.
- [X] T068 [US3] En Miembros (web y móvil), al entrar, consultar el estado de la invitación guardada
      (`kitho_last_invitation`) y limpiarla si `usado` es `true`, volviendo al estado sin código
      activo (FR-045).
- [X] T069 [P] [US3] Cubrir el ocultado con pruebas de flujo en web y móvil: un código usado deja de
      mostrarse y el fallo de la consulta no rompe la pantalla.

---

## Phase 14: Sección "Familia"

**Goal**: renombrar la sección de la familia en la interfaz: la etiqueta de navegación pasa de
"Miembros" a "Familia" (es/en, incluida la accesible) y el acceso desde Home pasa de "Ver miembros" a
"Ver familia" (FR-046). El encabezado interno sigue siendo "Integrantes".

- [X] T070 [P] [US3] Cambiar `nav.members` a "Familia"/"Family" y `dashboard.membersCta` a
      "Ver familia"/"View family" en `shared/i18n/es.json` y `shared/i18n/en.json`; regenerar
      `messages.generated.ts` con `node scripts/generate-shared.mjs` y actualizar las aserciones de
      navegación y e2e que fijan el nombre accesible (`frontend-web/__tests__/navigation.test.tsx`,
      `frontend-web/e2e/specs/responsive.spec.ts`, `frontend-web/e2e/specs/a11y-axe.spec.ts`,
      `frontend-web/e2e/lighthouse.mjs`).

---

## Phase 15: Menú de perfil y cierre de sesión

**Goal**: el avatar de la barra superior abre un menú con **Perfil** y **Cerrar sesión** en web; en
móvil, la pantalla de Perfil ofrece **Cerrar sesión**. El cierre pide confirmación y navega a
`/auth/login` (FR-047, SC-018, UX-19).

- [X] T071 [US3] Permitir que `Menu` (web) use un `trigger` propio y convertirlo en el menú del
      avatar en `frontend-web/components/navigation/TopAppBar.tsx`: ítems Perfil (→ `/profile`) y
      Cerrar sesión (abre `ConfirmDialog`, limpia la sesión y navega a `/auth/login`).
- [X] T072 [P] [US3] Añadir el botón y el diálogo de **Cerrar sesión** en
      `frontend-mobile/app/(app)/(tabs)/profile.tsx` reutilizando `settings.logoutConfirm*`.
- [X] T073 [P] [US3] Cubrir el menú y el cierre de sesión con pruebas en web y móvil (abrir el menú,
      elegir Perfil, confirmar el cierre y limpiar la sesión).

---

## Phase 16: Eliminar cuenta

**Goal**: Ajustes deja de ofrecer **Cerrar sesión** (que vive en el menú del avatar web y en Perfil
móvil, FR-047) y pasa a ofrecer **Eliminar cuenta** con confirmación. "Eliminar cuenta" desactiva la
cuenta sin borrar su fila (soft delete), bloquea el acceso y deja la familia o la membresía en el
estado correcto (FR-048, FR-049, SC-019, UX-20).

- [X] T074 [US1] Añadir `UserStatusEnum` (`activo`/`eliminado`) y las columnas `estado` y
      `fecha_eliminacion` a `backend/app/models/user.py`, con la migración
      `backend/alembic/versions/007_user_status.py` (`upgrade`/`downgrade` reversibles).
- [X] T075 [US1] Implementar `delete_account` en `backend/app/services/user_service.py` (si es el
      único integrante activo marca la familia como eliminada; si hay más, inactiva la membresía y
      reasigna el administrador) y exponer `DELETE /users/me` (204) en `backend/app/api/v1/users.py`.
- [X] T076 [P] [US1] Bloquear las cuentas eliminadas en `backend/app/services/auth_service.py`
      (`403` en login; `401` en sesión y refresh) y validar el usuario contra la base de datos en
      `get_current_user` (`backend/app/core/deps.py`).
- [X] T077 [P] [US1] Añadir `deleteAccount()` a `frontend-web/lib/api.ts` y
      `frontend-mobile/lib/api.ts` y las claves `settings.deleteAccount*` en
      `shared/i18n/{es,en}.json`; regenerar con `node scripts/generate-shared.mjs`.
- [X] T078 [US1] Web: quitar **Cerrar sesión** de `frontend-web/app/(app)/settings/page.tsx` y añadir
      **Eliminar cuenta** con `ConfirmDialog` y `ErrorMessage`; añadir **Cerrar sesión** (con
      confirmación) a `frontend-web/app/(app)/profile/page.tsx`.
- [X] T079 [P] [US1] Móvil: quitar **Cerrar sesión** de `frontend-mobile/app/(app)/settings.tsx` y
      añadir **Eliminar cuenta** con `Dialog` y `ErrorMessage`.
- [X] T080 [P] [US1] Cubrir el flujo con pruebas: `backend/tests/test_account.py` y pruebas de flujo
      y de cliente en web y móvil (confirmar, fallar sin limpiar sesión, y salir de Perfil).

---

## Phase 17: Convergence

**Goal**: cerrar el hueco detectado entre SC-019/FR-049 y las pruebas: la especificación exige que
una cuenta eliminada no pueda reusar su **refresh token**, y que ese bloqueo quede verificado por
prueba automatizada. La implementación ya existe; falta la cobertura.

- [X] T081 [US1] Añadir en `backend/tests/test_account.py` una prueba de que un refresh token vigente
      de una cuenta eliminada responde `401` en `POST /api/v1/auth/refresh`, usando
      `create_refresh_token({"user_id": ...})` tras `DELETE /users/me`, per FR-049/SC-019 (partial).

---

## Phase 18: Acciones de integrantes con iconos

**Goal**: sustituir los botones de texto de la lista de **Integrantes** por controles solo-icono
accesibles y añadir un acceso de edición en la fila propia, per FR-050.

**Independent Test**: en Familia → Integrantes, un administrador ve flecha y cruz como únicos
controles sobre otras personas; su propia fila muestra un lápiz que abre **Editar perfil**.

- [X] T082 [US3] Web y móvil: convertir **Promover** y **Expulsar** en `IconButton` solo-icono
      (`ArrowUpCircle` / `X`) con nombre accesible y conservar el diálogo de confirmación; añadir el
      lápiz (`Pencil`) en la fila propia hacia `/profile/edit`; crear `IconButton` en móvil y
      extender el de web con tono y carga; cubrir con pruebas de flujo (FR-050).
