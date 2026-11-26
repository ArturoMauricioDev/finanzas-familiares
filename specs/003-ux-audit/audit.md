# Auditoría UX — Kitho

**Feature Branch**: `003-ux-audit`
**Created**: 2026-11-19
**Status**: Baseline
**Input**: "Mejorar ingeniería de UI sólida y UX de producto en fase esqueleto. El trabajo de mayor
impacto no es hacerlo más bonito: es decidir qué ve alguien al abrir Kitho y cómo se siente su
primer día."

**Alcance**: 14 pantallas de `frontend-web` y `frontend-mobile`, el onboarding completo, la
navegación y los componentes de `frontend-web/components/ui` y `frontend-mobile/components/ui`.
**Fuera de alcance**: pantallas financieras (no existen todavía en backend) y estilos visuales
(no se auditan: se documentan como fortaleza).

---

## 1. Resumen ejecutivo

La ingeniería de UI está por encima de la media del proyecto: tokens compartidos, i18n con claves
generadas, regiones vivas de accesibilidad, foco visible, touch targets y diálogos de confirmación.
**No hay hallazgos de accesibilidad base.**

El problema es de **producto**: Kitho no tiene primer acto. El tab Inicio es un redirect, el
onboarding pide datos antes de explicar el valor, y la pantalla que hace de "home" real es una
lista de personas con jerga del modelo de datos. El usuario nuevo no llega a ningún "esto es para
mí".

**Causa raíz**: el producto se diseñó alrededor de las entidades del backend (perfil, familia,
miembros, invitación) y no alrededor del estado del usuario ("¿qué tengo que hacer ahora?").

**Consecuencia medible**: no existe hoy ninguna métrica de embudo. La línea base de la sección 5
es la primera que habrá.

---

## Clarifications

### Session 2026-11-19

- Q: ¿Dónde debe vivir el trabajo de B2 (el rol viaja en el código de invitación) para cumplir la regla de "cero código sombra"? → A: En una `spec.md` nueva de 003 con el ciclo de familia (B1 + B2); plan y tasks después.
- Q: ¿Cómo tratamos C (Home hub) dentro de la secuencia ahora que ya está construido? → A: C cuenta como enviado; la secuencia arranca en B1.
- Q: ¿Qué entra en D, el corte que va justo después de B2 en el mismo sprint? → A: Miembros (UX-04, UX-05, UX-06, UX-10) + Ajustes (UX-08, UX-09).
- Q: ¿Qué convierte a E en una puerta objetiva y no en una intención permanente? → A: Gate de CI con `check-ui` (hardcode) + `jest-axe` (contraste/roles) + verificación de `aria-live` contra la matriz de estados.

---

## 2. Método

| Actividad | Fuente | Estado |
| --- | --- | --- |
| Revisión de código pantalla por pantalla | `frontend-web/app`, `frontend-mobile/app` | Hecho |
| Inventario de componentes y estados | `components/ui`, `components/family`, `components/navigation` | Hecho |
| Contraste de tokens y uso de valores crudos | `design-tokens/tokens.json`, grep de hex/px en código de app | Hecho |
| Accesibilidad estática | `jest-axe` en web, revisión de roles/aria/live regions | Hecho |
| Pruebas con usuarios | 5 participantes | **Pendiente** → `usability-test.md` |
| Métricas de embudo | instrumentación | **Pendiente** → `metrics.md` |

**Severidades**: `S1` bloquea el primer día · `S2` degrada comprensión o confianza · `S3` pulido.
**Esfuerzo**: `XS` <2 h · `S` 1 día · `M` 2–3 días · `L` >3 días.

---

## 3. Fortalezas verificadas (no tocar)

- **Tokens como contrato**: `tokens.json` genera CSS y TypeScript; grep de `#rrggbb` en código de
  app devuelve 0 resultados.
- **i18n con claves generadas** y errores del backend mapeados a claves (`lib/generated/error-keys.ts`).
- **Accesibilidad real**: `Loading` con `role="status"` + `aria-live` (`frontend-web/components/ui/Loading.tsx:9`,
  `frontend-mobile/components/ui/Loading.tsx:16`); banners con `role="alert"`/`status`
  (`InlineBanner.tsx`); foco visible (`components/ui/Button.tsx:45`, `app/globals.css:27`);
  `aria-current` y `aria-selected` en navegación web.
- **Touch targets** ≥ 44 (`components/ui/Button.tsx:65`, `tokens.touchTarget`).
- **Confirmación en acciones destructivas** (`Dialog` en eliminación de miembro y logout) y estados
  de invitación usada/expirada/activa con badge.
