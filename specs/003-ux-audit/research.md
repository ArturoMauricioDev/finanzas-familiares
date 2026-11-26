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

## R6 · Parentesco / vínculo familiar

**Decisión (actualizada 2026-11-20)**: el **vínculo familiar** solo se muestra y se exige cuando el
rol elegido es **Otro**; con cualquier otro rol se oculta y se envía como `null`. Sigue sin usarse
como etiqueta principal en la lista de miembros.

**Rationale**: quien invita ya declara la relación mediante el rol (tío, abuelo, etc.); pedir además
un texto libre en todos los casos duplica el dato y añade fricción. Solo **Otro** necesita
precisión adicional. El backend valida la regla para que no dependa del cliente.

**Alternativas consideradas**:

- *Mantenerlo siempre opcional*: no cumple la decisión de producto de ocultarlo y deja datos
  inconsistentes.
- *Hacerlo obligatorio siempre*: contradice la calidez del flujo y obliga a escribir lo que el rol
  ya dice.

## R7 · Impacto en B1 ya implementado

**Decisión**: no se reabre B1. La pantalla de unirse ya tiene un solo campo y las pruebas de flujo
ya esperan solo `codigo`; B2 solo añade el origen del rol.

**Rationale**: evita retrabajo y conserva la línea base de evidencia (typecheck, lint y tests en
verde en ambos frontends).
## R8 · Catálogo ampliado de roles familiares

**Decisión (2026-11-20)**: el rol familiar pasa de `padre|madre|hijo|hija` a
`padre|madre|hijo|hija|tio|abuelo|otro`. Padre y madre conservan el permiso de administrador; hijo,
hija, tío, abuelo y otro entran como miembros.

**Rationale**: la familia real incluye tíos y abuelos, y el producto debe nombrarlos sin obligar a
inventar un texto libre. El permiso se mantiene en el backend y sigue la regla constitucional
(Padre/Madre = administrador), sin abrir administración a roles que no la tenían.

**Alternativas consideradas**:

- *Solo añadir «Otro» y escribir el vínculo*: obliga a texto libre para relaciones comunes (tío,
  abuelo) y pierde la posibilidad de mostrarlas de forma consistente.
- *Dar administración a tío/abuelo*: contradice la Constitución y la decisión D2.
- *Guardar en `parentesco` sin ampliar el enum*: mezcla dos conceptos y rompe el contrato de rol que
  viaja con el código.

**Implementación**: ampliar `FamilyRoleEnum` en el modelo, añadir una migración Alembic con
`ALTER TYPE familyroleenum ADD VALUE` (bloque `autocommit` de Alembic) y actualizar el tipo
`FamilyRole` de ambos frontends. PostgreSQL no permite eliminar valores de enum con facilidad: el
`downgrade` documenta la limitación y deja los valores añadidos.

## R9 · Validación condicional del vínculo familiar

**Decisión**: `parentesco` es obligatorio si y solo si `rol_familiar == otro`; en el resto de roles
debe llegar nulo o ausente. La regla se valida en Pydantic (`model_validator`) y en el servicio antes
de persistir; el frontend la refleja ocultando el campo.

**Rationale**: el backend es la autoridad (Principio V) y no debe aceptar datos incoherentes. Un
cliente manipulado no puede guardar un vínculo con rol Hijo ni dejar Otro sin vínculo. Web y móvil
se liberan en lockstep en esta etapa (pre-release), así que la validación estricta no rompe clientes
en producción; si en el futuro hubiera versiones antiguas, se evaluaría ignorar en vez de rechazar.

**Alternativas consideradas**:

- *Validar solo en el frontend*: se puede saltar y deja datos sucios.
- *Aceptar vínculo con cualquier rol*: vuelve a duplicar la relación y contradice la spec.
- *Hacer el vínculo un campo aparte siempre visible*: reintroduce la fricción que la decisión busca
  quitar.

## R10 · Copy cálido y consistente

**Decisión**: la acción de crear se rotula **Crear familia** (nunca "crear grupo") y la invitación
en Home se rotula **Agregar integrantes a tu familia** (nunca "Invita a tu familia").

**Rationale**: "familia" es el término canónico del producto y suena más cercano que "grupo"; el
segundo copy describe la acción desde el beneficio (agregar integrantes) en lugar de una orden
("invita"). Ambos cumplen el playbook §4 (verbos en la CTA, consecuencias antes de la acción).

**Alternativas consideradas**:

