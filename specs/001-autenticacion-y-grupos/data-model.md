# Data Model: Autenticación, Registro y Gestión de Grupos Familiares

**Feature**: 001-auth-family-groups  
**Date**: 2026-10-27

## Entities

### User
Representa usuario autenticado vía Google.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador interno |
| google_id | String | unique, not null | ID único de Google |
| email | String | unique, not null | Email de Google |
| nombre_visualizacion | String | nullable | Configurado en primer ingreso (FR-003) |
| foto_avatar | String (URL) | nullable | URL/avatar configurado (FR-003) |
| fecha_creacion | DateTime(tz) | not null, default now | Fecha de creación |

**Relations**: has many Memberships.

### Family
Núcleo familiar.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| nombre | String | not null | Nombre de la familia |
| moneda_local | String(3) | not null | Código ISO 4217 (ej. MXN, COP) |
| creado_por | UUID FK -> User(id) | not null | Creador del grupo |
| fecha_creacion | DateTime(tz) | not null, default now | Fecha creación |

**Relations**: has many Memberships, has many Invitations.

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
- Un usuario solo puede tener una Membership activa a la vez (aplicar validación). 
- Conteo: `COUNT(*)` donde `family_id=X AND estado='activo' <= 10`.

### Invitation
Enlace de invitación generado por admin.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID (PK) | not null | Identificador |
| family_id | UUID FK -> Family(id) | not null | Grupo objetivo |
| token | String | unique, not null | Token seguro para enlace |
| generado_por | UUID FK -> User(id) | not null | Admin que generó |
| fecha_creacion | DateTime(tz) | not null, default now | Creación |
| expira_en | DateTime(tz) | not null | Expiración |
| usado | Boolean | not null, default false | Si ya fue usado |

## Validations (from requirements)
- Google auth exclusivo (FR-001)
- JWT propio con claims (user_id, family_id, role) (FR-002)
- Perfil obligatorio si primer ingreso (FR-003)
- Sin grupo -> forzar elección crear/unirse (FR-004)
- Crear grupo: nombre + moneda_local, creador -> admin (FR-005)
- Unirse solo por invitación (FR-006)
- 1 grupo activo por usuario (FR-007)
- Máx 10 miembros activos (FR-008)
- Miembro por defecto al unirse + parentesco opcional (FR-009)
- Admin puede generar invitación, promover, expulsar (FR-010)
- Errores: 400 si límite alcanzado/segundo grupo; 401 si JWT inválido/ausente; 403 si no admin

## State Notes
- "Cierre Mensual" (solo lectura) se aplica a transacciones de meses pasados - fuera del alcance de este feature pero se mantiene en mente por constitución.
- Moneda única por grupo (Principio III).
- Precisión DECIMAL para montos en entidades financieras futuras (Principio III).
