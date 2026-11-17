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
| estado | Enum('activo','eliminado') | not null, default 'activo' | Soft delete de la familia (FR-014) |
| fecha_eliminacion | DateTime(tz) | nullable | Momento del soft delete (FR-014) |

**Relations**: has many Memberships, has many Invitations.

**Validation**:
- `moneda_local` debe ser un código ISO 4217 de 3 letras (FR-005).
- La moneda es única por grupo y aplica a todos sus registros (Principio III).
- La familia y la membresía `admin` del creador se crean en una sola transacción (FR-005).
- La familia solo puede eliminarse cuando queda 1 miembro activo; el borrado es lógico y
  conserva el historial (FR-013, FR-014).
- Al abandonar el último administrador, la membresía activa con `fecha_union` más antigua recibe
  `role=admin`; ante empate se usa `Membership.id` (FR-017, SC-010).

### Membership

Relación usuario-grupo con rol y estado.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| user_id | UUID FK -> User(id) | not null | Usuario |
| family_id | UUID FK -> Family(id) | not null | Grupo familiar |
| role | Enum('admin','member') | not null, default 'member' | Rol de permiso |
| rol_familiar | Enum('padre','madre','hijo','hija') | nullable | Rol familiar; Padre/Madre reciben `admin` automáticamente (FR-009, FR-012) |
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
- Al crear o unirse, `rol_familiar` Padre/Madre fija `role='admin'`; el resto queda `member`.
- No se permite reactivar automáticamente una membresía inactiva; una nueva unión requiere
  invitación válida.

### Invitation

Código de invitación generado por un admin.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| family_id | UUID FK -> Family(id) | not null | Grupo objetivo |
| codigo | String(16) | unique, not null | Código alfanumérico de 8 caracteres (sin caracteres ambiguos) |
| generado_por | UUID FK -> User(id) | not null | Admin que generó |
| fecha_creacion | DateTime(tz) | not null, default now | Creación |
| expira_en | DateTime(tz) | not null | Expiración fija a 7 días |
| usado | Boolean | not null, default false | Si ya fue usado |
| fecha_uso | DateTime(tz) | nullable | Momento del uso |
| token | String | unique, nullable | Compatibilidad heredada; no se genera ni se expone |

**Constraints**:
- `codigo` único e impredecible; se genera con `secrets.choice` sobre un alfabeto sin ambigüedades.
- `expira_en` se fija a `fecha_creacion + 7 días`.
- Un código sólo puede consumirse una vez; la unión y el marcado `usado=true` ocurren en una sola
  transacción.
- **Índices** en `codigo` (único) y `(family_id, usado)`.

**State transitions**:
- `usado=false` -> `usado=true` al completar una unión válida.
- Un código expirado o usado se rechaza con `400`.

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
- Crear grupo: `nombre` + `moneda_local` + `rol_familiar` (Padre/Madre); creador -> admin (FR-005).
- Unirse sólo por invitación válida mediante código de un solo uso (FR-006).
- Un grupo activo por usuario (FR-007).
- Máx. 10 miembros activos (FR-008).
- Miembro por defecto al unirse + parentesco opcional; Padre/Madre reciben `admin` automáticamente
  y el resto ingresa como `member` (FR-009, FR-012).
- Admin puede generar invitación, promover y expulsar (FR-010).
- Errores: `400` límite/segundo grupo/código inválido; `401` JWT o Google token inválido; `403`
  no admin/sin grupo; `404` miembro inexistente; `422` validación de payload.

## Concurrency and Transaction Notes

- **Crear grupo**: una transacción inserta `Family` y `Membership(admin)`; si falla cualquiera,
  rollback completo.
- **Unirse por invitación**: bloquear la `Family`, contar miembros activos, validar código y crear
  `Membership`/marcar `usado` en la misma transacción.
- **Promover/expulsar**: validar rol admin, pertenencia y reglas de auto-expulsión/último admin
  antes de confirmar.

## Out of Scope (future features)

- Entidades financieras (transacciones, categorías, presupuestos) y sus montos `DECIMAL(12,2)`
  quedan fuera de este feature, pero el modelo respeta la precisión y la moneda por grupo del
  Principio III.
