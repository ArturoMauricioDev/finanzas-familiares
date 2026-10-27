# Research: Autenticación, Registro y Gestión de Grupos Familiares

**Feature**: 001-auth-family-groups  
**Date**: 2026-10-27

## Decisions

### 1. Autenticación con Google Sign-In
- **Decision**: Usar Google ID Token verification en backend (FastAPI). Verificar token con Google API / google-auth. Emitir JWT propio (access + refresh) con claims `user_id`, `family_id` (nullable), `role` (nullable/admin/member).
- **Rationale**: Cumple FR-001/FR-002, delega auth a Google, control total en backend sobre claims. 
- **Alternatives considered**: OAuth2 authorization code flow vs ID token; ID token directo desde cliente es común para mobile/web con Google Sign-In SDK.

### 2. Modelo de datos para grupos y membresías
- **Decision**: Entidades `User`, `Family`, `Membership` (user_id, family_id, role, parentesco, estado activo/inactivo). `Invitation` con token único, expira_en, usado.
- **Rationale**: Permite restricción "un usuario solo puede pertenecer a 1 grupo activo" (FR-007), conteo de miembros activos (FR-008), roles y permisos (FR-009/FR-010).
- **Alternatives considered**: Almacenar family_id directamente en User (más simple) pero menos flexible para histórico/cambios; Membership es mejor para estado/roles/histórico.

### 3. Límite de miembros (10)
- **Decision**: Contar membresías con `estado='activo'` por `family_id`. Rechazar con 400 al alcanzar 10.
- **Rationale**: Cumple FR-008 y edge case.
- **Alternatives considered**: Contar users - menos preciso si hay inactivos; estado explícito permite expulsiones sin borrar histórico.

### 4. Invitaciones
- **Decision**: Generar token aleatorio/seguro (UUIDv4/url-safe), guardar en `Invitation` con `family_id`, `generado_por`, `expira_en` (configurable), `usado`. Validar al unirse.
- **Rationale**: Cumple FR-006, permite revocación/expiración.
- **Alternatives considered**: JWT firmado para invitación (más complejo de invalidar); tabla con token + estado es claro.

### 5. Autorización
- **Decision**: Middleware/dependencias FastAPI para verificar JWT propio. RBAC: role `admin` requerido para acciones de gestión (generar invitación, promover, expulsar). Verificar pertenencia al grupo.
- **Rationale**: Backend autoridad (constitución). Cumple FR-010, SC-005.
- **Alternatives considered**: Verificación solo frontend (prohibido).

### 6. Flujo obligatorio sin grupo
- **Decision**: En JWT incluir `family_id` nullable; endpoints protegidos verifican presencia de grupo para rutas financieras (SC-006). Redirección obligatoria desde frontend según claims.
- **Rationale**: Cumple FR-004, SC-006.
- **Alternatives considered**: Forzar en middleware global - puede interferir con rutas de setup; mejor validación por endpoint/grupo de rutas.

## Resolved Clarifications
All aspects from spec are clear; no NEEDS CLARIFICATION remain.