- **Corrección**: el análisis previo de esta sesión afirmó que faltaban live regions; es falso, ya
  existen. Queda documentado para no repetir el error.

---

## 4. Hallazgos

### S1 — Bloqueantes del primer día

#### UX-01 · Inicio es un redirect vacío
**Evidencia**: `frontend-web/app/(app)/page.tsx:14`, `frontend-mobile/app/(app)/(tabs)/index.tsx:9-13`.
**Qué pasa**: Inicio hace `replace("/family/members")` y muestra un spinner. El tab primario no
tiene contenido, el primer destino es una lista de personas y el usuario ve dos cargas seguidas.
**Impacto**: no hay "primer acto"; la app se presenta como gestor de miembros.
**Recomendación**: Home hub con lo que ya existe: saludo, familia, moneda, miembros, estado de
invitación y **checklist de puesta en marcha** (perfil ✓, familia ✓, invitar ✗). Sin backend nuevo.
**Criterios de aceptación**
1. `/` y el tab Inicio renderizan contenido (no `Loading` permanente).
2. El checklist refleja el estado real y su CTA lleva al paso pendiente.
3. No hay más de una transición de carga en la entrada.
**Esfuerzo**: M · **Impacto**: alto

#### UX-02 · El login no dice qué gana el usuario
**Evidencia**: `frontend-web/app/(auth)/auth/login/page.tsx:58` usa `auth.title`/`auth.subtitle`;
existe `tagline` ("Tu familia, en orden") en `lib/i18n/messages.generated.ts:7` pero no se usa en
esa pantalla.
**Qué pasa**: la primera pantalla pide una cuenta de Google sin propuesta de valor ni qué ocurre
con los datos. En una app familiar, eso es fricción de confianza.
**Recomendación**: bloque de 3 beneficios concretos + "qué pasa con tus datos" + CTA Google.
**Criterios de aceptación**
1. Un usuario que solo ve el login puede decir en una frase para qué sirve Kitho.
2. Hay enlace visible a privacidad/términos.
**Esfuerzo**: S · **Impacto**: alto

#### UX-03 · Crear o unirse sin contexto ni recomendación
**Evidencia**: `frontend-mobile/app/(onboarding)/family/select.tsx` (dos `Card` equivalentes).
**Qué pasa**: no se explica que crear fija la moneda, que quien crea administra, ni qué implica un
código de un solo uso y 7 días. Ambas opciones pesan lo mismo.
**Recomendación** (decisión 2026-11-19): jerarquía **contextual** — con un código de invitación
pendiente, "unirme con un código" es la primaria y el código aparece listo; sin código, "crear mi
familia" es la primaria y "me invitaron / tengo un código" queda como secundaria explícita.
Microcopy de consecuencias en cada opción y salto directo a unirse cuando hay código (FR-029/FR-030).
**Criterios de aceptación**
1. Cada opción declara su consecuencia en ≤12 palabras.
2. La acción primaria depende del origen: con código → unirme; sin código → crear.
3. Quien trae un código pendiente no pasa por la elección.
**Estado**: ✅ resuelto en B1 + spec 003 (FR-029/FR-030, SC-011); la verificación visual queda en la
ronda 1.
**Esfuerzo**: S · **Impacto**: medio-alto

### S2 — Degradan comprensión o confianza

#### UX-04 · Miembros hace tres trabajos y la invitación está enterrada
**Evidencia**: `frontend-mobile/app/(app)/(tabs)/family/members.tsx:302` (invitación condicionada a
`isAdmin`), `:336` (acciones de familia), lista de miembros en la misma pantalla.
**Qué pasa**: ver integrantes, invitar y eliminar/abandonar compiten como tres `Card` iguales. Un
no-admin no ve nada sobre invitaciones ni sabe por qué.
**Recomendación**: invitación como CTA primaria para admin; para no-admin, línea explicativa
("Solo quien administra puede invitar"). Acciones de familia a Ajustes o menú "···".
**Criterios**: un usuario encuentra "invitar" en <10 s; un no-admin entiende por qué no puede.
**Esfuerzo**: M · **Impacto**: alto

#### UX-05 · Jerga del modelo en la lista
**Evidencia**: `members.tsx:265-266` ("Parentesco: … · Permiso: …") y `:270` (estado "activo").
**Qué pasa**: el usuario lee nombres de campos, no relaciones. "activo" es ruido si todos lo están.
**Recomendación**: `Padre · Administrador · Tú`, omitiendo estado salvo excepción.
**Criterios**: cada fila ≤2 líneas y sin etiquetas de campo.
**Esfuerzo**: XS · **Impacto**: medio

