# Quickstart — validar B2 end-to-end

**Objetivo**: comprobar que el rol viaja con el código de invitación y que quien se une no elige rol.
Contrato: [contracts/api-invitations.md](./contracts/api-invitations.md). Modelo:
[data-model.md](./data-model.md).

## Requisitos

- Docker y Docker Compose.
- Dos cuentas de Google distintas (una crea la familia; la otra se une).
- `pnpm` instalado.

## Preparación

```bash
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend alembic downgrade -1 && docker compose exec backend alembic upgrade head  # migración reversible
```

```bash
cd frontend-web && pnpm install && pnpm run dev
cd frontend-mobile && pnpm install && pnpm start
```

## Escenario 1 — Invitar con rol hijo (camino de menor privilegio)

1. Con la cuenta A, crear una familia (rol padre o madre) y abrir Miembros.
2. Comprobar que el selector "Rol de la persona que invitas" inicia en **Hijo**.
3. Generar un código con rol **Hijo** (valor por defecto del selector).
4. Comprobar que la pantalla muestra "Invitación para: Hijo" y la caducidad a 7 días.
5. Con la cuenta B, abrir "Unirme con un código".

**Esperado**: el formulario de unión tiene **un solo campo**; al unirse, B entra a Home y la lista de
integrantes lo muestra como miembro. B no ve la acción de invitar.

## Escenario 2 — Invitar con rol madre

1. Con la cuenta A, generar un código con rol **Madre**.
2. Con la cuenta C, unirse.

**Esperado**: C entra como **administrador**; puede generar códigos; la lista la muestra como Madre.
El rol aplicado es el de la invitación aunque C envíe otro en el cuerpo (cliente antiguo).

## Escenario 3 — Código heredado sin rol

1. Insertar una invitación sin rol (o usar una emitida antes de la migración).
2. Con la cuenta D, unirse con ese código.

**Esperado**: D entra como **miembro** con rol familiar nulo; la lista muestra "Miembro", nunca
"Sin nombre".

## Escenario 4 — Errores y límites

| Acción | Esperado |
| --- | --- |
| Repetir un código ya usado | Mensaje "ya utilizado" asociado al campo del código |
| Usar un código caducado | Mensaje "caducado" y opción de volver |
| Unirse con una cuenta que ya tiene familia | Mensaje "ya perteneces a un grupo familiar" |
| Familia con 10 integrantes activos | Se impide la unión y se explica el límite |
| Enviar rol en el cuerpo de unión (cliente antiguo) | Se ignora; el rol aplicado es el de la invitación |

## Escenario 5 — Elegir familia con jerarquía contextual

1. Con la cuenta B (sin familia) y un código pendiente en el enlace, iniciar sesión.
2. Comprobar que el login lleva directo a "Unirme con un código", sin pasar por la elección.
3. Abrir `/family/select` directamente con el código todavía pendiente.
4. Repetir sin código pendiente.

**Esperado**: con código, "Unirme con mi código" es la única acción primaria y el código ya está
cargado; sin código, "Crear mi familia" es la primaria y "Me invitaron" queda como secundaria. En
ningún caso hay dos acciones primarias ni un redirect vacío.

## Escenario 6 — Idiomas, accesibilidad y responsive

1. Cambiar a inglés y repetir el escenario 1.
2. Recorrer la pantalla de invitar solo con teclado (web) y con lector de pantalla (móvil).
3. Probar la pantalla de Miembros a 375, 768, 1024 y 1440 px, y en iOS y Android.

**Esperado**: no aparece ninguna clave cruda; el foco es visible; el resultado de generar el código
se anuncia (región viva); los objetivos táctiles miden al menos 44; el selector de rol expone el
estado seleccionado a tecnologías de asistencia; no hay recorte ni solapamiento a 200% de zoom ni en
ningún ancho; la caducidad se muestra con el formato del idioma activo.

## Verificación automatizada

```bash
# Backend
docker compose exec backend pytest -q

# Web
cd frontend-web && pnpm run typecheck && pnpm run lint && pnpm test

# Móvil
cd frontend-mobile && pnpm run typecheck && pnpm run lint && pnpm test

# Sistema visual, contraste e i18n
node scripts/check-ui.mjs
node scripts/check-contrast.mjs
node scripts/check-shared.mjs
```

**Criterio de aceptación**: todo en verde, incluidos los tests nuevos de rol (padre/madre → admin,
hijo/hija → member, código heredado → member), la prueba de flujo que verifica que unirse envía
solo `codigo`, la jerarquía contextual de la elección y la accesibilidad de las pantallas nuevas.
La normalización del código acepta mayúsculas/minúsculas, espacios internos y guiones; las
confirmaciones destructivas nombran la familia o la persona; la caducidad usa singular cuando
queda un día; `check-contrast` valida 4.5:1 en texto y 3:1 en componentes.

## Limpieza

```bash
docker compose down
```