# Feature Specification: Autenticación, Registro y Gestión de Grupos Familiares

**Feature Branch**: `001-autenticacion-y-grupos`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: Autenticación, Registro y Gestión de Grupos Familiares

## Clarifications

### Session 2026-11-03

- Q: ¿Deben existir ambas rutas `001-autenticacion-y-grupos` y `001-auth-family-groups` o una sola? → A: Mantener solo `001-autenticacion-y-grupos`; eliminar el duplicado y normalizar `Feature Branch` al slug activo.

### Session 2026-11-05

- Q: ¿Cómo se resuelve el error 400 `invalid_request` de Android con `redirect_uri=finanzasfamiliares://auth/login`? → A: Usar Google Sign-In nativo (`@react-native-google-signin/google-signin`) con `webClientId`, `androidClientId` respaldado por `google-services.json` (package + SHA-1) y reconstruir el development build; el flujo web mantiene Google Identity Services y `expo-auth-session` solo como fallback web.

### Session 2026-11-06

- Q: ¿Cómo se asignan los roles al crear o unirse a una familia? → A: Los usuarios con rol familiar **Padre** o **Madre** reciben automáticamente el rol **Administrador**; el resto ingresa como **Miembro** con su etiqueta de parentesco.
- Q: ¿Cuándo y cómo se puede eliminar o abandonar una familia? → A: Con exactamente 1 integrante, el miembro puede **eliminar la familia** mediante **soft delete**; su cuenta pasa a **perfil individual** conservando historial y acceso, y se le redirige al inicio del flujo principal. Con más de 1 integrante, ningún usuario (ni el Administrador) puede eliminar la familia; solo puede **abandonarla**.
- Q: ¿Qué ocurre si la familia queda sin administradores? → A: Si el Padre y la Madre abandonan la familia, el sistema asigna automáticamente el rol **Administrador** al integrante con el enlace miembro-familia más antiguo (`created_at`).
- Q: ¿Cuántos usos y qué vigencia tiene un código de invitación? → A: Cada código es de **un solo uso** y **expira a los 7 días** desde su creación; los códigos usados o expirados no pueden reutilizarse.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inicio de sesión/registro con Google (Priority: P1)

Como usuario, quiero iniciar sesión/registrarme mediante mi cuenta de Google (Gmail) para acceder rápidamente sin necesidad de recordar contraseñas.

**Why this priority**: Es la puerta de entrada al sistema. Sin autenticación delegada no es posible acceder a las funcionalidades protegidas.

**Independent Test**: Puede probarse iniciando sesión con una cuenta de Google válida y verificando que se obtenga un JWT propio de la aplicación tras la validación del token de Google.

**Acceptance Scenarios**:

1. **Given** un usuario no autenticado, **When** inicia sesión con Google Sign-In desde Web o Móvil, **Then** el sistema valida el token de Google y emite un JWT propio con user_id, family_id y role.
2. **Given** un usuario no registrado en el sistema, **When** completa la autenticación con Google exitosamente, **Then** el sistema crea su cuenta y lo dirige al flujo de configuración de perfil.

---

### User Story 2 - Configuración inicial de perfil (Priority: P2)

Como nuevo usuario sin grupo registrado, quiero configurar mi perfil (Nombre de Visualización y Foto Avatar) antes de ingresar al flujo principal.

**Why this priority**: Es necesario para identificar a los integrantes dentro del grupo familiar y personalizar la experiencia.

**Independent Test**: Puede probarse registrando un nuevo usuario, verificando que se le solicita configurar nombre de visualización y foto avatar, y que estos datos se guardan correctamente.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado que es su primer ingreso, **When** accede al sistema, **Then** el sistema le solicita obligatoriamente definir su Nombre de Visualización y Foto Avatar.
2. **Given** un usuario en proceso de configuración inicial, **When** proporciona nombre de visualización y foto avatar válidos, **Then** el sistema guarda el perfil y lo redirige al flujo de selección de grupo.

---

### User Story 3 - Selección de grupo familiar (Priority: P3)

Como usuario autenticado sin grupo, quiero elegir entre crear un nuevo grupo familiar o unirme a uno existente mediante un código de invitación.

**Why this priority**: Todo usuario debe pertenecer obligatoriamente a un grupo familiar para utilizar las funcionalidades financieras colaborativas.

