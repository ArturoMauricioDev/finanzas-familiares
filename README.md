# Finanzas Familiares

Aplicación de finanzas familiares con autenticación de Google, perfil obligatorio, grupo familiar
y gestión de integrantes mediante invitaciones.

## Estructura

- `backend/`: API FastAPI, SQLAlchemy, PostgreSQL y migraciones Alembic.
- `frontend-web/`: aplicación Next.js 15.
- `frontend-mobile/`: aplicación Expo 52 con Expo Router.
- `specs/001-autenticacion-y-grupos/`: especificación, plan, contratos y tareas.

## Requisitos

- Docker y Docker Compose.
- Node.js 20 o superior.
- Credenciales de Google OAuth para web, Android e iOS.

## Backend con Docker

1. Copia las variables de entorno y ajusta los valores:
   ```bash
   cp .env.example .env
   ```
2. Levanta PostgreSQL y la API:
   ```bash
   docker compose up -d
   ```
3. Aplica las migraciones:
   ```bash
   docker compose exec backend alembic upgrade head
   ```
4. Verifica la salud del servicio:
   ```bash
   curl http://localhost:8000/health
   ```
5. Documentación interactiva: `http://localhost:8000/docs`.

Variables principales en `.env`:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL. |
| `SECRET_KEY` | Clave para firmar los JWT propios. |
| `GOOGLE_CLIENT_ID` | Client ID web usado para validar el `id_token`. |
| `GOOGLE_CLIENT_IDS` | Client IDs adicionales de Android/iOS para validar sus `id_token`, separados por comas. |
| `CORS_ORIGINS` | Orígenes permitidos, separados por comas. |
| `INVITATION_LINK_BASE` | Base del enlace de invitación. |

## Frontend web

```bash
cd frontend-web
npm install
```

Crea `frontend-web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id
```

Ejecuta:

```bash
npm run dev
```

La aplicación queda en `http://localhost:3000`.

## Frontend móvil

```bash
cd frontend-mobile
npm install
```

Crea `frontend-mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
```

Ejecuta:

```bash
npm start
```

El esquema de redirección OAuth es `finanzasfamiliares://auth/login`. En un dispositivo físico,
`EXPO_PUBLIC_API_URL` debe apuntar a la IP de la máquina que ejecuta el backend, no a
`localhost`.

## Google OAuth

- Habilita la API de Google Identity en Google Cloud Console.
- Crea credenciales OAuth 2.0 para web, Android e iOS.
- Añade `http://localhost:3000` a los orígenes autorizados de la credencial web.
- Para Android, registra el `package` `com.finanzasfamiliares.app` y el SHA-1 del keystore.
- Para iOS, registra el bundle ID `com.finanzasfamiliares.app`.
- Añade los Client IDs de Android/iOS en `GOOGLE_CLIENT_IDS` del backend para que los `id_token`
  nativos también sean válidos.

## Pruebas y validación

```bash
# Backend
docker compose exec backend pytest
docker compose exec backend ruff check .
docker compose exec backend black --check .

# Web
cd frontend-web
npm run typecheck
npm run lint
npm test

# Mobile
cd frontend-mobile
npm run typecheck
npm run lint
npm test
```

Los escenarios manuales end-to-end están descritos en
`specs/001-autenticacion-y-grupos/quickstart.md`.

## Seguridad

- El backend valida firma, audiencia, emisor y expiración del `id_token` de Google; cualquier
  token inválido responde `401` sin crear cuentas.
- Los JWT propios incluyen `user_id`, `family_id` y `role`.
- Solo los administradores pueden invitar, promover y expulsar integrantes.
- Un grupo admite como máximo 10 miembros activos y cada usuario pertenece a un solo grupo activo.
