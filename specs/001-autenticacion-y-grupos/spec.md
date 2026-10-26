# Feature Specification: Autenticación, Registro y Gestión de Grupos Familiares

**Feature Branch**: `001-autenticacion-y-grupos`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Registro con verificación de correo Gmail, configuración de perfil, creación o unión a un grupo familiar único de hasta 10 integrantes, y gestión de roles y permisos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro, verificación de correo y perfil inicial (Priority: P1)

Un nuevo usuario se registra con su correo de Gmail, recibe un código OTP o un enlace de activación en su bandeja de entrada, verifica su identidad y configura su nombre visible y avatar antes de acceder por primera vez.

**Why this priority**: Sin una identidad verificada y un perfil configurado no es posible acceder de forma segura ni vincularse a un grupo familiar. Es la puerta de entrada al resto del producto.

**Independent Test**: Un usuario nuevo puede registrarse, verificar su correo y guardar su perfil; un usuario no verificado no puede iniciar sesión. Entrega una cuenta verificada lista para el siguiente paso.

**Acceptance Scenarios**:

1. **Given** una persona sin cuenta, **When** se registra con un correo de Gmail válido, **Then** el sistema crea la cuenta en estado pendiente de verificación y envía un mensaje con OTP o enlace de activación.
2. **Given** una cuenta pendiente de verificación, **When** el usuario intenta iniciar sesión, **Then** el sistema deniega el acceso con un mensaje claro e indica que debe completar la verificación por correo (AC01).
3. **Given** un OTP o enlace de verificación válido, **When** el usuario completa la verificación, **Then** la cuenta queda activa y el sistema muestra la pantalla de configuración inicial del perfil.
4. **Given** un usuario verificado en la pantalla de perfil, **When** guarda un nombre visible y un avatar, **Then** el perfil queda registrado y el usuario puede continuar con la vinculación familiar.
5. **Given** un usuario verificado que decide no cargar avatar, **When** guarda su nombre visible, **Then** el sistema asigna una imagen predeterminada y permite continuar.
6. **Given** un OTP o enlace inválido o vencido, **When** el usuario intenta verificar su cuenta, **Then** el sistema rechaza la verificación y mantiene la cuenta sin acceso.

---

### User Story 2 - Elección de vinculación y unión mediante enlace (Priority: P2)

Un usuario autenticado, con perfil configurado y sin grupo activo, elige entre crear un nuevo grupo familiar o unirse a uno existente mediante un enlace directo de invitación. Si se une, ingresa como Miembro y puede indicar opcionalmente su parentesco.

**Why this priority**: Permite la colaboración familiar y es la vía de incorporación más rápida para la mayoría de los integrantes.

**Independent Test**: Un usuario sin grupo puede elegir una de las dos opciones; un enlace válido lo incorpora como Miembro, mientras que enlaces inválidos, grupos llenos o usuarios ya vinculados son rechazados. Entrega una membresía familiar funcional.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con perfil y sin grupo activo, **When** llega al paso de vinculación familiar, **Then** el sistema le exige elegir obligatoriamente entre "Crear nuevo grupo familiar" y "Unirme mediante enlace" antes de continuar.
2. **Given** un enlace de invitación válido, un grupo con menos de 10 integrantes y un usuario sin grupo activo, **When** el usuario acepta la invitación, **Then** el sistema lo incorpora como Miembro y guarda el parentesco opcional si fue indicado.
3. **Given** un usuario que ya pertenece a un grupo activo, **When** intenta unirse a otro grupo mediante un enlace, **Then** el sistema rechaza la incorporación e indica que primero debe salir o ser eliminado del grupo actual (AC02).
4. **Given** un grupo que ya tiene 10 integrantes, **When** se utiliza un enlace de invitación para incorporar a otra persona, **Then** el sistema rechaza la incorporación con un mensaje claro de que se alcanzó el límite familiar (AC03).
5. **Given** un enlace de invitación inválido o no vigente, **When** el usuario intenta unirse, **Then** el sistema rechaza la incorporación sin revelar datos del grupo.

