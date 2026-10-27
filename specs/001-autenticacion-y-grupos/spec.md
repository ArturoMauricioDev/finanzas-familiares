# Feature Specification: Autenticación, Registro y Gestión de Grupos Familiares

**Feature Branch**: `001-auth-family-groups`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: Autenticación, Registro y Gestión de Grupos Familiares

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

Como usuario autenticado sin grupo, quiero elegir entre crear un nuevo grupo familiar o unirme a uno existente mediante un enlace directo.

**Why this priority**: Todo usuario debe pertenecer obligatoriamente a un grupo familiar para utilizar las funcionalidades financieras colaborativas.

**Independent Test**: Puede probarse con un usuario autenticado sin grupo asociado, verificando que se le presentan ambas opciones y que debe seleccionar una para continuar.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado sin grupo vinculado, **When** intenta acceder al sistema, **Then** el sistema le presenta obligatoriamente las opciones "Crear nuevo grupo familiar" o "Unirme mediante enlace".
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

### User Story 5 - Gestión de integrantes del grupo (Priority: P5)

Como Administrador, quiero gestionar a los integrantes del grupo (hasta un límite máximo de 10 miembros), asignando parentescos (ej. hijo/hija) o promoviendo a otros miembros al rol de Administrador.

**Why this priority**: Permite al administrador controlar la composición y roles del núcleo familiar.

**Independent Test**: Puede probarse generando un enlace de invitación, uniéndose con otro usuario, verificando límites de miembros, y probando las acciones exclusivas del administrador.

**Acceptance Scenarios**:

1. **Given** un Administrador de un grupo con espacio disponible, **When** genera y comparte un enlace de invitación, **Then** otros usuarios pueden unirse al grupo mediante ese enlace.
2. **Given** un usuario se une mediante enlace a un grupo con menos de 10 miembros activos, **When** completa la unión, **Then** ingresa con rol "member" por defecto y puede asignar una etiqueta de parentesco.
3. **Given** un grupo con 10 miembros activos, **When** se intenta unirse mediante un enlace de invitación, **Then** el backend retorna error HTTP 400 Bad Request indicando que se ha alcanzado el límite permitido.
4. **Given** un Administrador, **When** gestiona integrantes, **Then** puede promover a otros miembros al rol de Administrador y expulsar o dar de baja a miembros del grupo.

---

### Edge Cases

- **Límite de miembros alcanzado**: Al intentar unirse a un grupo que ya tiene 10 integrantes activos, el sistema debe rechazar la solicitud con código 400.
- **Intento de crear segundo grupo**: Un usuario que ya pertenece a un grupo activo no puede crear otro grupo.
- **Token de Google inválido**: Si el token de Google no es válido, la autenticación debe fallar.
- **JWT propio inválido o ausente**: Cualquier petición a endpoints protegidos sin un JWT válido debe retornar 401 Unauthorized.
- **Usuario sin grupo intenta acceder a funcionalidades protegidas**: Debe ser redirigido obligatoriamente al flujo de selección/creación/unión de grupo.
- **Enlace de invitación inválido o expirado**: Debe rechazarse con un error apropiado.
- **Restricción de grupo único**: Un usuario solo puede pertenecer a un único grupo familiar activo a la vez.

## Requirements *(mandatory)*

### Functional Requirements

#### Autenticación, JWT y Perfil
- **FR-001**: El sistema DEBE permitir la autenticación exclusiva mediante Google Sign-In (Gmail) tanto en la aplicación Web (Next.js) como en la aplicación Móvil (React Native / Expo).
- **FR-002**: Tras validar el token de Google en el backend, FastAPI DEBE emitir un JWT de sesión interno conteniendo las claims necesarias (user_id, family_id, role).
- **FR-003**: Si es el primer ingreso del usuario, el sistema DEBE solicitar la configuración inicial para definir su Nombre de Visualización y Foto Avatar.

#### Núcleo Familiar y Asociación
- **FR-004**: Todo usuario autenticado que no esté vinculado a un grupo DEBE seleccionar obligatoriamente una de dos opciones: "Crear nuevo grupo familiar" o "Unirme mediante enlace".
- **FR-005**: Al crear un grupo, el sistema DEBE registrar el nombre de la familia y la moneda local. El creador DEBE convertirse automáticamente en Administrador (Padre/Madre).
- **FR-006**: Al unirse a un grupo, el acceso DEBE realizarse mediante un enlace directo de invitación generado por un Administrador.
- **FR-007**: Un usuario SOLO puede pertenecer a un (1) único grupo familiar activo a la vez.
- **FR-008**: El número máximo de miembros permitidos por grupo familiar es de 10 integrantes. El backend DEBE rechazar nuevas incorporaciones al alcanzar este límite.

#### Gestión de Roles y Permisos
- **FR-009**: Por defecto, cualquier usuario que se una mediante enlace DEBE ingresar con el rol de Miembro, con la opción de asignar una etiqueta de parentesco (ej. hijo/hija).
- **FR-010**: Los usuarios con rol de Administrador (Padre/Madre) DEBEN tener facultades exclusivas para: generar y compartir el enlace de invitación, promover a otros miembros al rol de Administrador, y expulsar o dar de baja a miembros del grupo.

### Key Entities *(include if feature involves data)*

- **Usuario (User)**: Representa a una persona autenticada. Atributos: id, google_id, nombre_visualizacion, foto_avatar, fecha_creacion. Relación: pertenece a un Grupo Familiar a través de una membresía.
- **Grupo Familiar (Family)**: Núcleo familiar. Atributos: id, nombre, moneda_local, fecha_creacion, creado_por (user_id). Límite máximo de 10 miembros activos.
- **Membresía (Membership)**: Relación entre Usuario y Grupo Familiar con rol y metadatos. Atributos: id, user_id, family_id, role (admin|member), parentesco (opcional), fecha_union, estado (activo/inactivo).
- **Invitación (Invitation)**: Enlace de invitación generado por un Administrador. Atributos: id, family_id, token, generado_por, fecha_creacion, expira_en, usado (boolean).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden autenticarse con Google y obtener acceso al sistema en menos de 10 segundos.
- **SC-002**: 100% de las peticiones a endpoints protegidos sin JWT válido son rechazadas con código 401 Unauthorized.
- **SC-003**: El sistema previene correctamente la creación de un segundo grupo para un usuario que ya tiene un grupo asociado (100% de los casos).
- **SC-004**: El sistema rechaza el 100% de las solicitudes de unión cuando el grupo ya alcanzó los 10 miembros activos, retornando código 400 Bad Request.
- **SC-005**: Solo los usuarios con rol Administrador pueden generar enlaces de invitación, promover miembros o expulsarlos (100% de las acciones restringidas son correctamente denegadas a Miembros).
- **SC-006**: Todo usuario sin grupo es redirigido obligatoriamente al flujo de selección de grupo antes de acceder a funcionalidades financieras.

## Assumptions

- Se asume que Google Sign-In está disponible y configurado tanto para Web como para Móvil.
- Se asume que los JWT propios seguirán el patrón Access Token + Refresh Token según lo especificado.
- Se asume que los enlaces de invitación tienen un mecanismo de token único y verificable.
- Se asume que el estado de membresía distingue entre miembros activos e inactivos para el conteo del límite de 10 integrantes.
- Se asume que la moneda local se define al crear el grupo y es válida según el contexto de uso.
