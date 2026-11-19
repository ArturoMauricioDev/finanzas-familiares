# Decisión — Día 1 de Kitho (puerta B)

**Fecha**: 2026-11-19
**Estado**: D0–D5 decididas (2026-11-19) · B desbloqueada
**Bloquea**: B1 (bienvenida + login con valor + perfil mínimo + contexto crear/unirse) — **desbloqueada**.
**B2** (rol declarado en la invitación) depende de la migración descrita en D2.
**No bloquea**: C (Home hub), ya implementado.

Este documento existe porque B es 70% decisiones de producto y copy. Programarlo antes de
resolverlas significa escribirlo dos veces.

## Cómo se registran las decisiones

1. Se responden en el chat, una línea por decisión (`D2: ...`), o se eligen en el cuestionario.
2. El agente las escribe aquí: `☒` en la opción elegida, `☐` en el resto, con sus consecuencias.
3. Una sola opción marcada por decisión. Si algo cambia después, se reescribe la sección y se
   actualiza la fecha de estado.

No hace falta editar el archivo a mano ni marcar con `x`: con responder la decisión basta.

---

## D0 · Alcance y contrato de entrada ✅ DECIDIDA

**Alcance de esta etapa**: el producto se centra en el **ciclo de vida de la familia**
(entrar → identidad → perfil → crear o unirse → invitar → Home). **Las finanzas se desarrollan
después** (spec 004). No se prometen ni se simulan en esta etapa; se anuncian como "en camino".

**Contrato de entrada** (misma regla en web y móvil):

```
Primera vez en la app (sin sesión)
  → Bienvenida / Login
  → Perfil mínimo (solo si falta)
  → Ciclo de familia: elegir | crear | unirse con código
  → Home

Con sesión y SIN familia
  → Ciclo de familia (elegir | crear | unirse)
  → Nunca Home

Con sesión y CON familia
  → Home
  → Home es el hub: estado de la familia, checklist, invitar
  → La sección financiera vivirá aquí cuando exista la spec 004
```

En una frase: **quien todavía no tiene familia siempre pasa por el ciclo de familia; quien ya la
tiene va directo a Home.** Home es hoy el hub de la familia; en el futuro alojará la parte
financiera sin cambiar la regla de entrada.

**Ya implementado**: `useAuthGuard` en web y móvil aplica exactamente esta regla
(`needs_profile_setup` → perfil; `needs_family_setup` → select/create/invite; resto → página
solicitada, y `/` es Home). Lo que falta de B es la **capa de valor y copy** de esas pantallas, no
la lógica de navegación.

**Decisión**: ☒ Ciclo de familia primero, finanzas después · ☐ Otra

---

## D1 · Qué promete Kitho en la primera pantalla ✅ DECIDIDA (A)

La Constitución define Kitho como app de finanzas familiares, pero el backend actual solo tiene
identidad, familia e invitaciones. La bienvenida no puede prometer lo que no existe.

| Opción | Copy de bienvenida | Coste | Riesgo |
| --- | --- | --- | --- |
| **A. Organización primero** | "El lugar de tu familia para organizarse. Finanzas y presupuestos, en camino." | 0 | Ninguno: es verdad |
| B. Finanzas primero | "Controla las finanzas de tu familia" | Spec 004 + modelo + migraciones (2–3 semanas) | Alto si se lanza sin datos |
| C. Promesa amplia sin aclarar | "Tareas y finanzas familiares" | 0 | Promesa rota en la primera sesión |

**Decisión**: ☒ A · ☐ B · ☐ C

**Consecuencias aplicadas**:

- La bienvenida y el login hablan de **organizar a la familia** y mencionan las finanzas como
  "en camino", nunca como función disponible.
- Home conserva la tarjeta "Finanzas en camino" (ya implementada). Es la única mención financiera
  hasta la spec 004.
- Cuando exista la spec 004, la bienvenida y el login se actualizan en el mismo cambio que activa
  los datos financieros, no antes.

---

## D2 · Rol familiar y parentesco ✅ DECIDIDA (rol declarado al invitar)

**Modelo acordado**:

- Quien **crea** la familia queda como **administrador** y elige su rol: `padre` o `madre`.
- Quien **invita** declara el rol de la persona invitada en el propio código: `padre`, `madre`,
  `hijo` o `hija`.
- **Solo `padre` y `madre` son administradores**; `hijo`/`hija` entran como miembros.
- Quien se une **no elige rol**: lo recibe del código. El camino crítico de quien se une queda sin
  campos de modelo.

**Evidencia**: `backend/app/models/membership.py:21-26` ya tiene el enum completo y
`backend/app/services/invitation_service.py:151-156` ya deriva `admin` para padre/madre.
`backend/app/schemas/invitation.py:23-24` hoy acepta rol/parentesco **del que se une**: hay que
**invertir el origen** (del que invita hacia quien se une).

**Trabajo que implica** (no es coste 0):

