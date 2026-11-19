# Data Model — Ciclo de vida de la familia (B2)

**Fecha**: 2026-11-19
**Alcance**: solo lo que cambia o se fija con B2. Persona, Familia y Membresía existen; se documentan
para trazabilidad de las reglas.

## Persona (existente: `users`)

| Campo | Regla |
| --- | --- |
| Identidad | Cuenta de Google única |
| Nombre visible | 1–80 caracteres; obligatorio para salir del perfil mínimo |
| Foto | Opcional; nunca bloquea el avance |
| Familia | Como máximo una membresía activa (índice único parcial ya existente) |

## Familia (existente: `families`)

| Campo | Regla |
| --- | --- |
| Nombre | 1–120 caracteres, sin espacios sobrantes |
| Moneda | Código de 3 letras válido; inmutable después de crear |
| Estado | `activo`; solo familias activas admiten uniones |
| Integrantes | Máximo 10 membresías activas |

## Membresía (existente: `memberships`)

| Campo | Regla |
| --- | --- |
| Rol familiar | `padre` \| `madre` \| `hijo` \| `hija`; nulo solo en códigos heredados |
| Permiso | Derivado: `padre`/`madre` → administrador; `hijo`/`hija` o nulo → miembro |
| Estado | `activo` \| `inactivo` |
| Inmutabilidad | El rol no se cambia en esta etapa (fuera de alcance) |

**Invariante**: cada familia conserva al menos una membresía activa con permiso de administrador.

## Invitación (existente: `invitations`) — **cambia**

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `family_id` | UUID | Familia activa; la invitación no cruza familias |
| `codigo` | Texto(16) | Único; 8 caracteres sin ambigüedad (sin O/0, I/1); se normaliza a mayúsculas |
| `token` | Texto | Opcional, heredado del enlace; única alternativa al código |
| `generado_por` | UUID | Debe ser administrador activo en el momento de crear |
| `fecha_creacion` | Fecha-hora | Automática |
| `expira_en` | Fecha-hora | Creación + 7 días |
| `usado` | Booleano | Un solo uso; pasa a verdadero al completar la unión |
| `fecha_uso` | Fecha-hora | Nula hasta el uso |
| **`rol_familiar`** | **Enum, nullable** | **Nuevo. `padre` \| `madre` \| `hijo` \| `hija`. Nulo solo en códigos anteriores a B2** |
| **`parentesco`** | **Texto(80), nullable** | **Nuevo. Opcional, informativo; no altera permisos** |

**Índices**: los existentes (`family_id, usado` y `codigo, usado`) se mantienen; no hace falta uno
nuevo porque el acceso sigue siendo por `codigo` o `token`.

**Migración**: una revisión Alembic que añade las dos columnas como nullable. No rellena datos: los
códigos existentes quedan con `rol_familiar = null` (ver R4 en `research.md`). Reversible: elimina
las dos columnas.

## Transiciones de estado

```text
Invitación
  emitida        (usado = false, expira_en futura)
    ├─ usada     (usado = true, fecha_uso, membresía creada con el rol de la invitación)
    ├─ caducada  (expira_en pasada, usado = false)  → no se puede usar
    └─ anulada   → no existe en esta etapa; caducar es la única salida

Unión
  persona sin familia + código válido
    → membresía activa con rol = invitación.rol_familiar
      ├─ padre|madre → permiso administrador
      ├─ hijo|hija   → permiso miembro
      └─ null        → permiso miembro, rol familiar nulo (código heredado)
```

## Reglas de validación (derivadas de la spec)

| Regla | Origen | Respuesta esperada |
| --- | --- | --- |
| Rol obligatorio al crear la invitación | FR-011 | 422 si falta o no es uno de los cuatro |
| Solo administradores crean invitaciones | FR-015 / D4 | 403 |
| Código inexistente | FR-010 | 400 con motivo "no válido" |
| Código usado | FR-010 | 400 con motivo "ya utilizado" |
| Código caducado | FR-010 | 400 con motivo "caducado" |
| Límite de 10 integrantes | FR-010 | 400 con motivo "límite alcanzado" |
| Persona ya en una familia | R2 | 400 |
| Unión simultánea con el mismo código | Edge case | La primera gana; la segunda recibe 400/409 sin dejar estado parcial |
| Rol elegido por quien se une | FR-009/FR-012 | No se acepta: se ignora el campo y manda la invitación |