# Data Model: Autenticación, Registro y Gestión de Grupos Familiares

**Feature**: 001-autenticacion-y-grupos  
**Date**: 2026-10-29

## Entities

### User

Representa un usuario autenticado vía Google.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador interno |
| google_id | String | unique, not null | ID único de Google (`sub`) |
| email | String | unique, not null | Email de Google |
| nombre_visualizacion | String | nullable; no vacío si se define | Configurado en primer ingreso (FR-003) |
| foto_avatar | String (URL) | nullable; no vacío si se define | URL/avatar configurado (FR-003) |
| fecha_creacion | DateTime(tz) | not null, default now | Fecha de creación |

**Relations**: has many Memberships.

**Validation**:
- `google_id` y `email` son obligatorios y únicos.
- Un perfil se considera completo sólo si `nombre_visualizacion` y `foto_avatar` existen y no están
  vacíos.

### Family

Núcleo familiar.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| nombre | String | not null; no vacío | Nombre de la familia |
| moneda_local | String(3) | not null; ISO 4217 | Código de moneda (ej. MXN, COP) |
| creado_por | UUID FK -> User(id) | not null | Creador del grupo |
| fecha_creacion | DateTime(tz) | not null, default now | Fecha creación |

**Relations**: has many Memberships, has many Invitations.

**Validation**:
- `moneda_local` debe ser un código ISO 4217 de 3 letras (FR-005).
- La moneda es única por grupo y aplica a todos sus registros (Principio III).
- La familia y la membresía `admin` del creador se crean en una sola transacción (FR-005).

### Membership

Relación usuario-grupo con rol y estado.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| user_id | UUID FK -> User(id) | not null | Usuario |
| family_id | UUID FK -> Family(id) | not null | Grupo familiar |
| role | Enum('admin','member') | not null, default 'member' | Rol |
| parentesco | String | nullable | Etiqueta opcional (FR-009) |
| estado | Enum('activo','inactivo') | not null, default 'activo' | Estado para conteo/límite |
| fecha_union | DateTime(tz) | not null, default now | Fecha de unión |

**Constraints**:
- **Un usuario sólo puede tener una Membership activa a la vez** (FR-007). Reforzar con índice
  único parcial: `UNIQUE (user_id) WHERE estado = 'activo'`.
- **Máximo 10 miembros activos por grupo** (FR-008): validar y contar dentro de la transacción,
  con bloqueo de la fila de `Family` para evitar carreras.
- **Índice** en `(family_id, estado)` para el conteo y listado de miembros.
- Un admin no puede expulsarse a sí mismo ni dejar al grupo sin administradores (FR-010).

**State transitions**:
- `activo` -> `inactivo` (expulsión/baja por admin).
- `member` -> `admin` (promoción por admin).
- No se permite reactivar automáticamente una membresía inactiva; una nueva unión requiere
  invitación válida.

### Invitation

Enlace de invitación generado por un admin.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| family_id | UUID FK -> Family(id) | not null | Grupo objetivo |
| token | String | unique, not null | Token seguro para enlace |
| generado_por | UUID FK -> User(id) | not null | Admin que generó |
| fecha_creacion | DateTime(tz) | not null, default now | Creación |
| expira_en | DateTime(tz) | not null | Expiración |
| usado | Boolean | not null, default false | Si ya fue usado |

**Constraints**:
- `token` único e impredecible (`secrets.token_urlsafe(32)`).
- `expira_en` debe ser posterior a `fecha_creacion`; `expira_en_horas` acotado (1–720).
- Un token sólo puede consumirse una vez; la unión y el marcado `usado=true` ocurren en una sola
  transacción.
- **Índices** en `token` (único) y `(family_id, usado)`.

**State transitions**:
- `usado=false` -> `usado=true` al completar una unión válida.
- Un token expirado o usado se rechaza con `400`.

## Relationships

```text
User 1 ──< Membership >── 1 Family
User 1 ──< Invitation (generado_por)
Family 1 ──< Invitation
Family 1 ──< Membership
```

## Validation Rules (from requirements)

- Autenticación exclusiva con Google y verificación estricta del token (FR-001).
- JWT propio con claims `user_id`, `family_id`, `role` (FR-002).
- Perfil obligatorio si primer ingreso o perfil incompleto (FR-003).
- Sin grupo -> forzar elección crear/unirse (FR-004).
- Crear grupo: `nombre` + `moneda_local`, creador -> admin (FR-005).
- Unirse sólo por invitación válida (FR-006).
- Un grupo activo por usuario (FR-007).
- Máx. 10 miembros activos (FR-008).
- Miembro por defecto al unirse + parentesco opcional (FR-009).
- Admin puede generar invitación, promover y expulsar (FR-010).
- Errores: `400` límite/segundo grupo/token inválido; `401` JWT o Google token inválido; `403`
  no admin/sin grupo; `404` miembro inexistente; `422` validación de payload.

## Concurrency and Transaction Notes

- **Crear grupo**: una transacción inserta `Family` y `Membership(admin)`; si falla cualquiera,
  rollback completo.
- **Unirse por invitación**: bloquear la `Family`, contar miembros activos, validar token y crear
  `Membership`/marcar `usado` en la misma transacción.
- **Promover/expulsar**: validar rol admin, pertenencia y reglas de auto-expulsión/último admin
  antes de confirmar.

## Out of Scope (future features)

- Entidades financieras (transacciones, categorías, presupuestos) y sus montos `DECIMAL(12,2)`
  quedan fuera de este feature, pero el modelo respeta la precisión y la moneda por grupo del
  Principio III.
