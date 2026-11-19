---

description: "Task list — Ciclo de vida de la familia (B2)"
---

# Tasks: Ciclo de vida de la familia (Día 1)

**Input**: Diseño en `/specs/003-ux-audit/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api-invitations.md](./contracts/api-invitations.md),
[quickstart.md](./quickstart.md)

**Tests**: se incluyen tareas de prueba porque la Definición de Hecho de UI
(`docs/ux-playbook.md` §10) exige `typecheck`, `lint` y tests en verde con `jest-axe` sin
violaciones. No se adopta TDD estricto: primero se ajusta el contrato y luego se actualizan las
pruebas que hoy dependen del rol enviado al unirse.

**Organización**: por historia de usuario. B1 (US1 y US4) ya está implementado y se cubre con
verificación de regresión; B2 (US2 y US3) es el trabajo nuevo.

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
      `node scripts/check-ui.mjs` y `node scripts/check-shared.mjs`) y anotar el resultado en
      `specs/003-ux-audit/audit.md` §8. Si algo falla, resolverlo antes de continuar: las tareas
      siguientes asumen esa base en verde.

---

## Phase 2: Foundational (bloquea US2 y US3)

**Propósito**: columnas, migración y contrato de invitaciones. Sin esta fase, ni invitar con rol ni
unirse heredando el rol pueden funcionar.

**⚠️ CRÍTICO**: US2 y US3 no empiezan hasta completar T002–T006.

- [X] T002 [P] Añadir a `backend/app/models/invitation.py` dos columnas nullable:
      `rol_familiar` (Enum `padre|madre|hijo|hija`, sin default) y `parentesco` (`String(80)`,
      nullable). No añadir índices nuevos ni backfill.
- [X] T003 [P] Crear la revisión `backend/alembic/versions/005_invitation_family_role.py` con
      `revision = "005"` y `down_revision = "004"`; `upgrade()` añade ambas columnas nullable y
      `downgrade()` las elimina. Debe pasar `alembic upgrade head` y `alembic downgrade -1`.
- [X] T004 [P] Ajustar el contrato en `backend/app/schemas/invitation.py`:
      `CreateInvitationRequest.rol_familiar` obligatorio (`FamilyRoleEnum`; fuera del conjunto →
      `422`) y `parentesco` opcional `max_length=80`; `InvitationResponse` añade `rol_familiar` y
      `parentesco`; `JoinInvitationRequest` deja solo `codigo` (1–32) o `token`, eliminando
      `rol_familiar` y `parentesco`; `JoinInvitationResponse` añade `rol_familiar` nullable.
- [X] T005 Implementar en `backend/app/services/invitation_service.py`: `create_invitation` guarda
      `rol_familiar` y `parentesco` del cuerpo; `join_invitation` toma
      `rol_familiar = invitation.rol_familiar` y `parentesco = invitation.parentesco`, deriva
      `admin` para `padre|madre`, `member` para `hijo|hija|null`, y nunca lee el rol del cuerpo.
      Eliminar `_resolve_family_role` si queda sin uso.
- [X] T006 [P] Actualizar tipos compartidos en `frontend-web/lib/types.ts` y
      `frontend-mobile/lib/types.ts`: `Invitation` gana `rol_familiar` y `parentesco` (nullable);
      `JoinInvitationResponse` gana `rol_familiar` nullable. Mantener los dos archivos idénticos.

**Checkpoint**: migración reversible aplicada, backend compila y el contrato de unión ya no acepta
rol.

---

## Phase 3: User Story 1 — Entrar y entender para qué sirve Kitho (Priority: P1)

**Goal**: la entrada explica qué es Kitho hoy, qué viene después y qué pasa con los datos, con una
sola acción de acceso.

**Independent Test**: una persona que solo ve `frontend-web/app/(auth)/auth/login/page.tsx` (o
`frontend-mobile/app/(auth)/auth/login.tsx`) puede decir en una frase qué hace Kitho y qué no hace
todavía.

- [X] T007 [P] [US1] Ampliar `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/login.test.tsx` para afirmar: promesa de organización visible,
      finanzas/presupuestos anunciados como "en camino" y exactamente un botón de acceso primario
      (FR-001, FR-002, SC-005, SC-009).
- [X] T008 [US1] Revisar el login web (`frontend-web/app/(auth)/auth/login/page.tsx`) y móvil
      (`frontend-mobile/app/(auth)/auth/login.tsx`) contra FR-002: debe declarar qué ocurre con los
      datos. Si falta, añadir la clave en `shared/i18n/es.json` y `shared/i18n/en.json` y regenerar
      con `node scripts/generate-shared.mjs`.

**Checkpoint**: US1 verificada por pruebas; sin cambios de comportamiento.

---

## Phase 4: User Story 2 — Crear la familia o unirse con un código (Priority: P1)

**Goal**: quien no tiene familia ve una jerarquía contextual (con código → unirme; sin código →
crear) y quien se une envía solo el código y recibe el rol de la invitación.

**Independent Test**: con dos cuentas y un código generado con rol `madre`, la segunda cuenta se
une enviando solo `{ codigo }` y entra como administrador; con rol `hijo`, entra como miembro.

- [X] T009 [P] [US2] Añadir en `shared/i18n/es.json` y `shared/i18n/en.json` las claves de la
      jerarquía contextual de [copy-deck-b.md](./copy-deck-b.md): `family.joinWithCodeTitle`,
      `family.joinWithCodeBody`, `family.joinWithCodeCta`, `family.invitedHeading`,
      `family.invitedBody`, `family.invitedCta`. Ejecutar `node scripts/generate-shared.mjs` al
      terminar el bloque de copy.
- [X] T010 [P] [US2] Hacer contextual `frontend-web/app/(onboarding)/family/select/page.tsx`:
      leer `getPendingInviteCode()` de `frontend-web/lib/session.ts`; con código, "unirme" es la
      tarjeta primaria y va primero con el código listo para confirmar; sin código, "crear familia"
      es la primaria y "me invitaron" la secundaria. Una sola acción primaria en ambos estados
      (FR-029).
- [X] T011 [P] [US2] Replicar la jerarquía contextual en
      `frontend-mobile/app/(onboarding)/family/select.tsx` usando `getPendingInviteCode()` de
      `frontend-mobile/lib/session.ts` (es asíncrona: resolverla en un `useEffect` con estado de
      carga) y los mismos textos (FR-029).
- [X] T012 [US2] Ajustar los clientes para enviar solo el código o el token:
      `frontend-web/lib/api.ts` y `frontend-mobile/lib/api.ts`, en `joinFamilyByCode` y
      `joinInvitation` (sin `rol_familiar` ni `parentesco`).
- [X] T013 [P] [US2] Actualizar `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx`: con código pendiente la acción primaria es
      "unirme" y el payload es `{ codigo }`; sin código la primaria es "crear"; el error de código
      sigue siendo local al campo (FR-029, FR-030, SC-011).
- [X] T014 [P] [US2] Actualizar `backend/tests/test_invitations.py`: el rol aplicado sale de la
      invitación (`test_join_as_parent_grants_admin_role` deja de enviar rol), un rol en el cuerpo
      se ignora, `rol_familiar = null` entra como `member` y solo `padre|madre` otorgan `admin`.
- [X] T015 [US2] Añadir a `specs/003-ux-audit/quickstart.md` un escenario de jerarquía contextual
      (llegar con código pendiente → unirse es primaria y no se pasa por la elección) y dejar
      registrado el resultado de ejecutarlo.

**Checkpoint**: US2 funciona con el rol heredado del código; la pantalla de elección ya no ofrece
dos tarjetas con el mismo peso.

---

## Phase 5: User Story 3 — Invitar declarando el rol de la persona invitada (Priority: P1)

**Goal**: quien administra elige `padre`, `madre`, `hijo` o `hija` al generar el código y la
interfaz muestra para quién es y cuándo caduca.

**Independent Test**: con una cuenta administradora, generar un código con cada rol y verificar en
la respuesta y en la lista de miembros el permiso resultante.

- [X] T016 [P] [US3] Añadir en `shared/i18n/es.json` y `shared/i18n/en.json` las claves
      `family.inviteRoleLabel`, `family.inviteRoleHint`, `family.invitationFor` y
      `family.inviteRoleRequired` con los textos de
      [contracts/api-invitations.md](./contracts/api-invitations.md) §3; regenerar con
      `node scripts/generate-shared.mjs`.
- [X] T017 [US3] Añadir el selector de rol en
      `frontend-web/app/(app)/family/members/page.tsx`: `Select` de `components/ui`, etiqueta
      `family.inviteRoleLabel`, ayuda `family.inviteRoleHint`, valor inicial `hijo` (R3), sin
      opción vacía; deshabilitar "Generar invitación" mientras falte (FR-011, FR-027). Enviar el
      rol a `createInvitation`.
- [X] T018 [US3] Replicar el selector en
      `frontend-mobile/app/(app)/(tabs)/family/members.tsx` con los mismos textos, default `hijo`,
      estado seleccionado expuesto (`accessibilityState`) y el rol enviado a `createInvitation`
      (FR-011, FR-023, FR-027).
- [X] T019 [US3] Mostrar el rol de la invitación en `frontend-web/components/family/InviteCode.tsx`
      con `family.invitationFor` y la caducidad formateada con el locale activo (`formatDate`), sin
      concatenar fechas a mano (FR-025, FR-027).
- [X] T020 [US3] Mostrar el rol de la invitación en
      `frontend-mobile/components/family/InviteCode.tsx` con el mismo copy y formato de fecha
      localizado (FR-025, FR-027).
- [X] T021 [US3] Cambiar la firma de `createInvitation` en `frontend-web/lib/api.ts` y
      `frontend-mobile/lib/api.ts` a `{ expiraEnHoras?, rolFamiliar, parentesco? }` y enviar
      `rol_familiar` y `parentesco` en el cuerpo de `POST /families/me/invitations`.
- [X] T022 [P] [US3] Ampliar `backend/tests/test_invitations.py`: crear sin rol → `422`; rol
      inválido → `422`; `201` devuelve `rol_familiar` y `parentesco`; no administrador → `403`;
      el parentesco se persiste sin alterar permisos.
- [X] T023 [P] [US3] Ampliar las pruebas de flujo de `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx`: el selector inicia en `hijo`, hay una sola acción
      primaria en Miembros, el rol enviado coincide con el elegido y la invitación generada muestra
      "Invitación para: …".
- [X] T024 [US3] Actualizar `specs/003-ux-audit/quickstart.md` escenarios 1 y 2 con el selector y
      el valor por defecto, y registrar el resultado de ejecutarlos.

**Checkpoint**: US3 completa; un código generado con rol produce la membresía y el permiso
esperados al unirse.

---

## Phase 6: User Story 4 — Volver a entrar cuando ya hay familia (Priority: P2)

**Goal**: quien ya tiene familia llega directo a Home y no vuelve a ver el ciclo de familia.

**Independent Test**: con una cuenta con familia, abrir `/family/select` y `/invite` redirige a
Home; abrir Home muestra estado de familia y finanzas "en camino".

- [X] T025 [P] [US4] Ampliar `frontend-web/__tests__/useAuthGuard.test.tsx` y
      `frontend-mobile/__tests__/useAuthGuard.test.tsx` para afirmar que, con familia activa,
      `/family/select` y `/invite` redirigen a `/` (FR-004).
- [X] T026 [US4] Revisar `frontend-web/app/(app)/page.tsx` y
      `frontend-mobile/app/(app)/(tabs)/index.tsx`: Home debe renderizar estado de la familia y
      "qué hacer ahora", y anunciar finanzas como "en camino" sin datos simulados (FR-020, SC-005);
      añadir la aserción correspondiente en los tests de flujo si falta.

**Checkpoint**: el regreso no paga onboarding otra vez.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Propósito**: puerta de calidad de la skill `kitho-ux` antes de cerrar B2.

- [X] T027 [P] Regenerar artefactos compartidos y verificar el sistema visual:
      `node scripts/generate-shared.mjs`, `node scripts/check-shared.mjs` y
      `node scripts/check-ui.mjs` (cero valores fuera de `design-tokens/tokens.json`, FR-019).
- [X] T028 [P] Añadir verificaciones `jest-axe` de contraste y estado seleccionado para el selector
      de rol y la pantalla de invitación en `frontend-web/__tests__/flows.test.tsx` y
      `frontend-mobile/__tests__/flows.test.tsx` (FR-022, FR-023, SC-010).
- [ ] T029 Verificar a 375, 768, 1024 y 1440 px (web) y en iOS/Android (móvil), con zoom 200%,
      texto grande y movimiento reducido; comprobar que no hay cards dentro de cards ni más de dos
      líneas por fila (FR-024, FR-028) y marcar el resultado en
      `specs/003-ux-audit/ux-checklist.md`.
- [ ] T030 Ejecutar los cinco escenarios de `specs/003-ux-audit/quickstart.md` en español e inglés
      y anotar el resultado en `specs/003-ux-audit/audit.md` (UX-03 y estado de B2).
- [X] T031 [P] Revisar que no queden claves sin usar ni textos fuera de
      `specs/003-ux-audit/copy-deck-b.md` en `shared/i18n/es.json` y `shared/i18n/en.json`; ajustar
      el copy deck con cualquier texto final (FR-017, SC-007).

> **Estado al 2026-11-19**: T001–T028 y T031 completadas y verificadas de forma automatizada
> (backend 55 passed / 2 skipped; web 127 tests; móvil 128 tests; `check-ui` 105 archivos;
> `check-shared` sincronizado; migración `005` reversible). **T029 y T030 siguen abiertas**: exigen
> navegador, dispositivo/emulador y cuentas Google reales, que no están disponibles en este
> entorno. Están registradas como pendientes en `audit.md` §8 y `ux-checklist.md` §4–§5 y §7.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: primero; fija la línea base.
- **Foundational (T002–T006)**: depende de T001 y bloquea US2 y US3.
- **US1 (T007–T008)**: solo depende de T001; puede ir en paralelo con la fase base.
- **US4 (T025–T026)**: solo depende de T001; puede ir en paralelo con todo lo demás.
- **US2 (T009–T015)** y **US3 (T016–T024)**: dependen de T002–T006; entre sí pueden avanzar en
  paralelo, pero comparten los archivos de tests de flujo, así que T013/T023 se serializan.
- **Polish (T027–T031)**: depende de US2 y US3 completas (y de US1/US4 si se incluyen en el corte).

### Dentro de cada historia

- T002/T003/T004 en paralelo → T005 → T006 → clientes y UI.
- Copy (T009/T016) antes de las pantallas que lo usan.
- Selector y componentes antes de las pruebas de flujo que los afirman.
- Backend en verde antes de validar la pantalla (el frontend no es autoridad).

### User Story Dependencies

- **US1**: independiente; sin dependencia de B2.
- **US2**: depende de Foundational. No depende de US3 para probarse (se puede sembrar un código con
  rol por API o base de datos), pero en producto el rol solo existe si US3 está desplegada.
- **US3**: depende de Foundational. Se puede probar sola verificando la respuesta de creación y la
  pantalla de Miembros.
- **US4**: independiente.

### Parallel Opportunities

- T002, T003, T004 y T006 tocan archivos distintos: en paralelo.
- T009 y T010/T011: copy primero; luego web y móvil en paralelo (archivos distintos).
- T014 y T022 tocan el mismo `backend/tests/test_invitations.py`: no ejecutar en paralelo entre sí.
- T027, T028 y T031 son independientes entre sí.
- US1 y US4 pueden ejecutarse en paralelo con B2 si hay más de una persona.

---

## Parallel Example: User Story 2

```bash
# Copy y pantallas en paralelo (archivos distintos):
Task: "Añadir claves joinWithCode*/invited* en shared/i18n/{es,en}.json"
Task: "Hacer contextual frontend-web/app/(onboarding)/family/select/page.tsx"
Task: "Hacer contextual frontend-mobile/app/(onboarding)/family/select.tsx"