- *Mantener "crear grupo"*: contradice el término canónico y el tono de marca.
- *"Invitar a tu familia"*: más frío y menos claro sobre el resultado.
- *"Añadir miembros"*: "miembros" suena a modelo de datos; "integrantes" es más humano.

## R11 · Aplicación del gate `kitho-ux`

**Decisión**: el plan incorpora explícitamente la matriz de 8 estados, una sola acción primaria,
copy es/en, accesibilidad AA, tokens y responsive para cada pantalla tocada; el detalle vive en
[ux-checklist.md](./ux-checklist.md) y se valida con `jest-axe`, `check-ui`, `check-contrast` y
`check-shared`.

**Rationale**: la skill es obligatoria para cualquier cambio de UI (AGENTS.md) y la Definición de
Hecho (`docs/ux-playbook.md` §10) no se cumple solo con typecheck/lint. El campo condicional añade
un estado nuevo (campo visible con error local) que debe quedar cubierto.

## R12 · Puerta de entrada y orden login → familia

**Decisión (2026-11-20)**: sin sesión, la app muestra el login como primera pantalla y nunca las
pantallas del ciclo de familia (elegir, crear, unirse). La secuencia de entrada queda fijada como
login → perfil mínimo (solo si falta) → ciclo de familia → Home. Un enlace de invitación abierto sin
sesión conserva el código a través del login y, tras autenticarse, entra directo a unirse.

**Rationale**: la regla ya vivía en `useAuthGuard` (web y móvil) y en el contrato D0, pero no estaba
expresada como requisito verificable; sin ella, un enlace directo o un historial puede abrir una
pantalla del ciclo sin sesión y dejar a la persona en un estado incoherente. Conservar el código
entre el login y la unión evita que la garantía de FR-030 se rompa por el paso por login.

**Alternativas consideradas**:

- *Permitir mostrar el ciclo sin sesión y pedir login al confirmar*: expone datos de familia y
  multiplica los estados de error; se descartó.
- *Bloquear solo en web*: rompe la paridad web/móvil que exige el contrato D0; se descartó.
- *Pedir el perfil después del ciclo*: interrumpe la unión ya iniciada y alarga el primer día; se
  mantiene el perfil antes del ciclo, como referencia B1.
- *Confiar en que el enlace trae el código en memoria*: el login navega fuera del flujo y pierde ese
  estado; por eso el código se persiste como "invitación pendiente" (`getPendingInviteCode`).

**Implementación**: `useAuthGuard` mantiene el guard actual (`sin sesión → /auth/login`; rutas
`/family/select`, `/family/create`, `/invite` exigen sesión); el login resuelve el destino con
`nextPath`/`redirectFromSession`; el código pendiente se lee de `lib/session` en ambas plataformas.
La verificación se hace con pruebas de guard (`useAuthGuard.test`) y de flujo, no con backend.

## R13 · Wizard de creación vs formulario único

**Decisión (2026-11-25)**: tres pasos (Nombre → Moneda → Rol + resumen) en ruta única.

**Rationale**: el formulario único no guía las dos consecuencias críticas (moneda irreversible y
padre/madre = administrador). El wizard las secuencia y mantiene una acción primaria por paso
(FR-036...FR-040), sin tocar el backend.

**Alternativas consideradas**:

- *Formulario único mejorado*: menor fricción, pero menos guía; se pospone.
- *Dos pasos (nombre+moneda / rol+resumen)*: menos toques, pero mezcla dos consecuencias en un paso.
- *Sub-rutas por paso*: URL/back reales, pero exige compartir borrador y más archivos; se descarta a
  favor de la ruta única.

## R14 · Borrador con zustand persist

**Decisión (2026-11-25)**: `zustand` + `persist` para el borrador del wizard, en ruta única. Web
`localStorage`; móvil adapter sobre `lib/storage.ts`.

**Rationale**: sobrevivir a recargas y servir de piloto de la decisión de estado de cliente para la
spec 004. Evita introducir dos mecanismos de persistencia y mantiene el borrador fuera del estado de
servidor.

**Alternativas consideradas**:

- *Estado local en memoria*: se pierde al recargar; contradice FR-043.
- *`sessionStorage` a mano*: reimplementa lo que `persist` ya da.
- *Reservar `zustand` solo para la spec 004*: retrasa el piloto; se prefiere validarlo aquí.

**Implementación**: store `{step, nombre, moneda, rolFamiliar, setField, next, back, reset}` bajo
`kitho_family_draft`; `reset` al crear o descartar; en web `skipHydration`/`rehydrate` para evitar
mismatch SSR. No contiene secretos ni datos de servidor.