#### UX-06 · Acciones por fila sin jerarquía; promover sin confirmación
**Evidencia**: `members.tsx:275-295` (botones inline); `promote` no abre `Dialog`, `remove` sí.
**Qué pasa**: acciones de permisos a un clic, en cada fila, con el mismo peso que "Eliminar".
**Recomendación**: menú contextual por fila; confirmación o deshacer al promover.
**Criterios**: ninguna acción de permisos se ejecuta sin confirmación o undo.
**Esfuerzo**: S · **Impacto**: medio

#### UX-07 · Error de carga sin salida
**Evidencia**: `members.tsx:230`; `ErrorMessage` no acepta acción.
**Qué pasa**: si falla la carga, el usuario ve un banner y no puede reintentar sin salir y volver.
**Recomendación**: `ErrorMessage` con acción opcional "Reintentar"; conservar el último dato bueno.
**Criterios**: reintento a un clic; el contenido previo no se borra durante el reintento.
**Esfuerzo**: S · **Impacto**: alto

#### UX-08 · Ajustes como cinco cards idénticas, con copy duplicado
**Evidencia**: `frontend-mobile/app/(app)/settings.tsx:75` y `:85` usan la misma clave
`settings.accountBody` en "Cuenta" y "Perfil".
**Qué pasa**: muro de cards, jerarquía plana y un texto repetido que confunde secciones.
**Recomendación**: patrón lista de preferencias (label + control + divisor), secciones agrupadas y
copy propio para Perfil.
**Criterios**: ninguna clave i18n se repite en dos secciones; escaneo vertical sin cards anidadas.
**Esfuerzo**: S · **Impacto**: medio

#### UX-09 · Feedback de copiado redundante y fuera de contexto
**Evidencia**: `InviteCode.tsx:82-86` (texto "copiado") y `members.tsx:233` (`SuccessMessage`
arriba de la pantalla).
**Qué pasa**: dos señales para la misma acción, una de ellas fuera del viewport.
**Recomendación**: un solo canal, local al botón ("Copiado ✓", 2 s).
**Criterios**: el feedback aparece junto al control que lo originó.
**Esfuerzo**: XS · **Impacto**: medio

#### UX-10 · Sin forma de refrescar Miembros
**Evidencia**: `members.tsx:96-100` carga solo al montar y tras mutaciones; `refreshSession` solo en 403.
**Recomendación**: pull-to-refresh (móvil) y recarga al recuperar foco; en web, botón o revalidación.
**Criterios**: un cambio de otro miembro se ve sin reiniciar la app.
**Esfuerzo**: S · **Impacto**: medio

#### UX-16 · Sin salida al login desde el ciclo de familia
**Evidencia**: `frontend-web/app/(onboarding)/layout.tsx` (solo wordmark, sin salir),
`frontend-web/app/(app)/settings/page.tsx:34-38` (único "Cerrar sesión", tras
`useAuthGuard(true)`), `frontend-web/app/(auth)/auth/login/page.tsx:39-55` (reenvía cualquier
sesión persistida a `nextPath`).
**Qué pasa**: el único logout vive en Ajustes, que exige familia; con sesión persistida y sin
familia, Ajustes redirige a `/family/select` y el login devuelve al ciclo. Solo borrando
`finanzas_familiares_session` a mano en DevTools se vuelve a otra cuenta.
**Impacto**: quien tiene la sesión "atrapada" no puede cambiar de cuenta ni cerrar sesión; refuerza
la percepción de que el token sigue roto.
**Recomendación**: añadir "Cerrar sesión" / "Usar otra cuenta" en el layout del ciclo de familia y
en el propio login, que limpien sesión **y** código pendiente y naveguen a `/auth/login`; replicar
en móvil para paridad.
**Criterios de aceptación**
1. Con sesión y sin familia hay una acción visible que cierra sesión y lleva a `/auth/login`.
2. La acción limpia `finanzas_familiares_session` y `finanzas_familiares_pending_invite`.
3. El login ofrece "usar otra cuenta" cuando ya hay una sesión.
**Estado**: ⛔ abierto (punto 1 del plan; fuera de este corte).
**Esfuerzo**: S · **Impacto**: alto