| Cambio | Dónde | Coste |
| --- | --- | --- |
| `rol_familiar` y `parentesco` en el código de invitación | `CreateInvitationRequest`, tabla `invitations`, migración Alembic (columnas nullable) | ~0,5 día |
| Al unirse, tomar el rol del código e ignorar el del cuerpo | `join_invitation` | incluido arriba |
| Selector de rol (4 opciones) + parentesco opcional al invitar; quitar ambos campos al unirse | web + móvil + i18n es/en | ~1 día |
| Tests: padre/madre → admin, hijo/hija → member, código heredado sin rol | backend + web | incluido arriba |

**Parentesco**: se mantiene **opcional y fuera del Día 1**. La relación visible es `rol_familiar`;
si no hay parentesco, la fila muestra "Miembro" y nunca "Sin nombre" (UX-05).

**Compatibilidad**: los códigos emitidos antes de este cambio entran como `member` con
`rol_familiar: null`.

**Puerta de proceso**: B2 cambia modelo de datos y contrato de API, así que **no se implementa sin
`specs/003-ux-audit/spec.md`** (Constitución VI, cero código sombra). El `spec.md` cubre el ciclo de
familia completo: B1 ya implementado + B2.

**Decisión**: ☒ Rol declarado por quien invita (padre/madre administradores) · ☐ Quitar en unirse
sin cambiar backend · ☐ Nuevo endpoint `PATCH /families/me/membership`

---

## D3 · Moneda ✅ DECIDIDA (aceptar copy)

La Constitución fija una moneda única al crear la familia. B debe explicarlo **antes** de crear,
no en un mensaje de error.

Copy aprobado: "La moneda se elige al crear la familia y se aplica a todos sus registros. No se
puede cambiar después."

**Decisión**: ☒ Aceptar copy · ☐ Permitir cambio posterior (requiere spec y backend)

---

## D4 · Quién puede invitar ✅ DECIDIDA (solo admin)

Hoy: solo administradores (`members.tsx:302` en móvil y equivalente web). Un miembro no-admin no
ve nada.

**Decisión**: ☒ Solo admin · ☐ Todos pueden invitar

**Consecuencias**: se añade copy explicativo para no-admin (UX-04) que indique quién puede invitar
y por qué. Coherente con D2: `padre`/`madre` son admin, `hijo`/`hija` no. Se revisa tras la ronda 1
de usabilidad.

---

## D5 · Métricas ✅ DECIDIDA (Umami self-hosted)

B es donde nace el embudo. Sin sumidero, la línea base no existe.

**Decisión**: ☒ Umami self-hosted · ☐ Endpoint propio · ☐ Solo pruebas por ahora

**Consecuencias**: 1 contenedor junto al backend, sin cookies. Los eventos ya están definidos en
`specs/003-ux-audit/metrics.md`; el contenedor no bloquea el código de B, solo su medición.

---

## D6 · Límites de B (anti-retrabajo)

**B incluye**: bienvenida, login con valor y confianza, perfil mínimo, elección crear/unirse con
consecuencias, copy de rol/moneda/invitación.

**B se entrega en dos cortes** (el primero no toca backend):

- **B1 — visible en 3–5 días, riesgo bajo**: bienvenida, login con valor, perfil mínimo, jerarquía
  crear/unirse, copy de moneda, copy de invitación, quitar rol/parentesco del formulario de unirse.
  Solo web/móvil + i18n.
- **B2 — inmediatamente después**: rol declarado en el código de invitación (padre/madre/hijo/hija),
  migración de `invitations`, `join_invitation` heredando el rol, selector en la pantalla de invitar,
  tests de admin/member. Es el trabajo de D2 descrito arriba.

**B excluye**:
- Contenido de Home → propiedad de C (ya hecho).
- Jerarquía de Miembros y Ajustes → opción D.
- Cualquier función financiera → spec 004.
- Nuevos tokens, paletas o tipografías.
- Cambiar la regla de navegación de D0: ya está implementada y B no la toca.

---

## Puerta de entrada a B

- [x] D0 decidida (alcance: ciclo de familia primero; contrato de entrada)
- [x] D1 decidida (promesa: organización primero)
- [x] D2 decidida (rol declarado por quien invita; padre/madre admin)
- [x] D3 aceptada (copy de moneda)
- [x] D4 decidida (solo admin invita)
- [x] D5 decidida (Umami self-hosted) — puede implementarse después
- [ ] Ronda 1 de usabilidad hecha (T1, T3, T5) según `usability-test.md`
- [ ] Copy deck es/en de las 5 pantallas de B aprobado — escrito en `copy-deck-b.md`; falta tu visto bueno
- [ ] Matriz de estados de B completa (incluye 409 código usado/expirado)
- [ ] C en producción ≥1 semana con línea base de activación
- [x] Cero S1 abiertos salvo los que B resuelve (UX-01 y UX-07 cerrados; UX-02/UX-03 son B)

## Decisiones registradas (2026-11-19)

```
D0: ciclo de familia primero, finanzas después (spec 004)
D1: promesa de organización; finanzas "en camino"
D2: rol declarado por quien invita · padre/madre = admin · hijo/hija = member
D3: aceptar copy de moneda única
D4: solo admin invita
D5: Umami self-hosted
```

Nada queda pendiente de producto para empezar B. Lo que falta son verificaciones (usabilidad,
copy deck, matriz de estados), no decisiones.