# Pruebas de backend y frontend en paralelo:
Task: "Actualizar backend/tests/test_invitations.py (rol desde la invitación)"
Task: "Actualizar frontend-web/__tests__/flows.test.tsx (payload solo codigo)"
```

## Parallel Example: User Story 3

```bash
Task: "Añadir claves inviteRole*/invitationFor en shared/i18n/{es,en}.json"
Task: "Selector de rol en frontend-web/app/(app)/family/members/page.tsx"
Task: "Selector de rol en frontend-mobile/app/(app)/(tabs)/family/members.tsx"
```

---

## Implementation Strategy

### MVP de este corte

B1 ya está desplegado, así que el incremento mínimo con valor es **US2 + US3 juntas**: US3 crea el
código con rol y US2 lo aplica al unirse. US3 sola no entrega valor (nadie aplica el rol) y US2 sola
no tiene códigos con rol que aplicar. US1 y US4 son verificación de regresión y pueden ir en
paralelo.

1. T001 → T002–T006 (base) → T009–T015 y T016–T024.
2. Validar con `quickstart.md` escenarios 1–3.
3. Completar T027–T031 antes de declarar B2 cerrado.

### Entrega incremental

1. Base + US3 → se puede generar un código con rol y verlo en la respuesta (sin cambiar aún la
   unión).
2. US2 → la unión aplica el rol y la pantalla de elección es contextual.
3. US1/US4 → regresión de entrada y regreso.
4. Polish → puerta `kitho-ux` y documentación de resultados.

### Estrategia con varias personas

1. Una persona cierra T002–T006 (contrato y migración) mientras otra ejecuta T001, T007–T008,
   T025–T026.
2. Tras la base: persona A toma US2 (pantallas + joins), persona B toma US3 (selector + invitación).
3. Una tercera persona prepara T028–T029 (accesibilidad y responsive) en cuanto haya pantallas.

---

## Notes

- [P] = archivos distintos y sin dependencia de una tarea incompleta.
- Las tareas de UI no están hechas sin la matriz de estados de `docs/ux-playbook.md` §5 y la
  Definición de Hecho §10 (8 estados, copy es/en, tokens, teclado, `jest-axe`, 4 anchos).
- No se introduce ninguna dependencia nueva ni se toca la moneda única.
- Finanzas y presupuestos siguen fuera de alcance (spec 004): solo se anuncian como "en camino".
- UX-02.2 (enlace visible a privacidad/términos) sigue como observación abierta y no bloquea B2.
- Commit tras cada tarea o grupo lógico; validar cada checkpoint antes de avanzar.

---

## Phase 8: Convergence

- [X] T032 Corregir `familyRoleLabel` en `frontend-web/app/(app)/family/members/page.tsx` y
      `frontend-mobile/app/(app)/(tabs)/family/members.tsx`: con `rol_familiar` nulo debe mostrar
      `family.memberRole` ("Miembro") y no usar `member.parentesco` en la ranura "Rol familiar";
      añadir en ambos frontends una prueba con membresía heredada (`rol_familiar: null`,
      `parentesco: "hija"`) que afirme "Miembro" per FR-014, plan: research R6 (contradicts).
- [X] T033 Añadir una verificación automatizada de contraste que lea `design-tokens/tokens.json`
      (claro y oscuro), calcule los ratios WCAG de cada par `on*`/`*Container` y falle por debajo de
      4.5:1 en texto y 3:1 en componentes/foco; dejarla ejecutable como `scripts/check-contrast.mjs`
      y documentar el comando en `specs/003-ux-audit/quickstart.md` y `audit.md` §8 per FR-022,
      SC-010 (missing).
- [X] T034 Añadir un enlace visible a privacidad/términos junto a la nota de confianza del login
      (`frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-mobile/app/(auth)/auth/login.tsx`) y
      en Ajustes (`frontend-web/app/(app)/settings/page.tsx`, `frontend-mobile/app/(app)/settings.tsx`),
      con destino accesible (página o sección real, no un placeholder), copy es/en en
      `shared/i18n/{es,en}.json` y objetivo táctil ≥44 per UX-02.2, spec.md UX Gate (missing).
- [X] T035 Resolver la contradicción del label "Parentesco (opcional)": renombrar
      `family.inviteKinshipLabel` a lenguaje natural (por ejemplo "Vínculo familiar") en
      `shared/i18n/{es,en}.json`, `specs/003-ux-audit/copy-deck-b.md` §6 y ambos frontends, sin usar
      nombres de campos del modelo en texto visible per FR-017, ux-checklist.md §3 (contradicts).
- [X] T036 Alinear `expira_en_horas` con FR-010: como el servicio siempre fija 7 días, retirar el
      campo de `backend/app/schemas/invitation.py`, de `createInvitation` en `frontend-web/lib/api.ts`
      y `frontend-mobile/lib/api.ts`, de `backend/tests/test_postgres_invitation_expiry.py` y de las
      pruebas de `api.test.ts` de ambos frontends, y actualizar `contracts/api-invitations.md` §1 per
      FR-010, contract §1 (partial).
- [X] T037 Nombrar el objeto afectado en las confirmaciones destructivas de
      `frontend-web/components/family/FamilyActions.tsx` y su equivalente móvil: incluir el nombre de
      la familia al eliminar y el de la persona al darla de baja, con copy es/en en
      `shared/i18n/{es,en}.json` y pruebas en `family-actions.test.tsx` per FR-021 (partial).
- [X] T038 Normalizar el código en el backend según el contrato: además de `strip().upper()`, quitar
      espacios internos y guiones en `join_invitation` (`backend/app/services/invitation_service.py`)
      y ampliar `test_invitation_code_is_normalized_on_join` con `"ABCD-2345"` y espacios internos
      per contracts/api-invitations.md §2, edge case de normalización (partial).
- [X] T039 Corregir la pluralización de la caducidad: `family.invitationExpires` debe usar forma
      singular y plural en es/en (o claves separadas) para no mostrar "1 días restantes" /
      "1 days remaining", y cubrirlo con una prueba de `InviteCode` en web y móvil per FR-025,
      FR-017 (partial).
- [X] T040 Eliminar las claves i18n sin uso `family.joinHeading`, `family.joinBody`, `family.joinCta`,
      `family.inviteRoleRequired`, `invite.expiredCode`, `invite.invalidCode` e `invite.usedCode` de
      `shared/i18n/{es,en}.json` y del copy deck (o usarlas en la UI), regenerar con
      `node scripts/generate-shared.mjs` y confirmar `node scripts/check-shared.mjs` per T031,
      FR-017 (unrequested).
- [X] T041 Reformular `settings.legalBody` en es/en para no presentar finanzas como capacidad
      disponible (alinearlo con "en camino") y revisar que ninguna otra cadena visible las anuncie
      como activas per SC-005 (contradicts).