#### UX-17 · La entrada no valida la sesión contra el backend
**Evidencia**: `frontend-web/hooks/useAuthGuard.ts` (solo leía el JWT y los flags de
`localStorage`), `frontend-web/lib/session.ts:20-28` (`getSession`),
`frontend-web/app/(onboarding)/family/select/page.tsx` (sin llamadas a la API).
**Qué pasa**: la entrada confiaba solo en el token local. Si el usuario o su membresía ya no
existían (p. ej. base reiniciada) pero el access token seguía vigente, la app lo dejaba en
`/family/select` sin corregirse. Además, un fallo de red al refrescar limpiaba la sesión y expulsaba
al login aunque los datos siguieran siendo válidos.
**Recomendación** (implementada): validar la sesión al entrar con `GET /auth/session` —valida
usuario y membresía sin rotar tokens— una vez por access token; limpiar la sesión **solo** ante
401 y conservar el estado local ante fallos de red o 5xx.
**Criterios de aceptación**
1. Un access token vigente de un usuario inexistente lleva al login y limpia la sesión.
2. Una membresía creada/eliminada en otro dispositivo se reconcilia al entrar (flags del backend).
3. Un fallo de red al validar no borra la sesión ni expulsa al login (respaldo local).
**Estado**: ✅ resuelto (ver §8).
**Esfuerzo**: S · **Impacto**: medio

### S3 — Pulido

| ID | Evidencia | Problema | Recomendación | Esf. |
| --- | --- | --- | --- | --- |
| UX-11 | `members.tsx:246` | `EmptyState` repite el título de la card | Título distinto + CTA "Invitar" | XS |
| UX-12 | `members.tsx:222-228` | Moneda como código ISO sin explicación | "Moneda de la familia" + microcopy de impacto | XS |
| UX-13 | login web/móvil | Sin enlaces legales ni de privacidad | Enlaces discretos bajo el CTA | XS |
| UX-14 | `002` decidió "sin skeletons" | El spinner central provoca salto de layout en listas | Reservar altura mínima o skeleton solo en listas | S |
| UX-15 | `BottomTabs.tsx:17-19` | Activo solo por color de fondo | Verificar `accessibilityState.selected` con VoiceOver/TalkBack; añadir indicador MD3 si falta | XS |

---

## 5. Línea base y criterios de éxito

Sin instrumentación actual. Propuesta completa en `metrics.md`.

| Métrica | Definición | Objetivo |
| --- | --- | --- |
| Activación | % de usuarios nuevos que llegan a Home en <2 min desde el login | ≥ 80% |
| Time-to-value | mediana login → Home con checklist visible | < 60 s |
| Invitación | % que genera o comparte código en la primera sesión | ≥ 40% |
| Finalización de onboarding | % que completa perfil y familia | ≥ 85% |
| Recuperación de error | % de errores con reintento exitoso | ≥ 70% |
| Accesibilidad | violaciones axe en CI | 0 |

---

## 6. Backlog priorizado

### Secuencia acordada (2026-11-19)

```
0. A + F en paralelo      evidencia (typecheck/lint/tests/check-ui) + reglas (playbook, decisiones)
1. C                      Home hub sin redirect                      ✅ enviado
2. B1                     bienvenida + perfil mínimo + contexto      ✅ implementado
3. B2                     rol en el código de invitación             ⛔ requiere specs/003-ux-audit/spec.md
4. D                      Miembros + Ajustes (mismo sprint que B2)
5. E                      continuo, con puerta de CI
```

C se considera enviado: sus criterios están cubiertos por pruebas de flujo y no se reenvía.
B2 no empieza hasta que exista su `spec.md`: cambia modelo de datos y contrato de API.

### Ahora (S1)
1. ~~UX-01 Home hub + checklist de puesta en marcha.~~ ✅ hecho (ver §8).
2. ~~UX-02 Propuesta de valor y confianza en login.~~ ✅ hecho: valor, confianza y enlace visible a
   privacidad/términos (criterio 2; ver Phase 8).
3. ~~UX-03 Jerarquía crear/unirse con consecuencias.~~ ✅ hecho: jerarquía contextual (con código
   → unirme primaria; sin código → crear primaria) y salto directo a unirse (FR-029/FR-030).
4. ~~UX-07 Reintento en errores de carga.~~ ✅ hecho (ver §8).

### Siguiente (S2)

**D = este bloque completo, en el mismo sprint que B2.** Miembros: UX-04, UX-05, UX-06, UX-10.
Ajustes: UX-08, UX-09.

5. UX-04 Separar trabajos de Miembros e invitación primaria.
6. UX-05 Copy de relaciones, sin jerga.
7. UX-06 Menú contextual + confirmación al promover.
8. UX-08 Ajustes como lista de preferencias.
9. UX-09 Feedback local único.
10. UX-10 Refresco de datos.