---

### User Story 3 - Creación del grupo familiar (Priority: P3)

Un Administrador crea el núcleo familiar definiendo el nombre del grupo y la moneda local, y asume automáticamente el rol de Administrador.

**Why this priority**: El grupo familiar es la unidad que contiene presupuestos, categorías y transacciones; su creación habilita la configuración financiera y las invitaciones.

**Independent Test**: Un usuario sin grupo crea un grupo con nombre y moneda válidos y queda como Administrador; un segundo intento de creación es rechazado. Entrega un grupo operativo con moneda definida.

**Acceptance Scenarios**:

1. **Given** un usuario con perfil y sin grupo activo, **When** crea un grupo con nombre de familia y moneda local válidos, **Then** el sistema crea el grupo, lo vincula como Administrador y fija la moneda para todos los registros del grupo.
2. **Given** un usuario que ya pertenece a un grupo activo, **When** intenta crear un segundo grupo, **Then** el sistema rechaza la creación e indica que solo puede pertenecer a un grupo activo a la vez (AC02).
3. **Given** un usuario sin grupo, **When** intenta crear un grupo sin nombre o sin moneda, **Then** el sistema rechaza la creación y solicita completar los datos obligatorios.
4. **Given** un grupo creado, **When** un Administrador consulta la configuración, **Then** la moneda local se muestra como la moneda única del grupo y no puede cambiarse en esta iteración.

---

### User Story 4 - Gestión de integrantes, roles y permisos (Priority: P4)

Un Administrador gestiona a los integrantes del grupo, hasta un máximo de 10, asigna parentescos, promueve a otros miembros al rol de Administrador, expulsa miembros y genera el enlace de invitación.

**Why this priority**: Mantiene la gobernanza, la seguridad y la capacidad del grupo después de su creación.

**Independent Test**: Un Administrador puede generar el enlace, promover y expulsar miembros; un Miembro no puede ejecutar esas acciones y el grupo nunca supera los 10 integrantes. Entrega administración completa del grupo.

**Acceptance Scenarios**:

1. **Given** un Administrador de un grupo con capacidad disponible, **When** genera el enlace de invitación, **Then** el sistema lo habilita para compartir con personas elegibles.
2. **Given** un Administrador y un Miembro del mismo grupo, **When** el Administrador promueve al Miembro, **Then** el miembro adquiere todas las facultades de Administrador.
3. **Given** un Administrador y un Miembro del mismo grupo, **When** el Administrador expulsa al Miembro, **Then** el miembro pierde acceso a los datos del grupo y libera su lugar.
4. **Given** un Miembro sin rol de Administrador, **When** intenta generar una invitación, promover a otro miembro o expulsar a alguien, **Then** el sistema deniega la acción con un mensaje claro.
5. **Given** un integrante que desea salir de su grupo, **When** confirma la salida, **Then** deja de tener acceso al grupo y libera su lugar para otra incorporación.
6. **Given** un grupo con un solo Administrador, **When** ese Administrador intenta salir o ser expulsado, **Then** el sistema lo impide hasta que exista otro Administrador.

---

### Edge Cases

