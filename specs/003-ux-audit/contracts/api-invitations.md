# Contrato — Invitaciones (B2)

**Base**: `/api/v1`
**Autenticación**: token de la persona autenticada (cabecera `Authorization: Bearer`).
**Cambio de esta feature**: el rol de la persona invitada se declara al **crear** el código y deja de
aceptarse al **unirse**.

---

## 1. Crear invitación

`POST /families/me/invitations`

**Quién**: solo una membresía activa con permiso de administrador (D4). Cualquier otra → `403`.

**Cuerpo**

```json
{
  "rol_familiar": "otro",
  "parentesco": "Cuñada"
}
```

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `rol_familiar` | `padre` \| `madre` \| `hijo` \| `hija` \| `tio` \| `abuelo` \| `otro` | **Sí** | Fuera del conjunto → `422` |
| `parentesco` | texto 1–80 | Solo si `rol_familiar = otro` | Obligatorio y no vacío con `otro`; prohibido con cualquier otro rol → `422` |
| `expira_en_horas` | — | — | **Retirado**: la caducidad es fija de 7 días (FR-010); si un cliente antiguo lo envía, se ignora |

**Regla de validación** (Pydantic `model_validator` + servicio):

```text
rol_familiar = otro  →  parentesco obligatorio (1–80, sin espacios sobrantes)
rol_familiar ≠ otro  →  parentesco ausente o nulo
```

**Respuesta `201`**

```json
{
  "invitation_id": "0f1e...",
  "codigo": "ABCD2345",
  "rol_familiar": "otro",
  "parentesco": "Cuñada",
  "expira_en": "2026-11-27T12:00:00Z",
  "usado": false
}
```

`rol_familiar` y `parentesco` viajan en la respuesta para que la interfaz muestre para quién es el
código sin una segunda consulta; `parentesco` es `null` salvo en **Otro**.

**Errores**: `403` no administrador · `404` familia inexistente o inactiva · `422` rol inválido o
vínculo incoherente · `500` no se pudo generar el código.

---

## 2. Unirse con código

`POST /invitations/join`

**Quién**: persona autenticada **sin** membresía activa. Con familia → `400`. El cliente solo llega
aquí con sesión: la puerta de entrada (FR-034/FR-035) conserva el código pendiente a través del login
y evita que esta pantalla se muestre sin sesión.

**Cuerpo (después del cambio)**

```json
{ "codigo": "ABCD2345" }
```

o, si llega un enlace heredado:

```json
{ "token": "..." }
```

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `codigo` | texto 1–32 | Uno de los dos | Se normaliza (mayúsculas, sin espacios/guiones) |
| `token` | texto | Uno de los dos | Alternativa al código |
| ~~`rol_familiar`~~ | — | — | **Eliminado**: se ignora si un cliente antiguo lo envía |
| ~~`parentesco`~~ | — | — | **Eliminado**: el parentesco viene de la invitación |

**Respuesta `200`**

```json
{
  "family_id": "7c...",
  "role": "admin",
  "rol_familiar": "madre",
  "estado": "activo",
  "tokens": { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
}
```

`role` se deriva del rol de la invitación: `padre`/`madre` → `admin`;
`hijo`/`hija`/`tio`/`abuelo`/`otro` → `member`. `rol_familiar` en la respuesta es el aplicado
(`null` en códigos heredados); `parentesco` viaja en la membresía solo cuando el rol es **Otro**.

**Errores**

| Caso | Código | Mensaje de interfaz |
| --- | --- | --- |
| Código no válido | `400` | `errors.details.invalidInvitationCode` |
| Código ya usado | `400` | `errors.details.invitationCodeUsed` |
| Código caducado | `400` | `errors.details.invitationCodeExpired` |
| Familia inactiva/inexistente | `400` | `errors.details.invitationFamilyNotFound` |
| Límite de 10 integrantes | `400` | `errors.details.memberLimit` |
| Ya pertenece a una familia | `400` | `errors.details.userAlreadyInFamily` |
| Conflicto de concurrencia | `409` | `errors.details.invitationConflict` |

**Concurrencia**: la invitación se bloquea para actualización antes de crear la membresía; dos
uniones simultáneas con el mismo código no pueden crear dos membresías válidas (índice único de
membresía activa por persona + bloqueo de la invitación).

---

## 3. Consultar una invitación

`GET /families/me/invitations/{invitation_id}`

**Quién**: solo una membresía activa con permiso de administrador (D4). Cualquier otra → `403`.
**Para qué**: que la pantalla de invitación sepa si el código guardado ya fue aceptado y deje de
mostrarlo (FR-045), sin exponer un listado de invitaciones.

**Respuesta `200`**: el mismo cuerpo que la creación (`InvitationResponse`), con `usado` en `true`
cuando la invitación ya se consumió.

**Errores**: `403` no administrador · `404` invitación inexistente o de otra familia · `422` id con
formato inválido.

---

## 4. Mostrar el código en la interfaz

La pantalla de invitación usa la respuesta de creación (código, rol, caducidad) y la lista de
miembros muestra el rol aplicado. Para que un código ya aceptado deje de mostrarse (FR-045), la
pantalla vuelve a consultar su estado con el endpoint de §3 al entrar; un código usado se oculta y se
ofrece generar otro. No se expone un listado de invitaciones.

**Copy requerido** (`shared/i18n/{es,en}.json`):

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.inviteRoleLabel` | Rol de la persona que invitas | Role of the person you invite |
| `family.inviteRoleHint` | Padre y madre administran la familia; el resto entra como miembro. | Father and mother administer the family; everyone else joins as a member. |
| `family.invitationFor` | Invitación para: {role} | Invitation for: {role} |
| `family.invitationExpires` | Caduca el {date} · {days} días restantes | Expires on {date} · {days} days remaining |
| `family.invitationExpiresOne` | Caduca el {date} · 1 día restante | Expires on {date} · 1 day remaining |
| `family.inviteKinshipLabel` | Vínculo familiar | Family relationship |
| `family.inviteKinshipHint` | Cuéntanos cómo se relaciona con la familia. | Tell us how they are related to the family. |
| `family.inviteKinshipRequired` | Indica el vínculo familiar para continuar. | Enter the family relationship to continue. |
| `family.createFamily` | Crear familia | Create family |
| `dashboard.checkInvite` | Agregar integrantes a tu familia | Add members to your family |

El selector no muestra jerga de modelo: usa `family.familyRolePadre|Madre|Hijo|Hija|Tio|Abuelo|Otro`.
El campo de vínculo solo existe visualmente cuando el rol es **Otro**; con otro rol no se renderiza ni
se envía.