**Independent Test**: Puede probarse con un usuario autenticado sin grupo asociado, verificando que se le presentan ambas opciones y que debe seleccionar una para continuar.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado sin grupo vinculado, **When** intenta acceder al sistema, **Then** el sistema le presenta obligatoriamente las opciones "Crear nuevo grupo familiar" o "Unirme mediante código".
2. **Given** un usuario autenticado sin grupo, **When** selecciona cualquiera de las dos opciones, **Then** el sistema lo guía por el flujo correspondiente.

---

### User Story 4 - Creación de grupo familiar (Priority: P4)

Como Administrador (Padre/Madre), quiero crear el núcleo familiar definiendo el nombre del grupo y la moneda local, asumiendo automáticamente el rol de gestión.

**Why this priority**: Permite establecer el núcleo familiar desde cero con control administrativo.

**Independent Test**: Puede probarse creando un grupo con nombre y moneda, verificando que el creador obtiene rol "admin", que el grupo se crea correctamente, y que no puede crear un segundo grupo si ya tiene uno.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado sin grupo, **When** crea un grupo proporcionando nombre de la familia y moneda local, **Then** el grupo se crea, el usuario se convierte automáticamente en Administrador (Padre/Madre) con role "admin" y queda vinculado al grupo.
2. **Given** un usuario ya vinculado a un grupo activo, **When** intenta crear un nuevo grupo, **Then** el backend rechaza la solicitud.

---

### User Story 5 - Gestión de integrantes y ciclo de vida de la familia (Priority: P5)

Como Administrador o integrante, quiero gestionar a los integrantes del grupo (hasta un límite máximo de 10 miembros), asignando parentescos (ej. hijo/hija) o promoviendo a otros miembros al rol de Administrador, y quiero poder eliminar la familia cuando soy el único integrante o abandonarla cuando hay más integrantes.

**Why this priority**: Permite al administrador controlar la composición y roles del núcleo familiar.

**Independent Test**: Puede probarse generando un código de invitación, uniéndose con otro usuario, verificando límites de miembros, y probando las acciones exclusivas del administrador, la eliminación y el abandono de familia.

**Acceptance Scenarios**:

1. **Given** un Administrador de un grupo con espacio disponible, **When** genera y comparte un código de invitación, **Then** otros usuarios pueden unirse al grupo introduciendo ese código.
2. **Given** un usuario se une mediante código a un grupo con menos de 10 miembros activos, **When** completa la unión, **Then** ingresa con rol "member" por defecto, puede asignar una etiqueta de parentesco, y si su rol familiar es Padre o Madre recibe automáticamente el rol Administrador.
3. **Given** un grupo con 10 miembros activos, **When** se intenta unirse mediante un código de invitación, **Then** el backend retorna error HTTP 400 Bad Request indicando que se ha alcanzado el límite permitido.
4. **Given** un Administrador, **When** gestiona integrantes, **Then** puede promover a otros miembros al rol de Administrador y expulsar o dar de baja a miembros del grupo.
5. **Given** una familia con exactamente 1 integrante, **When** el integrante confirma **Eliminar familia**, **Then** la familia se marca como eliminada mediante soft delete, su cuenta queda como perfil individual conservando historial y acceso, y se le redirige al inicio del flujo principal.
6. **Given** una familia con más de 1 integrante, **When** cualquier integrante —incluido el Administrador— intenta gestionar la familia, **Then** no existe la opción de eliminar y solo se ofrece **Abandonar familia**; si el Padre y la Madre abandonan, el integrante más antiguo recibe automáticamente el rol Administrador.

---

### Edge Cases

- **Límite de miembros alcanzado**: Al intentar unirse a un grupo que ya tiene 10 integrantes activos, el sistema debe rechazar la solicitud con código 400.
- **Intento de crear segundo grupo**: Un usuario que ya pertenece a un grupo activo no puede crear otro grupo.
- **Token de Google inválido**: Si el token de Google no es válido, la autenticación debe fallar.
- **JWT propio inválido o ausente**: Cualquier petición a endpoints protegidos sin un JWT válido debe retornar 401 Unauthorized.
- **Usuario sin grupo intenta acceder a funcionalidades protegidas**: Debe ser redirigido obligatoriamente al flujo de selección/creación/unión de grupo.
- **Código de invitación inválido, usado o expirado**: Debe rechazarse con un error apropiado.
- **Reutilización de código**: Un código de invitación usado no puede volver a utilizarse; el administrador debe generar uno nuevo.
- **Restricción de grupo único**: Un usuario solo puede pertenecer a un único grupo familiar activo a la vez.
- **Eliminación con más de un integrante**: La opción **Eliminar familia** no debe existir; solo **Abandonar familia**, incluso para el Administrador.
- **Último integrante**: Cuando la familia queda con exactamente 1 integrante, se habilita **Eliminar familia** y se oculta **Abandonar familia**.
- **Historial tras soft delete**: La familia eliminada no aparece en la navegación ni en la gestión de miembros, pero el usuario conserva su historial y acceso como perfil individual.
- **Abandono de familia**: El usuario que abandona queda sin grupo, conserva su cuenta e historial y es redirigido al flujo de selección/creación/unión de grupo.
- **Familia sin administradores**: Si el Padre y la Madre abandonan, el sistema debe reasignar el rol Administrador al integrante más antiguo sin dejar la familia sin administración.
- **Reasignación concurrente**: Si dos integrantes abandonan al mismo tiempo y la familia queda sin administradores, la reasignación debe ser determinista usando el `created_at` más antiguo.