### E — puerta de accesibilidad (continuo)

Se cumple cuando, en el mismo cambio:

1. `node scripts/check-ui.mjs` pasa (cero valores visuales fuera de tokens).
2. `pnpm test` en web y móvil pasa, incluidos los tests con `jest-axe` de contraste y roles.
3. Cada pantalla tocada tiene sus estados de la sección 5 con región viva (`role="status"`/`alert`
   en web, `accessibilityLiveRegion` en móvil), verificado en la matriz de estados de `copy-deck-b.md`
   o la que corresponda.

Se ejecuta con cada corte, no como fase al final: una pantalla que no cumple no se envía.

### Después (S3)
11. UX-11 … UX-15.

**Regla de secuencia**: no se implementa nada de S2/S3 antes de UX-01 y UX-07. Sin Home y sin
recuperación de errores, el resto es cosmética sobre un esqueleto. **Estado**: desbloqueado el
2026-11-19, ambas cerradas. B2 quedó cerrado en código ese mismo día; solo espera la verificación
manual (T029/T030) descrita en §8.

---

## 7. Trazabilidad

- Reglas que aplican a cada hallazgo: `docs/ux-playbook.md`.
- Checklist por feature: `.specify/templates/ux-checklist.md`.
- Guion de pruebas: `specs/003-ux-audit/usability-test.md`.
- Métricas: `specs/003-ux-audit/metrics.md`.
- Decisiones previas respetadas: MD3, Inter, Lucide, tokens compartidos, WCAG 2.1 AA, sin
  skeletons/toasts como decisión de 002 (UX-14 propone una excepción acotada, no un cambio de sistema).
- Puerta de la opción B: `specs/003-ux-audit/decision-day-one.md`.

---

## 8. Estado de implementación

Actualizado: 2026-11-26. Solo se marca lo que está implementado y verificado; el resto del backlog
sigue abierto. Último corte: validación de la sesión en la entrada (UX-17).

### Implementado

