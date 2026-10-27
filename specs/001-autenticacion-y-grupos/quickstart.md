# Quickstart: Autenticación, Registro y Gestión de Grupos Familiares

**Feature**: 001-auth-family-groups  
**Date**: 2026-10-27

## Prerequisites
- Docker y Docker Compose instalados
- Configurar credenciales Google OAuth (Web y Móvil) - Client IDs
- Variables de entorno para backend (JWT secret, DB, Google client IDs)

## Setup (desarrollo)
1. Levantar servicios con Docker Compose (backend, postgres, etc.)
   ```bash
   docker compose up -d
   ```
2. Aplicar migraciones (Alembic)
   ```bash
   docker compose exec backend alembic upgrade head
   ```
3. Configurar Google Sign-In en frontend-web y frontend-mobile con sus Client IDs

## Validación end-to-end

### Escenario 1: Registro/login con Google + perfil + crear grupo
1. **Login Google** (Web/Móvil): Llamar `POST /api/v1/auth/google` con `id_token` válido de Google.
   - Esperado: 200 con tokens, `needs_profile_setup=true`, `needs_family_setup=true`, `family_id=null`.
2. **Configurar perfil**: `PUT /api/v1/users/me/profile` con `nombre_visualizacion` y `foto_avatar`.
   - Esperado: 200, perfil guardado.
3. **Crear grupo**: `POST /api/v1/families` con `nombre` y `moneda_local` (ej. "MXN").
   - Esperado: 201, `role=admin`, tokens actualizados con `family_id` y `role`. 
4. **Verificar grupo**: `GET /api/v1/families/me` con nuevo token.
   - Esperado: 200 con grupo y miembro admin.

### Escenario 2: Unirse por invitación
1. **Login usuario B con Google** -> obtener tokens, `needs_profile_setup` según caso.
2. **Configurar perfil** si necesario.
3. **Admin genera invitación**: `POST /api/v1/families/me/invitations` con token admin.
   - Esperado: 201 con `token` y `link`.
4. **Usuario B se une**: `POST /api/v1/invitations/join` con `token` (sin grupo activo).
   - Esperado: 200, `role=member`, tokens con `family_id`. 
5. **Verificar límite**: Con 10 miembros activos, intentar unir 11vo -> 400.

### Escenario 3: Permisos
1. **Miembro intenta generar invitación**: `POST /api/v1/families/me/invitations` con token de member.
   - Esperado: 403.
2. **Admin promueve miembro**: `POST /api/v1/families/me/members/:user_id/promote`.
   - Esperado: 200.
3. **Peticiones sin token**: Cualquier endpoint protegido -> 401.
4. **Usuario sin grupo accede a ruta protegida que requiere grupo**: -> 403/redirección según implementación (cumple SC-006).

## Notas
- Los tokens propios deben incluir claims `user_id`, `family_id` (puede ser null), `role` (puede ser null).
- Conteo de miembros usa `estado='activo'`.
- Moneda única por grupo; montos usarán DECIMAL en entidades financieras futuras.
- Todo según constitución (FastAPI valida, Docker Compose para servicios).