## Requirements *(mandatory)*

### Functional Requirements

#### Autenticación, JWT y Perfil
- **FR-001**: El sistema DEBE permitir la autenticación exclusiva mediante Google Sign-In (Gmail) tanto en la aplicación Web (Next.js) como en la aplicación Móvil (React Native / Expo).
- **FR-002**: Tras validar el token de Google en el backend, FastAPI DEBE emitir un JWT de sesión interno conteniendo las claims necesarias (user_id, family_id, role).
- **FR-003**: Si es el primer ingreso del usuario, el sistema DEBE solicitar la configuración inicial para definir su Nombre de Visualización y Foto Avatar.

#### Núcleo Familiar y Asociación
- **FR-004**: Todo usuario autenticado que no esté vinculado a un grupo DEBE seleccionar obligatoriamente una de dos opciones: "Crear nuevo grupo familiar" o "Unirme mediante código".
- **FR-005**: Al crear un grupo, el sistema DEBE registrar el nombre de la familia y la moneda local. El creador DEBE asumir el rol familiar Padre o Madre y convertirse automáticamente en Administrador.
- **FR-006**: Al unirse a un grupo, el acceso DEBE realizarse mediante un código de invitación generado por un Administrador; la generación de la invitación DEBE exponer únicamente ese código. Cada código DEBE ser de un solo uso y expirar a los 7 días desde su creación.
- **FR-007**: Un usuario SOLO puede pertenecer a un (1) único grupo familiar activo a la vez.
- **FR-008**: El número máximo de miembros permitidos por grupo familiar es de 10 integrantes. El backend DEBE rechazar nuevas incorporaciones al alcanzar este límite.

#### Gestión de Roles y Permisos
- **FR-009**: Al unirse mediante código, el usuario DEBE ingresar con el rol familiar que corresponda; si es Padre o Madre recibe automáticamente el rol Administrador, y en caso contrario ingresa como Miembro con su etiqueta de parentesco (ej. hijo/hija).
- **FR-010**: Los usuarios con rol de Administrador (Padre/Madre) DEBEN tener facultades exclusivas para: generar y compartir el código de invitación, promover a otros miembros al rol de Administrador, y expulsar o dar de baja a miembros del grupo.

#### Autenticación móvil nativa

- **FR-011**: En Android (y iOS cuando aplique), la app móvil DEBE usar Google Sign-In nativo (`@react-native-google-signin/google-signin`) en lugar de un `redirect_uri` con esquema personalizado; DEBE configurarse con el `webClientId` y el cliente Android respaldado por `google-services.json` (package + SHA-1). Un `redirect_uri` personalizado en Android NO es válido y produce `400 invalid_request`.

#### Ciclo de vida de la familia

- **FR-012**: Todo usuario con rol familiar Padre o Madre DEBE recibir automáticamente el rol de permiso Administrador al crear o unirse a una familia.
- **FR-013**: La familia SOLO puede eliminarse cuando tiene exactamente 1 integrante activo; en ese caso, el integrante puede confirmar **Eliminar familia**.
- **FR-014**: Eliminar una familia DEBE aplicar **soft delete** (estado `eliminada`, sin borrado físico), conservar el historial y el acceso del usuario, convertir su cuenta en **perfil individual** y redirigirlo al inicio del flujo principal.
- **FR-015**: Cuando la familia tenga más de 1 integrante activo, el sistema NO DEBE permitir eliminarla, ni siquiera al Administrador; solo DEBE ofrecer **Abandonar familia** a todos los integrantes.
- **FR-016**: Al abandonar una familia, el usuario DEBE quedar sin grupo, conservar su cuenta e historial y ser redirigido al flujo de selección/creación/unión de grupo.
- **FR-017**: Si la familia queda sin administradores porque el Padre y la Madre abandonaron, el backend DEBE asignar automáticamente el rol Administrador al integrante con el `created_at` más antiguo en la membresía.
- **FR-018**: Las acciones de eliminar y abandonar familia DEBEN requerir confirmación explícita y registrar la transición de estado correspondiente.