- Un OTP o enlace de verificación inválido o vencido mantiene la cuenta sin acceso.
- Un registro con un correo ya verificado no crea una segunda cuenta.
- Un perfil sin avatar se completa con una imagen predeterminada; un nombre de visualización vacío impide guardar el perfil.
- Un nombre de grupo vacío o una moneda no seleccionada impide crear el grupo.
- Un enlace de invitación usado por un usuario que ya pertenece a un grupo activo es rechazado.
- Un enlace de invitación usado cuando el grupo tiene 10 integrantes es rechazado y no altera la composición del grupo.
- Un enlace inválido o no vigente no otorga acceso ni revela información del grupo.
- Varias aceptaciones simultáneas de invitación nunca hacen que un grupo supere los 10 integrantes.
- Un integrante expulsado o que sale libera su lugar, pierde acceso y puede crear o unirse a otro grupo.
- La promoción de un Miembro a Administrador es efectiva de inmediato; el grupo debe conservar al menos un Administrador en todo momento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir el registro e inicio de sesión mediante credenciales vinculadas a una dirección de correo de Gmail.
- **FR-002**: El sistema DEBE enviar obligatoriamente un correo de verificación con un código OTP o un enlace de activación a toda cuenta nueva; la cuenta DEBE permanecer sin acceso hasta que la verificación sea exitosa.
- **FR-003**: Tras la verificación exitosa del correo, el sistema DEBE presentar la pantalla de configuración inicial para capturar el nombre de visualización y la foto avatar del usuario.
- **FR-004**: Una vez configurado el perfil, el usuario que no pertenezca a un grupo DEBE elegir obligatoriamente entre crear un nuevo grupo familiar o unirse mediante enlace antes de acceder a la aplicación.
- **FR-005**: Al crear un grupo, el sistema DEBE solicitar el nombre de la familia y la moneda local; el creador DEBE convertirse automáticamente en Administrador (Padre/Madre).
- **FR-006**: Al unirse a un grupo, el usuario DEBE acceder mediante un enlace directo de invitación generado por un Administrador.
- **FR-007**: Un usuario DEBE pertenecer como máximo a un grupo familiar activo a la vez; para crear o unirse a otro, DEBE salir o ser eliminado del grupo actual.
- **FR-008**: Un grupo familiar DEBE admitir como máximo 10 integrantes; el sistema DEBE bloquear toda incorporación que supere ese límite, incluso si varias invitaciones se aceptan simultáneamente.
- **FR-009**: Los usuarios que se unan mediante enlace DEBEN ingresar con el rol de Miembro y PUEDEN especificar opcionalmente una etiqueta de parentesco.
- **FR-010**: Los Administradores DEBEN tener facultades exclusivas para generar y compartir el enlace de invitación, promover a miembros al rol de Administrador y expulsar o dar de baja a miembros.
- **FR-011**: Al crear el grupo se DEBE definir una única moneda local que aplique a todos sus registros; la moneda DEBE mantenerse fija durante la vida del grupo en esta iteración.
- **FR-012**: Un integrante DEBE poder salir voluntariamente de su grupo activo; al hacerlo, DEBE perder el acceso a los datos del grupo y liberar su lugar.
- **FR-013**: El sistema DEBE impedir que un grupo quede sin al menos un Administrador; el último Administrador no puede salir ni ser expulsado hasta que otro miembro sea promovido.
- **FR-014**: Un integrante expulsado DEBE perder inmediatamente el acceso a la información del grupo y dejar de contar para el límite de integrantes.
- **FR-015**: Los Miembros sin rol de Administrador NO DEBEN poder generar invitaciones, promover integrantes ni expulsar miembros.
- **FR-016**: El sistema DEBE rechazar cualquier intento de crear o unirse a un segundo grupo activo con un mensaje claro y accionable.
- **FR-017**: El sistema DEBE rechazar el uso de una invitación cuando el grupo ya alcanzó los 10 integrantes, indicando que se alcanzó el límite familiar.
- **FR-018**: El sistema DEBE rechazar enlaces de verificación o invitación inválidos o no vigentes sin otorgar acceso ni revelar información del grupo.
- **FR-019**: El nombre de visualización DEBE ser obligatorio; el avatar PUEDE omitirse y, en ese caso, el sistema DEBE asignar una imagen predeterminada.
- **FR-020**: El nombre del grupo y la moneda local DEBEN ser obligatorios y validarse antes de crear el grupo.

### Key Entities *(include if feature involves data)*

