# Research — B2: rol declarado en la invitación

**Fecha**: 2026-11-19
**Fuente**: `spec.md` (FR-009 a FR-015), `decision-day-one.md` D2/D4, código actual de invitaciones.

No quedan `NEEDS CLARIFICATION`. Cada decisión se resolvió con evidencia del repositorio.

## R1 · Dónde se guarda el rol de la persona invitada

**Decisión**: en la propia invitación (dos columnas nullable: rol familiar y parentesco).

**Rationale**: el código ya es la unidad de verdad del proceso (un solo uso, 7 días, familia
asociada). Guardar ahí el rol evita un estado intermedio que habría que limpiar si el código caduca
o se emite varias veces. Además mantiene una sola consulta al unirse.

**Alternativas consideradas**:

- *Tabla de "miembros pendientes"*: añade una entidad, un ciclo de vida paralelo y limpieza de
  huérfanos. Rechazada por coste.
- *Rol en el cuerpo de la petición de unión*: es el estado actual; permite que quien se une se
  autoasigne administrador. Rechazada por seguridad (FR-009/FR-012).

## R2 · Qué pasa con el rol en el contrato de unión

**Decisión**: se elimina del cuerpo de la petición de unión. El backend lo toma de la invitación y
no acepta otro.

**Rationale**: una sola fuente de verdad; Pydantic ignora campos extra por defecto, así que una
versión antigua de la app que aún envíe rol no rompe, simplemente no se usa.

**Alternativas consideradas**:

- *Mantenerlo opcional como "preferencia"*: crea dos fuentes y una regla de precedencia que nadie
  recuerda. Rechazada.
- *Devolver error si llega rol*: rompe clientes en vuelo sin beneficio. Rechazada.

## R3 · Valor por defecto del selector al invitar

**Decisión**: `hijo` (menor privilegio). El selector siempre tiene un valor; el texto explica que
padre y madre administran.

**Rationale**: un default administrador convierte un descuido en una escalada de permisos. Con
`hijo`, el error por omisión es reversible por un administrador existente (futuro), mientras que un
admin accidental ya no puede quitarse en esta etapa (roles inmutables).

**Alternativas consideradas**:

- *Sin selección inicial (obligar a elegir)*: válido, pero añade un estado inválido y un error más
  por resolver. Se puede endurecer después sin cambiar el modelo.
- *Default `padre`*: maximiza el riesgo de la acción por omisión. Rechazada.

## R4 · Códigos emitidos antes del cambio

**Decisión**: se unen como miembros con rol familiar nulo; la lista los muestra como "Miembro".

**Rationale**: FR-014 lo exige y evita inferir un rol que nadie declaró. Un código heredado nunca
puede conceder administración.

**Alternativas consideradas**:

- *Marcar los códigos heredados como inválidos*: rompe invitaciones en circulación sin necesidad.
- *Pedir el rol al unirse solo cuando el código no lo trae*: reintroduce el campo que FR-009 prohíbe.

## R5 · Dónde vive la regla "padre/madre = administrador"

**Decisión**: en el servicio que completa la unión, derivada del rol de la invitación.

**Rationale**: el backend ya es autoridad de permisos (Principio V) y hoy existe la misma derivación
en `invitation_service.join_invitation`. Se conserva un único punto, ahora alimentado por la
invitación.

**Alternativas consideradas**:

- *Calcular el permiso en el frontend*: permitiría bypass y duplicaría la regla. Rechazada.
- *Guardar el permiso en la invitación*: dos campos que pueden contradecirse. Rechazada.

## R6 · Parentesco

**Decisión**: opcional, guardado con la invitación, nunca obligatorio y sin uso en la lista de
miembros durante esta etapa.

**Rationale**: D2 lo dejó fuera del Día 1; el dato se conserva para no perder lo que el usuario
escriba, pero la relación visible sigue siendo el rol familiar (UX-05).

## R7 · Impacto en B1 ya implementado

**Decisión**: no se reabre B1. La pantalla de unirse ya tiene un solo campo y las pruebas de flujo
ya esperan solo `codigo`; B2 solo añade el origen del rol.

**Rationale**: evita retrabajo y conserva la línea base de evidencia (typecheck, lint y tests en
verde en ambos frontends).