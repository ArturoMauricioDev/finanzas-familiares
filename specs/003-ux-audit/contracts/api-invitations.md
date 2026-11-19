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
  "rol_familiar": "madre",
  "parentesco": "tía"
}
```

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `rol_familiar` | `padre` \| `madre` \| `hijo` \| `hija` | **Sí (nuevo)** | Fuera del conjunto → `422` |
| `parentesco` | texto ≤ 80 | No | Informativo; no altera permisos |
| `expira_en_horas` | — | — | **Retirado**: la caducidad es fija de 7 días (FR-010); si un cliente antiguo lo envía, se ignora |

**Respuesta `201`**

```json
{
  "invitation_id": "0f1e...",
  "codigo": "ABCD2345",
  "rol_familiar": "madre",
  "parentesco": "tía",
  "expira_en": "2026-11-26T12:00:00Z",
  "usado": false
}
```

`rol_familiar` y `parentesco` se añaden a la respuesta para que la interfaz pueda mostrar para quién
es el código sin una segunda consulta.

**Errores**: `403` no administrador · `404` familia inexistente o inactiva · `422` rol inválido ·
`500` no se pudo generar el código.

---

## 2. Unirse con código

`POST /invitations/join`

**Quién**: persona autenticada **sin** membresía activa. Con familia → `400`.

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

`role` se deriva del rol de la invitación: `padre`/`madre` → `admin`; `hijo`/`hija` → `member`.
`rol_familiar` en la respuesta es el aplicado (nuevo; `null` en códigos heredados).

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

## 3. Mostrar el código en la interfaz

No hay endpoint nuevo: la pantalla de invitación usa la respuesta de creación (código, rol,
caducidad) y la lista de miembros muestra el rol aplicado.

**Copy requerido** (`shared/i18n/{es,en}.json`):

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.inviteRoleLabel` | Rol de la persona que invitas | Role of the person you invite |
| `family.inviteRoleHint` | Padre y madre administran la familia; hijo e hija entran como miembros. | Father and mother administer the family; son and daughter join as members. |
| `family.invitationFor` | Invitación para: {role} | Invitation for: {role} |
| `family.invitationExpires` | Caduca el {date} · {days} días restantes | Expires on {date} · {days} days remaining |
| `family.invitationExpiresOne` | Caduca el {date} · 1 día restante | Expires on {date} · 1 day remaining |
| `family.inviteKinshipLabel` | Vínculo familiar (opcional) | Family relationship (optional) |

El selector no muestra jerga de modelo: usa `family.familyRolePadre|Madre|Hijo|Hija` ya existentes.