### Key Entities *(include if feature involves data)*

- **Usuario (User)**: Representa a una persona autenticada. Atributos: id, google_id, nombre_visualizacion, foto_avatar, fecha_creacion. Relación: pertenece a un Grupo Familiar a través de una membresía.
- **Grupo Familiar (Family)**: Núcleo familiar. Atributos: id, nombre, moneda_local, fecha_creacion, creado_por (user_id), estado (activo|eliminado), fecha_eliminacion (opcional). Límite máximo de 10 miembros activos. La eliminación es lógica (soft delete) y conserva el historial.
- **Membresía (Membership)**: Relación entre Usuario y Grupo Familiar con roles y metadatos. Atributos: id, user_id, family_id, rol_familiar (padre|madre|hijo|hija), rol_permiso (admin|member), parentesco (opcional), fecha_union (`created_at`), estado (activo/inactivo). El `created_at` más antiguo determina la reasignación de Administrador.
- **Invitación (Invitation)**: Código de invitación generado por un Administrador. Atributos: id, family_id, codigo, generado_por, fecha_creacion, expira_en (creación + 7 días), usado (boolean), fecha_uso (opcional), estado. Cada código es de un solo uso; la UI expone únicamente el código, no un enlace.
- **Perfil individual**: Cuenta de usuario sin grupo familiar activo tras un soft delete; conserva historial y acceso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden autenticarse con Google y obtener acceso al sistema en menos de 10 segundos.
- **SC-002**: 100% de las peticiones a endpoints protegidos sin JWT válido son rechazadas con código 401 Unauthorized.
- **SC-003**: El sistema previene correctamente la creación de un segundo grupo para un usuario que ya tiene un grupo asociado (100% de los casos).
- **SC-004**: El sistema rechaza el 100% de las solicitudes de unión cuando el grupo ya alcanzó los 10 miembros activos, retornando código 400 Bad Request.
- **SC-005**: Solo los usuarios con rol Administrador pueden generar códigos de invitación, promover miembros o expulsarlos (100% de las acciones restringidas son correctamente denegadas a Miembros).
- **SC-006**: Todo usuario sin grupo es redirigido obligatoriamente al flujo de selección de grupo antes de acceder a funcionalidades financieras.
- **SC-007**: El 100% de los usuarios con rol familiar Padre o Madre reciben el rol Administrador al crear o unirse a una familia.
- **SC-008**: Una familia solo puede eliminarse cuando tiene exactamente 1 integrante activo; con más integrantes, el 100% de los intentos de eliminación son rechazados y solo se ofrece abandonar.
- **SC-009**: Tras un soft delete, el 100% de los usuarios conserva su historial y acceso como perfil individual y es redirigido al inicio del flujo principal.
- **SC-010**: En el 100% de las familias que quedan sin administradores, el integrante con la membresía más antigua recibe automáticamente el rol Administrador.
- **SC-011**: El 100% de los códigos de invitación son de un solo uso y expiran a los 7 días; los códigos usados o expirados son rechazados.

## Assumptions

- Se asume que Google Sign-In está disponible y configurado tanto para Web como para Móvil.
- Se asume que los JWT propios seguirán el patrón Access Token + Refresh Token según lo especificado.
- Se asume que los códigos de invitación son únicos, verificables, de un solo uso y expiran a los 7 días.
- Se asume que el estado de membresía distingue entre miembros activos e inactivos para el conteo del límite de 10 integrantes.
- Se asume que la moneda local se define al crear el grupo y es válida según el contexto de uso.
- Se asume que el rol familiar Padre o Madre implica automáticamente el rol de permiso Administrador.
- Se asume que el soft delete permite conservar el historial y el acceso del usuario sin mantener la familia activa.
- Se asume que la reasignación de Administrador usa el `created_at` de la membresía más antigua como criterio determinista.
- El inicio del flujo principal para un usuario sin grupo es la pantalla de selección/creación/unión de grupo.
