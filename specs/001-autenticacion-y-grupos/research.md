# Research: Autenticación, Registro y Gestión de Grupos Familiares

**Feature**: 001-autenticacion-y-grupos  
**Date**: 2026-10-29

## Decisions

### 1. Autenticación con Google Sign-In

- **Decision**: Verificar el Google ID token en el backend con `google-auth`
  (`id_token.verify_oauth2_token`) usando el `GOOGLE_CLIENT_ID` configurado. Validar firma,
  audiencia, emisor y expiración. Emitir un JWT propio (access + refresh) con claims `user_id`,
  `family_id` (nullable) y `role` (nullable/admin/member).
- **Rationale**: Cumple FR-001/FR-002 y el caso límite "Token de Google inválido". El backend es
  la autoridad de validación (Principio V).
- **Alternatives considered**: Decodificar el token sin verificar firma (rechazado: permite
  suplantación); delegar la validación al cliente (prohibido por la constitución).

### 2. Modelo de datos para grupos y membresías

- **Decision**: Entidades `User`, `Family`, `Membership` (user_id, family_id, role, parentesco,
  estado activo/inactivo). `Invitation` con token único, `expira_en` y `usado`.
- **Rationale**: Permite la restricción "un usuario solo puede pertenecer a 1 grupo activo"
  (FR-007), el conteo de miembros activos (FR-008), roles y permisos (FR-009/FR-010).
- **Alternatives considered**: Almacenar `family_id` directamente en `User` (más simple) pero
  pierde historial, estado y metadatos de membresía.

### 3. Límite de miembros (10)

- **Decision**: Contar membresías con `estado='activo'` por `family_id` y rechazar con `400` al
  alcanzar 10. Ejecutar la comprobación y la creación dentro de la misma transacción.
- **Rationale**: Cumple FR-008, SC-004 y el caso límite de límite alcanzado.
- **Alternatives considered**: Contar `users` (menos preciso si hay inactivos); límite sólo en
  frontend (prohibido: el backend es la autoridad).

### 4. Invitaciones

- **Decision**: Generar un token aleatorio seguro (`secrets.token_urlsafe(32)`), almacenarlo con
  `family_id`, `generado_por`, `expira_en` (configurable, por defecto 72 h) y `usado`. Validar
  token, expiración y uso al unirse; marcar `usado` en la misma transacción que crea la membresía.
- **Rationale**: Cumple FR-006 y el caso límite de enlace inválido/expirado; permite expiración y
  revocación por uso.
- **Alternatives considered**: JWT firmado como invitación (más difícil de invalidar y de auditar
  el uso); token sin expiración (rechazado por seguridad).

### 5. Autorización

- **Decision**: Dependencia FastAPI para verificar el JWT propio; RBAC en los servicios: rol
  `admin` requerido para generar invitaciones, promover y expulsar; verificar pertenencia al grupo
  en cada operación.
- **Rationale**: Cumple FR-010 y SC-005; el backend es autoridad (Principio V).
- **Alternatives considered**: Verificación sólo en frontend (prohibido).

### 6. Flujo obligatorio sin grupo

- **Decision**: Incluir `family_id` y `role` nullable en el JWT; el endpoint de refresh relee la
  membresía activa y devuelve `needs_profile_setup` y `needs_family_setup`. Los frontends
  persisten ese estado y redirigen al flujo de perfil/selección de grupo.
- **Rationale**: Cumple FR-003, FR-004 y SC-006 aun tras recargar la aplicación.
- **Alternatives considered**: Forzar en middleware global (interfiere con rutas de setup); confiar
  sólo en el estado en memoria (se pierde al recargar).

### 7. Verificación estricta y fail-closed

- **Decision**: Eliminar el fallback de decodificación sin verificación. Si `GOOGLE_CLIENT_ID` no
  está configurado o la verificación falla, responder `401 Unauthorized`.
- **Rationale**: Un token sin verificar permite autenticación arbitraria; contradice FR-001, el
  caso límite de token inválido y el Principio V. Es un requisito de seguridad, no una mejora
  opcional.
- **Alternatives considered**: Fallback sólo en desarrollo (rechazado: riesgo de llegar a
  producción con la puerta abierta); confiar en la firma del cliente (prohibido).

### 8. Atomicidad de operaciones de escritura

- **Decision**: Crear `Family` y `Membership` admin en una sola transacción con rollback. En la
  unión por invitación, crear la membresía y marcar `usado` en la misma transacción, con bloqueo
  de la fila de familia para el conteo de miembros.
- **Rationale**: La constitución exige preservar la semántica ACID; evita familias huérfanas y
  uniones que excedan el límite por concurrencia.
- **Alternatives considered**: Commits separados por entidad (rechazado: estados parciales);
  confiar en validaciones posteriores (no evita carreras).

### 9. Validación de entrada y errores semánticos

- **Decision**: Validar con Pydantic: `moneda_local` como código ISO 4217 de 3 letras,
  `nombre_visualizacion`/`foto_avatar` no vacíos, `expira_en_horas` en un rango razonable
  (1–720). Mapear errores a `400/401/403/404/422` y mensajes claros en la UI.
- **Rationale**: Cumple FR-003/FR-005, la constitución (errores semánticos y UI amigable) y evita
  datos inválidos persistidos.
- **Alternatives considered**: Validación sólo en frontend (prohibido); aceptar cualquier string y
  corregir después (genera datos inconsistentes).

### 10. Estrategia de pruebas

- **Decision**: pytest con TestClient/httpx para contratos y reglas de negocio; Jest + Testing
  Library en web; Jest + React Native Testing Library en móvil. Cubrir los escenarios de
  `quickstart.md` y SC-002 a SC-005.
- **Rationale**: El plan exige verificación reproducible de autenticación, límite de miembros,
  segundo grupo y permisos; permite validar la convergencia sin depender de pruebas manuales.
- **Alternatives considered**: Sólo pruebas manuales (no reproducibles); sólo pruebas E2E de UI
  (lentas y frágiles para reglas de backend).

### 11. Configuración de clientes y CORS

- **Decision**: Usar `NEXT_PUBLIC_API_URL` y `EXPO_PUBLIC_API_URL` para la base de la API;
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en web y `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` /
  `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` en móvil. Restringir
  CORS a orígenes permitidos y construir el enlace de invitación desde una URL base configurable.
- **Rationale**: Paridad entre entornos y menor superficie de riesgo; evita fallos por variables
  inexistentes o URLs hardcodeadas.
- **Alternatives considered**: Hardcodear `localhost` (rompe en dispositivos/dispositivos reales);
  CORS abierto con credenciales (configuración inválida e insegura).

## Resolved Clarifications

All aspects from `spec.md` are clear; no `NEEDS CLARIFICATION` remain.