- **Cuenta de Usuario**: identidad de acceso asociada a una dirección de correo de Gmail; incluye estado de verificación (pendiente o verificada) y es única por correo verificado.
- **Perfil de Usuario**: información visible del usuario; incluye nombre de visualización y avatar, o una imagen predeterminada.
- **Grupo Familiar**: unidad de colaboración; incluye nombre, moneda local única, capacidad máxima de 10 integrantes y estado activo.
- **Membresía**: vínculo entre un usuario y un grupo; incluye rol (Administrador o Miembro), parentesco opcional y estado (activa, salida o expulsada). Un usuario tiene como máximo una membresía activa.
- **Enlace de Invitación**: enlace directo asociado a un grupo, generado por un Administrador, que permite incorporar usuarios elegibles mientras exista capacidad.
- **Verificación de Correo**: proceso pendiente asociado a una cuenta; incluye el OTP o enlace de activación y su estado de validez.

Un Grupo Familiar tiene entre 1 y 10 Membresías activas; cada Membresía pertenece a un único usuario y a un único grupo; cada usuario puede tener como máximo una Membresía activa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de los usuarios nuevos completa el registro, la verificación de correo y la configuración del perfil en el primer intento en un plazo de 5 minutos.
- **SC-002**: El 100% de las cuentas con correo no verificado queda bloqueado del acceso a la aplicación.
- **SC-003**: El 100% de los intentos de crear o unirse a un segundo grupo activo es rechazado con un mensaje claro.
- **SC-004**: El 100% de los intentos de incorporación a un grupo con 10 integrantes es rechazado y ningún grupo supera los 10 integrantes.
- **SC-005**: Al menos el 95% de los usuarios que inicia el registro recibe el mensaje de verificación en un plazo de 2 minutos.
- **SC-006**: Al menos el 95% de los usuarios invitados con cuenta verificada y perfil completo logra unirse a un grupo con capacidad disponible en el primer intento.
- **SC-007**: El 100% de los intentos de un Miembro de generar invitaciones, promover o expulsar integrantes es denegado.
- **SC-008**: Un Administrador puede promocionar o expulsar a un integrante en menos de 2 minutos.

## Assumptions

- **Método de acceso**: "Gmail" se interpreta como la dirección de correo utilizada para el registro e inicio de sesión; se asume autenticación con correo y contraseña más verificación por OTP o enlace. No se asume inicio de sesión federado con Google en esta iteración.
- **Invitaciones**: el destinatario debe tener una cuenta verificada y el perfil completo antes de unirse. El enlace puede reutilizarse por varios usuarios elegibles mientras el grupo tenga capacidad; no se define expiración ni revocación en esta iteración.
- **Límite**: el máximo de 10 integrantes incluye tanto a Administradores como a Miembros.
- **Perfil**: el nombre de visualización es obligatorio; el avatar es opcional y usa una imagen predeterminada si no se carga.
- **Moneda**: se selecciona de un catálogo predefinido de monedas locales y queda fija para el grupo; no se admite cambio en esta iteración.
- **Salida y expulsión**: cualquier integrante puede salir; un Administrador puede expulsar a otro integrante siempre que el grupo conserve al menos un Administrador.
- **Verificación**: los OTP y enlaces de verificación tienen vigencia limitada; el plazo concreto se definirá en la fase de planificación.
- **Duplicados**: no se permite más de una cuenta asociada a un correo verificado.
- **Concurrencia**: el límite de 10 integrantes debe respetarse aun cuando varias invitaciones se acepten al mismo tiempo.
- **Dependencia externa**: el envío de correos de verificación depende de un servicio de correo electrónico configurado; su selección se definirá en la fase de planificación.
- **Errores**: conforme a la constitución, los rechazos se comunican con códigos HTTP semánticos y mensajes claros en la interfaz; el límite familiar se reporta como `400 Bad Request`.
- **Alcance excluido**: no incluye integraciones bancarias, captura de SMS o correos, pasarelas de pago ni exportación de reportes PDF, conforme a los No-Objetivos de la constitución.