| ID | Qué se hizo | Archivos | Verificación |
| --- | --- | --- | --- |
| UX-01 | Home hub en web y móvil: saludo, familia, moneda, integrantes, checklist de 3 pasos con `progressbar`, CTA de invitación, tarjeta "Finanzas en camino" y acciones rápidas. Sin redirect. | `frontend-web/app/(app)/page.tsx`, `frontend-mobile/app/(app)/(tabs)/index.tsx`, `shared/i18n/{es,en}.json` (`dashboard.*`) | Render de Home + ausencia de `router.replace` en `frontend-web/__tests__/flows.test.tsx`; typecheck y lint en verde |
| UX-07 | `ErrorMessage` acepta acción opcional; "Reintentar" conectado en Home y en Miembros (web + móvil). | `frontend-web/components/ui/InlineBanner.tsx`, `frontend-mobile/components/ui/InlineBanner.tsx`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx` | Prueba de reintento con segunda respuesta exitosa (web) y prueba del componente (móvil y web) |
| B1 | Promesa de organización (no finanzas), 3 puntos de valor y nota de confianza en login; copy de perfil mínimo; jerarquía y consecuencias en crear/unirse; consecuencia de moneda antes de crear; formulario de unirse reducido a un campo (sin rol ni parentesco). | `shared/i18n/{es,en}.json`, `frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(onboarding)/{invite,family/create,family/select}/page.tsx`, `frontend-mobile/app/(auth)/auth/login.tsx`, `frontend-mobile/app/(onboarding)/{invite/index,family/create,family/select}.tsx`, `specs/003-ux-audit/copy-deck-b.md` | `check-shared` sincronizado; typecheck, lint y tests en verde en web (127) y móvil (128); pruebas de flujo actualizadas (unirse envía solo `codigo`) |
| B2 | Rol declarado en la invitación: columnas `rol_familiar`/`parentesco` en `invitations`, el rol de la membresía se deriva de la invitación al unirse, selector de rol (inicio en `hijo`) y parentesco opcional al invitar, "Invitación para: …" en el código, aviso explicado para quien no administra, y jerarquía contextual de `family/select` (con código → unirme; sin código → crear) con guard que devuelve a Home a quien ya tiene familia. | `backend/app/models/invitation.py`, `backend/alembic/versions/005_invitation_family_role.py`, `backend/app/schemas/invitation.py`, `backend/app/services/invitation_service.py`, `backend/tests/test_invitations.py`, `frontend-{web,mobile}/lib/api.ts`, `frontend-{web,mobile}/lib/types.ts`, `frontend-web/app/(onboarding)/family/select/page.tsx`, `frontend-mobile/app/(onboarding)/family/select.tsx`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, `frontend-{web,mobile}/components/family/InviteCode.tsx`, `frontend-{web,mobile}/hooks/useAuthGuard.ts`, `shared/i18n/{es,en}.json`, `specs/003-ux-audit/copy-deck-b.md` | Backend 55 passed / 2 skipped (rol heredado, rol del cuerpo ignorado, código heredado → `member`, `422` sin rol, `403` no admin); migración `005` aplicada y revertida (`downgrade -1` + `upgrade head`); web 127 tests, móvil 128 (jerarquía contextual, selector, no-admin, `jest-axe`); `check-ui` 105 archivos; `check-shared` sincronizado |
| UX-17 | Validación de la sesión al entrar: endpoint `GET /auth/session` que resuelve usuario y membresía activa sin rotar tokens (`401` si el usuario ya no existe); `validateSession` en el cliente (una vez por access token, con dedupe y single-flight); el guard valida la entrada y reconcilia flags, limpia la sesión solo ante `401` y conserva el estado local ante fallos de red/5xx. `refreshSession` deja de borrar la sesión en errores de red. | `backend/app/api/v1/auth.py`, `backend/app/services/auth_service.py`, `backend/app/schemas/auth.py`, `backend/tests/test_auth.py`, `backend/scripts/seed_e2e.py`, `frontend-web/lib/api.ts`, `frontend-web/lib/session.ts`, `frontend-web/lib/types.ts`, `frontend-web/hooks/useAuthGuard.ts`, `frontend-web/e2e/fixtures/seed.ts`, `frontend-web/e2e/specs/entry-guard.spec.ts` | Backend 64 passed / 2 skipped (sin token, perfil incompleto, con membresía, usuario inexistente); web 152 tests y `pnpm test:e2e` en verde (identidad `ghost`); `typecheck` y `lint` en verde |

| B2+ | Roles `tío`, `abuelo` y `otro` (miembros) con enum PostgreSQL ampliado; **Vínculo familiar** obligatorio y visible solo con el rol **Otro** (oculto y no enviado en el resto); copys cálidos **Crear familia** y **Agregar integrantes a tu familia**. | `backend/app/models/membership.py`, `backend/alembic/versions/006_family_role_extra_values.py`, `backend/app/schemas/invitation.py`, `backend/app/services/invitation_service.py`, `backend/tests/test_invitations.py`, `frontend-{web,mobile}/lib/types.ts`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, `shared/i18n/{es,en}.json` | Backend 58 passed / 2 skipped (tío/abuelo/otro → `member`, `422` en vínculo incoherente); enum `familyroleenum` con 7 valores y migración `006` aplicada/revertida; web 130 tests y móvil 131 (siete roles, campo condicional, copys, `jest-axe` con campo visible) |

### Verificación de cierre (2026-11-20) · B2 ampliado

```bash
docker compose exec -T backend alembic upgrade head   # 005 -> 006
docker compose exec -T backend alembic downgrade -1 && alembic upgrade head  # reversible
docker compose exec -T backend pytest -q              # 58 passed, 2 skipped
cd frontend-web && pnpm run typecheck && pnpm run lint && pnpm test        # 130 tests
cd frontend-mobile && pnpm run typecheck && pnpm run lint && pnpm test     # 131 tests, 5 warnings previos
node scripts/check-shared.mjs                         # Shared artifacts are synchronized
node scripts/check-ui.mjs                             # UI guard passed for 107 files
node scripts/check-contrast.mjs                       # 38 token pairs (4.5:1 text, 3:1 UI)
```

### Verificación de cierre (2026-11-19)

```bash
docker compose exec -T backend alembic upgrade head   # 004 -> 005
docker compose exec -T backend pytest -q              # 55 passed, 2 skipped
cd frontend-web && pnpm run typecheck && pnpm run lint && pnpm test   # 129 tests
cd frontend-mobile && pnpm run typecheck && pnpm run lint && pnpm test # 130 tests, 5 warnings previos
node scripts/check-ui.mjs                             # UI guard passed for 107 files
node scripts/check-contrast.mjs                       # 38 token pairs (4.5:1 text, 3:1 UI)
node scripts/check-shared.mjs                         # Shared artifacts are synchronized
docker compose exec -T backend alembic downgrade -1 && alembic upgrade head  # reversible
```

Los 5 warnings de lint móvil son `react-hooks/set-state-in-effect` en pantallas preexistentes
(`profile/setup`, `profile/edit`, `login`, `(tabs)/index`, `family/members`); ninguno es un error y
no cambian el comportamiento.

### Verificación de cierre (2026-11-26) · Validación de sesión

```bash
docker compose exec -T backend pytest -q                             # 64 passed, 2 skipped
cd frontend-web && pnpm run typecheck && pnpm run lint && pnpm test  # 152 tests
cd frontend-web && pnpm test:e2e                                     # suite completa en verde
```

Cubre el hallazgo UX-17: `GET /auth/session` responde `401` para un usuario inexistente aunque el
access token siga vigente; el guard limpia la sesión solo ante `401` y usa el estado local ante
fallos de red. La identidad E2E `ghost` (token válido para un usuario que no existe) y la
interceptación de `/auth/session` verifican ambos caminos.

### Criterios de aceptación comprobados

- UX-01.1: `/` y el tab Inicio renderizan contenido; no queda `Loading` permanente.
- UX-01.2: el checklist refleja el estado real (perfil, familia, invitación) y el CTA lleva a Miembros.
- UX-01.3: una sola transición de carga en la entrada (guard + carga de familia).
- UX-07.1: reintento a un clic desde el propio banner de error.
- UX-07.2: el contenido previo se conserva durante el reintento (solo se limpia `error`).
- B1.1: lo que se ve en el login permite decir en una frase qué es Kitho (organizar a la familia) y
  que las finanzas están "en camino"; la confianza se declara ("no publicamos nada en tu nombre").
- B1.2: crear y unirse declaran su consecuencia en ≤12 palabras, y la moneda se explica antes de
  crear, no en el error (D3).
- B1.3: el formulario de unirse tiene un solo campo; rol y parentesco no aparecen (D2).
- B2.1: un código generado con `padre|madre` produce membresía `admin`; con `hijo|hija` o código
  heredado sin rol produce `member` con `rol_familiar` nulo (FR-011, FR-012, SC-003/SC-004).
- B2.2: el rol aplicado al unirse sale siempre de la invitación; un `rol_familiar` enviado en el
  cuerpo se ignora (`test_join_ignores_role_sent_in_request`, `test_legacy_invitation_without_role_joins_as_member`).
- B2.3: crear una invitación sin rol responde `422`; el parentesco se persiste y no altera permisos.
- B2.4: la elección de familia es contextual: con código pendiente "unirme" es la única acción
  primaria y el login lleva directo a `/invite`; sin código lo es "crear" (FR-029, FR-030).
- B2.5: quien ya tiene familia no vuelve al ciclo: `/family/select`, `/family/create` e `/invite`
  redirigen a `/` (FR-004), cubierto por `it.each` en ambos `useAuthGuard.test`.
- UX-17.1: un access token vigente de un usuario inexistente lleva al login y limpia
  `finanzas_familiares_session` (`test_session_unknown_user_returns_401` en backend; "un usuario
  inexistente con token vigente se limpia y vuelve al login" en E2E con la identidad `ghost`).
- UX-17.2: una membresía creada/eliminada se reconcilia al entrar con los flags del backend
  (`test_session_reports_existing_family`; "validates the session against the backend and reconciles
  family flags" en `useAuthGuard.test`).
- UX-17.3: un fallo de red al validar no borra la sesión ni expulsa al login
  ("keeps the local session when validation fails due to a network error" y "un fallo de red al
  validar conserva la sesión y no expulsa al login" en E2E).

### Convergencia (Phase 8, 2026-11-19)

Diez hallazgos detectados por `/speckit.converge` y cerrados sin tocar la spec ni el plan.

| Tarea | Qué se corrigió | Verificación |
| --- | --- | --- |
| T032 | `familyRoleLabel` ya no cae a `parentesco`: un rol familiar nulo se muestra como "Miembro" en web y móvil. | `shows legacy members without family role as members` en ambos `flows.test.tsx` |
| T033 | Guard de contraste sobre `design-tokens/tokens.json` (claro/oscuro): 4.5:1 en texto y 3:1 en componentes/foco. | `node scripts/check-contrast.mjs` |
| T034 | Enlace visible a privacidad/términos en login y Ajustes (web y móvil) y página `/legal` con copy es/en. | typecheck, lint y `check-ui` en ambos frontends |
| T035 | Label "Parentesco" renombrado a "Vínculo familiar (opcional)" / "Family relationship (optional)". | `check-shared` sincronizado; copy deck §6 alineado |
| T036 | `expira_en_horas` retirado del schema, clientes, pruebas y contrato; la caducidad queda fija en 7 días. | `pytest` 55 passed / 2 skipped |
| T037 | Confirmaciones destructivas nombran el objeto: familia al eliminar/abandonar y persona al dar de baja. | `family-actions.test.tsx` y flujos con "Familia Pérez" / "Luis" |
| T038 | El backend normaliza el código a mayúsculas sin espacios ni guiones; el token sigue siendo literal. | `test_invitation_code_is_normalized_on_join` con espacios, guion y minúsculas |
| T039 | Caducidad en singular cuando queda un día ("1 día restante" / "1 day remaining"). | tests de `InviteCode` en web y móvil |
| T040 | Siete claves i18n sin uso eliminadas de `shared/i18n` y del copy deck. | `node scripts/check-shared.mjs` |
| T041 | Aviso legal reformulado: finanzas y presupuestos "en camino", nunca como capacidad actual. | copy es/en revisado; `check-shared` sincronizado |

### Verificación web automatizada (2026-11-26)

La web pasa a tener una puerta automática en Chromium con Playwright (`frontend-web/e2e`,
`pnpm test:e2e`), con backend y base de datos E2E aislados (`docker-compose.e2e.yml`, puerto `8001`,
`kitho_e2e`) y sesión sembrada en `localStorage` (nunca login real con Google).

Cubre, sin sustituir la revisión móvil ni la visual:

- **Escenarios de `quickstart.md` (web)**: 1–4, 9–11, 13, 14, 16–18: tema y persistencia, idioma,
  responsive 320→1440, estados de carga/error/vacío, accesibilidad, bundle sin Recharts, marca,
  sesión expirada, invitación por código (usado/caducado/heredado), moneda regional y
  eliminar/abandonar familia.
- **Puerta de entrada** (`useAuthGuard`): sin sesión, sin perfil, sin familia, con familia, código
  pendiente, sesión persistida sin familia, usuario inexistente (`ghost`) y fallback ante fallo de
  red al validar (escenario 0, FR-034/FR-035/SC-012, UX-17).
- **Accesibilidad**: `axe` (WCAG 2.1 A/AA) en Login, Miembros, Ajustes, Inicio, unirse, crear familia
  y diálogo destructivo; teclado (salto al contenido, Escape con retorno de foco, foco del wizard,
  radios); Lighthouse de accesibilidad `>=95` en Login, Miembros y Ajustes.
- **T029 (web)**: breakpoints 320/375/599/600/768/839/840/1024/1440 sin scroll horizontal y con
  sidebar/rail/tabs según ancho.

**Sigue siendo manual** (no bloquea el código): móvil iOS/Android con Maestro, VoiceOver/TalkBack y
Accessibility Scanner, zoom real al 200 % y la comparación visual del botón oficial de Google
(escenario 15) y de la paridad web/móvil (escenario 12).

### Pendiente de verificación manual

Ninguno de estos puntos bloquea el código; todos requieren navegador, dispositivo/emulador o
cuentas Google reales.

- **T029 (responsive y zoom)**: 375, 768, 1024 y 1440 px en web, iOS y Android en móvil, zoom 200%,
  texto grande y movimiento reducido; confirmar que no hay cards dentro de cards ni más de dos
  líneas por fila en la lista de integrantes (FR-024, FR-028). Registrado como abierto en
  `ux-checklist.md` §4–§5.
- **T030 (recorrido manual)**: ejecutar los escenarios 1–6 de `quickstart.md` en español e inglés
  con cuentas reales y anotar el resultado aquí.
- Confirmar visualmente en tema claro y oscuro el orden de bloques y el contraste de las insignias.
- Medir T1 (llegar a Home), T3 (invitar) y T5 (recuperarse de un error) con la ronda 1 de
  `usability-test.md`.

### Siguiente en el backlog

D1–D5 están decididas (`decision-day-one.md`), así que ya nada de S1 espera producto. UX-03 quedó
resuelto con jerarquía contextual + rol en la invitación (B2 cerrado en código) y UX-02 quedó cerrado
con el enlace de privacidad. **UX-04** (Miembros) es el siguiente trabajo de la opción D, coherente con D4
(solo admin invita) y con el selector de rol que ya vive ahí. UX-05, UX-06, UX-08, UX-09 y UX-10
siguen abiertos. **UX-16** (salida al login desde el ciclo de familia) queda abierto como deuda
explícita de este corte: se cerrará con la acción "Cerrar sesión / Usar otra cuenta" en el ciclo de
familia y en el login, en web y móvil.
