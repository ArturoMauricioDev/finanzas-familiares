# Quickstart: Autenticación, Registro y Gestión de Grupos Familiares

**Feature**: 001-autenticacion-y-grupos  
**Date**: 2026-10-29

## Prerequisites

- Docker y Docker Compose instalados.
- Credenciales de Google OAuth configuradas (Web y Móvil).
- Variables de entorno para backend (JWT secret, DB, `GOOGLE_CLIENT_ID`) y frontends
  (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; `EXPO_PUBLIC_API_URL` y los Client IDs
  de Expo para web/Android/iOS).

## Setup (desarrollo)

1. Levantar servicios con Docker Compose.
   ```bash
   docker compose up -d
   ```
2. Aplicar migraciones.
   ```bash
   docker compose exec backend alembic upgrade head
   ```
3. Configurar Google Sign-In en `frontend-web` y `frontend-mobile` con sus Client IDs.
4. Verificar salud de la API.
   ```bash
   curl http://localhost:8000/health
   ```
   Esperado: `{"status":"ok"}`.

## Validación end-to-end

### Escenario 1: Registro/login con Google + perfil + crear grupo

1. **Login Google** (Web/Móvil): `POST /api/v1/auth/google` con un `id_token` válido.
   - Esperado: `200` con tokens, `needs_profile_setup=true`, `needs_family_setup=true`,
     `family_id=null`.
2. **Configurar perfil**: `PUT /api/v1/users/me/profile` con `nombre_visualizacion` y
   `foto_avatar`.
   - Esperado: `200`, perfil guardado.
3. **Crear grupo**: `POST /api/v1/families` con `nombre` y `moneda_local` (ej. `"MXN"`).
   - Esperado: `201`, `role=admin`, tokens actualizados con `family_id` y `role`.
4. **Verificar grupo**: `GET /api/v1/families/me` con el nuevo token.
   - Esperado: `200` con el grupo y el creador como admin.

### Escenario 2: Unirse por invitación

1. **Login usuario B con Google** -> obtener tokens; `needs_profile_setup` según el caso.
2. **Configurar perfil** si es necesario.
3. **Admin genera invitación**: `POST /api/v1/families/me/invitations` con token admin.
   - Esperado: `201` con `token` y `link`.
4. **Usuario B se une**: `POST /api/v1/invitations/join` con el token (sin grupo activo).
   - Esperado: `200`, `role=member`, tokens con `family_id`.
5. **Verificar límite**: con 10 miembros activos, intentar unir al 11.º -> `400`.

### Escenario 3: Permisos y errores semánticos

1. **Miembro intenta generar invitación**: `POST /api/v1/families/me/invitations` con token de
   `member`.
   - Esperado: `403`.
2. **Admin promueve a un miembro**: `POST /api/v1/families/me/members/:user_id/promote`.
   - Esperado: `200`.
3. **Admin intenta expulsarse a sí mismo**: `DELETE /api/v1/families/me/members/:user_id` con su
   propio `user_id`.
   - Esperado: `400`.
4. **Petición sin token**: cualquier endpoint protegido -> `401`.
5. **Usuario sin grupo accede a ruta protegida que requiere grupo** -> `403` y redirección al flujo
   de selección (SC-006).

### Escenario 4: Token de Google inválido

1. Enviar `POST /api/v1/auth/google` con un token expirado, de otra audiencia o con firma
   manipulada.
   - Esperado: `401`; no se crea ni autentica ninguna cuenta.

### Escenario 5: Restricciones de grupo

1. Un usuario con grupo activo intenta `POST /api/v1/families` -> `400`.
2. Un usuario con grupo activo intenta `POST /api/v1/invitations/join` -> `400`.
3. `POST /api/v1/families` con `moneda_local` inválida (ej. `"MXNX"`) -> `422`.
4. `PUT /api/v1/users/me/profile` con un campo vacío -> `422`.

### Escenario 6: Invitación inválida o expirada

1. `POST /api/v1/invitations/join` con token inexistente -> `400`.
2. Reutilizar un token ya usado -> `400`.
3. Usar un token con `expira_en` en el pasado -> `400`.

## Automated Validation

Run the suites defined by the plan:

```bash
# Backend contract/integration tests
docker compose exec backend pytest

# Web tests
cd frontend-web && npm test

# Mobile tests
cd frontend-mobile && npm test
```

Expected coverage includes SC-002 (`401` sin JWT), SC-003 (segundo grupo rechazado), SC-004
(límite de 10 rechazado) and SC-005 (acciones exclusivas de admin denegadas a miembros).

## Notes

- Los tokens propios incluyen `user_id`, `family_id` (nullable) y `role` (nullable).
- El conteo de miembros usa `estado='activo'`.
- La moneda es única por grupo; los montos futuros usarán `DECIMAL` conforme a la constitución.
- FastAPI valida todas las reglas; el frontend sólo presenta el estado y traduce errores.
