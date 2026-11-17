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
   - Web: Google Identity Services con `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
   - Android/iOS: `react-native-nitro-google-signin` con `webClientId`
     (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`), `androidClientId`/`iosClientId` y el `package`
     `com.finanzasfamiliares.app` + SHA-1 registrados en Google Cloud Console. No se usa
     `google-services.json` ni `GoogleService-Info.plist`. Reconstruye el development build tras
     cambiar los Client IDs: `npx expo prebuild --clean && npx expo run:android`.
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
3. **Crear grupo**: `POST /api/v1/families` con `nombre`, `moneda_local` (ej. `"MXN"`) y
   `rol_familiar` (`"padre"` o `"madre"`).
   - Esperado: `201`, `role=admin`, tokens actualizados con `family_id` y `role`, y
     `membership.rol_familiar` con el rol enviado.
4. **Verificar grupo**: `GET /api/v1/families/me` con el nuevo token.
   - Esperado: `200` con el grupo y el creador como admin.

### Escenario 2: Unirse por invitación

1. **Login usuario B con Google** -> obtener tokens; `needs_profile_setup` según el caso.
2. **Configurar perfil** si es necesario.
3. **Admin genera invitación**: `POST /api/v1/families/me/invitations` con token admin.
   - Esperado: `201` con `codigo` (8 caracteres), `expira_en` a 7 días y `usado=false`; sin
     `token` ni `link`.
4. **Usuario B se une**: `POST /api/v1/invitations/join` con el `codigo` (sin grupo activo) y
   `rol_familiar` (`"hijo"`, `"hija"`, `"padre"` o `"madre"`).
   - Esperado: `200`; si `rol_familiar` es Padre/Madre, `role=admin`; en caso contrario
     `role=member`. Tokens con `family_id` y el `role` resultante.
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

1. `POST /api/v1/invitations/join` con un código inexistente -> `400`.
2. Reutilizar un código ya usado -> `400`.
3. Usar un código con `expira_en` en el pasado -> `400`.

### Escenario 7: Ciclo de vida de la familia

1. **Único integrante elimina la familia**: `DELETE /api/v1/families/me` -> `200`, la familia
   queda `eliminado` (soft delete), la membresía pasa a `inactivo` y los tokens quedan sin
   `family_id`; el usuario conserva su cuenta.
2. **Familia con más de un integrante**: `DELETE /api/v1/families/me` -> `400`; solo se ofrece
   `POST /api/v1/families/me/leave`.
3. **Abandono del último administrador**: el integrante con `fecha_union` más antigua recibe
   automáticamente `role=admin` (SC-010).
4. **Reasignación determinista**: con `fecha_union` empatadas, el desempate usa el `id` de la
   membresía.

## Automated Validation

Run the suites defined by the plan:

```bash
# Backend contract/integration tests
docker compose exec backend pytest

# Web tests
cd frontend-web && pnpm test

# Mobile tests
cd frontend-mobile && pnpm test
```

Expected coverage includes SC-002 (`401` sin JWT), SC-003 (segundo grupo rechazado), SC-004
(límite de 10 rechazado) and SC-005 (acciones exclusivas de admin denegadas a miembros).

## Notes

- Los tokens propios incluyen `user_id`, `family_id` (nullable), `role` (nullable) y reflejan el
  `role` resultante tras crear o unirse.
- `rol_familiar` (`padre|madre|hijo|hija`) determina el permiso: Padre/Madre reciben `admin`.
- El conteo de miembros usa `estado='activo'`.
- La moneda es única por grupo; los montos futuros usarán `DECIMAL` conforme a la constitución.
- FastAPI valida todas las reglas; el frontend sólo presenta el estado y traduce errores.
