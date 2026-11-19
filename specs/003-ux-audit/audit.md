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

Actualizado: 2026-11-19. Solo se marca lo que está implementado y verificado; el resto del backlog
sigue abierto.

### Implementado

| ID | Qué se hizo | Archivos | Verificación |
| --- | --- | --- | --- |
| UX-01 | Home hub en web y móvil: saludo, familia, moneda, integrantes, checklist de 3 pasos con `progressbar`, CTA de invitación, tarjeta "Finanzas en camino" y acciones rápidas. Sin redirect. | `frontend-web/app/(app)/page.tsx`, `frontend-mobile/app/(app)/(tabs)/index.tsx`, `shared/i18n/{es,en}.json` (`dashboard.*`) | Render de Home + ausencia de `router.replace` en `frontend-web/__tests__/flows.test.tsx`; typecheck y lint en verde |
| UX-07 | `ErrorMessage` acepta acción opcional; "Reintentar" conectado en Home y en Miembros (web + móvil). | `frontend-web/components/ui/InlineBanner.tsx`, `frontend-mobile/components/ui/InlineBanner.tsx`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx` | Prueba de reintento con segunda respuesta exitosa (web) y prueba del componente (móvil y web) |
| B1 | Promesa de organización (no finanzas), 3 puntos de valor y nota de confianza en login; copy de perfil mínimo; jerarquía y consecuencias en crear/unirse; consecuencia de moneda antes de crear; formulario de unirse reducido a un campo (sin rol ni parentesco). | `shared/i18n/{es,en}.json`, `frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(onboarding)/{invite,family/create,family/select}/page.tsx`, `frontend-mobile/app/(auth)/auth/login.tsx`, `frontend-mobile/app/(onboarding)/{invite/index,family/create,family/select}.tsx`, `specs/003-ux-audit/copy-deck-b.md` | `check-shared` sincronizado; typecheck, lint y tests en verde en web (127) y móvil (128); pruebas de flujo actualizadas (unirse envía solo `codigo`) |
| B2 | Rol declarado en la invitación: columnas `rol_familiar`/`parentesco` en `invitations`, el rol de la membresía se deriva de la invitación al unirse, selector de rol (inicio en `hijo`) y parentesco opcional al invitar, "Invitación para: …" en el código, aviso explicado para quien no administra, y jerarquía contextual de `family/select` (con código → unirme; sin código → crear) con guard que devuelve a Home a quien ya tiene familia. | `backend/app/models/invitation.py`, `backend/alembic/versions/005_invitation_family_role.py`, `backend/app/schemas/invitation.py`, `backend/app/services/invitation_service.py`, `backend/tests/test_invitations.py`, `frontend-{web,mobile}/lib/api.ts`, `frontend-{web,mobile}/lib/types.ts`, `frontend-web/app/(onboarding)/family/select/page.tsx`, `frontend-mobile/app/(onboarding)/family/select.tsx`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, `frontend-{web,mobile}/components/family/InviteCode.tsx`, `frontend-{web,mobile}/hooks/useAuthGuard.ts`, `shared/i18n/{es,en}.json`, `specs/003-ux-audit/copy-deck-b.md` | Backend 55 passed / 2 skipped (rol heredado, rol del cuerpo ignorado, código heredado → `member`, `422` sin rol, `403` no admin); migración `005` aplicada y revertida (`downgrade -1` + `upgrade head`); web 127 tests, móvil 128 (jerarquía contextual, selector, no-admin, `jest-axe`); `check-ui` 105 archivos; `check-shared` sincronizado |

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
siguen abiertos.
