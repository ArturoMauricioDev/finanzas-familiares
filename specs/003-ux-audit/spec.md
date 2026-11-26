# Feature Specification: Ciclo de vida de la familia (Día 1)

**Feature Branch**: `003-ux-audit`

**Created**: 2026-11-19

**Status**: B1 implementado · B2 pendiente

**Input**: User description: "B2: el rol viaja en el código de invitación; spec nueva de 003 con el
ciclo de familia (B1 + B2). Las finanzas se desarrollan después (spec 004); esta etapa cubre solo
el ciclo de vida de la familia."

## Clarifications

### Session 2026-11-19

- Q: ¿Cuál debe ser la acción primaria en la pantalla de elegir familia después del login? → A: Contextual: con código de invitación pendiente, "unirme" es primaria; sin código, "crear" es primaria.

### Session 2026-11-20

- Q: ¿Qué opciones debe ofrecer el selector de rol al invitar a una persona y qué permiso otorga cada una? → A: Padre y Madre administran; Hijo, Hija, Tío, Abuelo y Otro entran como miembros. Al elegir **Otro** se muestra y exige el vínculo familiar; con cualquier otra opción el campo no se muestra ni se envía.
- **Copy acordado**: la acción para crear la familia se rotula **Crear familia** (no "crear grupo") y la invitación en Home se rotula **Agregar integrantes a tu familia** (no "Invita a tu familia").
- Q: ¿Debe la spec fijar explícitamente que el login es siempre la primera pantalla y que el ciclo de familia (elegir, crear, unirse) es inaccesible sin sesión? → A: Sí; sin sesión la persona ve el login y nunca las pantallas del ciclo, en web y móvil.
- Q: Cuando alguien abre un enlace de invitación sin tener sesión, ¿cuál debe ser el orden correcto de entrada? → A: Login primero conservando el código; tras autenticarse va directo a **Unirme**, sin pasar por la elección de familia.
- Q: En el primer acceso, ¿dónde debe colocarse el perfil mínimo dentro de la secuencia de entrada? → A: Antes del ciclo de familia, solo si falta (login → perfil → ciclo de familia → Home).

### Session 2026-11-25

- Q: ¿Cómo se guía la creación de familia? → A: wizard de **3 pasos** (Nombre → Moneda → Rol + resumen), una sola acción primaria por paso; sigue siendo una **ruta única** con estado en cliente.
- Q: ¿Se conserva el borrador entre recargas? → A: sí, con **zustand + `persist`** (piloto de la decisión de estado para spec 004); se limpia al crear o al descartar.
- Q: ¿Cambia el contrato backend? → A: no; `POST /families` se llama una sola vez al confirmar el último paso.

### Session 2026-11-26

- Q: ¿Cómo debe dejar de mostrarse a quien invitó un código que ya fue aceptado? → A: con un endpoint de consulta: la pantalla de Miembros vuelve a consultar el estado de la invitación guardada y, si ya fue usada, deja de mostrarla y ofrece generar otra.
- Q: ¿Cómo se llama la sección de la familia en la interfaz? → A: **Familia** (antes "Miembros"): se cambia la etiqueta de navegación y el acceso desde Home a "Ver familia"; el encabezado interno sigue siendo "Integrantes".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar y entender para qué sirve Kitho (Priority: P1)

Una persona abre Kitho por primera vez. Antes de pedirle una cuenta, la pantalla le dice qué es
Kitho hoy (el lugar de la familia para organizarse), qué llegará después (finanzas y presupuestos,
en camino) y qué ocurre con sus datos. Entra con Google y continúa.

**Why this priority**: sin esta explicación la primera pantalla es una barrera de confianza y el
producto promete algo que todavía no existe.

**Independent Test**: una persona que solo ve la pantalla de entrada puede decir en una frase qué
hace Kitho y qué no hace todavía.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión, **When** abre la app, **Then** ve la promesa de organización,
   la mención de finanzas "en camino", una sola acción de acceso y una nota de confianza.
2. **Given** una persona sin sesión, **When** activa el acceso con Google y es nueva, **Then**
   continúa al perfil mínimo (solo si falta), nunca a Home.
3. **Given** una persona sin sesión, **When** el acceso falla, **Then** ve un mensaje claro con
   opción de reintentar.
4. **Given** una persona sin sesión, **When** intenta abrir directamente una pantalla del ciclo de
   familia, **Then** es enviada al login y no ve esa pantalla.

---

### User Story 2 - Crear la familia o unirse con un código (Priority: P1)

Una persona con sesión y sin familia elige entre crear una familia o unirse con un código. Cada
opción declara su consecuencia antes de elegir: crear implica nombre, moneda única y ser
administrador; unirse implica que el rol lo define quien invita.

**Why this priority**: es el único camino para llegar a Home; si se elige mal, el error aparece
después y cuesta corregirlo.

**Independent Test**: se puede probar cada camino por separado y ambos terminan en Home con una
familia activa.

**Acceptance Scenarios**:

1. **Given** una persona sin familia, **When** crea una familia, **Then** queda como administrador
   con el rol padre o madre, la familia tiene una moneda única y llega a Home.
2. **Given** una persona sin familia, **When** abre "unirme", **Then** solo se le pide el código;
   no se le piden rol ni parentesco.
3. **Given** una persona sin familia, **When** introduce un código válido, **Then** entra en esa
   familia con el rol declarado en el código y llega a Home.
4. **Given** una persona sin familia, **When** el código está usado, caducado o no existe,
   **Then** ve el motivo concreto y puede corregir o volver a elegir.
5. **Given** una persona sin familia que llegó con un código de invitación pendiente, **When** ve
   la pantalla de elegir familia, **Then** "unirme con un código" es la acción primaria y el código
   aparece listo para confirmar.

---

### User Story 3 - Invitar declarando el rol de la persona invitada (Priority: P1)

Quien administra la familia genera un código de un solo uso e indica quién va a entrar: padre,
madre, hijo, hija, tío, abuelo u otro. Si elige **Otro**, indica el vínculo familiar; en cualquier
otra opción ese campo no se muestra. Quien se une no vuelve a elegir rol.

**Why this priority**: define los permisos de cada integrante en el momento correcto, sin pedirle
datos de modelo a quien solo quiere entrar.

**Independent Test**: con dos cuentas, se genera un código con cada rol y se verifica el permiso
con el que entra la segunda cuenta.

**Acceptance Scenarios**:

1. **Given** una persona administradora, **When** genera un código con rol padre o madre,
   **Then** quien lo use entra como administrador de esa familia.
2. **Given** una persona administradora, **When** genera un código con rol hijo o hija,
   **Then** quien lo use entra como miembro, sin permisos de administración.
3. **Given** una persona que no administra, **When** entra a la pantalla de invitación,
   **Then** ve por qué no puede invitar y quién sí puede.
4. **Given** un código ya emitido antes de este cambio (sin rol declarado), **When** alguien lo
   usa, **Then** entra como miembro y la lista lo muestra como "Miembro".
5. **Given** una persona administradora que elige **Otro** como rol, **When** completa la
   invitación, **Then** el campo vínculo familiar aparece y es obligatorio; si elige cualquier
   otro rol, el campo no aparece ni se envía.

---

### User Story 4 - Volver a entrar cuando ya hay familia (Priority: P2)

Una persona que ya pertenece a una familia abre la app y llega directo a Home, donde ve el estado
de su familia y qué le falta hacer. Las finanzas se anuncian como próximas, no como disponibles.

**Why this priority**: el regreso no debe pagar el costo del onboarding otra vez.

**Independent Test**: con una cuenta con familia, abrir la app lleva a Home sin pasar por el ciclo
de familia.

**Acceptance Scenarios**:

1. **Given** una persona con familia, **When** entra, **Then** llega a Home directamente.
2. **Given** una persona con familia, **When** abre Home, **Then** ve el estado de la familia y la
   sección financiera como "en camino", nunca con datos simulados.
3. **Given** una persona con familia, **When** intenta abrir una pantalla del ciclo de familia,
   **Then** se le redirige a Home.

---

### User Story 5 - Crear la familia en pasos guiados (Priority: P2)

Una persona con sesión y sin familia elige crear. En lugar de un único formulario, avanza en tres
pasos: pone el nombre, elige la moneda (y entiende que no se puede cambiar) y confirma su rol con un
resumen antes de crear. Puede volver atrás sin perder lo escrito o salir descartando el borrador.

**Why this priority**: es una refinación del alta de familia (no un camino nuevo); guía las dos
consecuencias que más se malentienden —moneda única e irreversible, y rol padre/madre = administrador—
y reduce errores, pero el formulario único ya cumple el objetivo.

**Independent Test**: completar el wizard con nombre vacío (bloquea en el paso 1), moneda inválida
(bloquea en el paso 2) y confirmar el rol; el resultado crea la familia y llega a Home.

**Acceptance Scenarios**:

1. **Given** una persona sin familia en el alta, **When** abre crear familia, **Then** ve el paso 1
   (nombre) con la única acción primaria "Continuar", y el progreso "Paso 1 de 3".
2. **Given** el paso 1, **When** el nombre está vacío o supera 120, **Then** "Continuar" está
   deshabilitado y, si se fuerza, aparece error local.
3. **Given** el paso 2, **When** entra, **Then** ve la consecuencia "no se puede cambiar" antes del
   control y, si la detección automática falla, puede elegir la moneda manualmente.
4. **Given** el paso 3, **When** confirma, **Then** ve el resumen (nombre y moneda), elige padre/madre
   y la acción final **Crear familia** crea la familia una sola vez y lleva a Home.
5. **Given** cualquier paso > 1, **When** pulsa "Atrás", **Then** vuelve al paso anterior con los
   valores intactos.
6. **Given** un borrador con datos, **When** pulsa "Salir", **Then** se pide confirmación y, al
   aceptar, el borrador se descarta.
7. **Given** una recarga a mitad del wizard, **When** vuelve, **Then** retoma el paso y los valores
   guardados.

---

### Edge Cases

- Código inexistente, ya usado o caducado: mensaje específico y salida (corregir o volver).
- Código ya aceptado: para quien lo emitió deja de mostrarse como activo en cuanto vuelve a la
  pantalla; se le ofrece generar uno nuevo.
- Código válido pero la familia ya tiene 10 integrantes activos: se impide la unión y se explica.
- Persona que ya pertenece a una familia intenta unirse con un código: se impide con mensaje claro.
- Doble envío (doble toque/doble clic) al crear o unirse: la acción se ejecuta una sola vez.
- Sin conexión o respuesta lenta: mensaje distinto del error del servidor y opción de reintentar.
- Código resaltado por mayúsculas/minúsculas o con espacios: se normaliza antes de validar.
- Idioma español o inglés: toda la cadena existe en ambos; nunca se muestra una clave cruda.
- Lector de pantalla: la carga, el error y el éxito se anuncian; el error de código se asocia al
  campo correspondiente.
- Familia cuyo único administrador abandona: la familia conserva al menos un administrador.
- Persona sin sesión que abre directamente una pantalla del ciclo (enlace o historial): se le lleva
  al login; si traía un código de invitación, se conserva y, tras entrar, va a "Unirme".
- Detección de moneda lenta o fallida en el wizard: no bloquea; permite elegir la moneda manualmente
  y reintentar.
- Recarga a mitad del wizard de creación: reanuda el paso y los valores persistidos; un borrador
  corrupto se ignora y se arranca en el paso 1.
- Familia creada en otra pestaña o sesión durante el wizard: el alta responde 409/400 y se redirige
  a Home.
- Sesión caducada a mitad del wizard: se refresca y, si falla, se va al login conservando el borrador.

## Requirements *(mandatory)*

### Functional Requirements

**Entrada**

- **FR-001**: La primera pantalla con sesión ausente MUST explicar qué es Kitho hoy y MUST presentar
  las finanzas y los presupuestos como "en camino", nunca como función disponible.
- **FR-002**: La entrada MUST ofrecer una sola acción primaria de acceso y MUST declarar qué ocurre
  con los datos de la persona.
- **FR-003**: Una persona con sesión y sin familia MUST pasar por el ciclo de familia y MUST NOT
  llegar a Home.
- **FR-004**: Una persona con sesión y con familia MUST llegar a Home y MUST NOT volver a ver el
  ciclo de familia al entrar.
- **FR-005**: El perfil mínimo MUST pedirse solo cuando falte y MUST limitarse al nombre visible; la
  foto MUST NOT ser obligatoria para continuar.

**Crear familia**

- **FR-006**: Crear una familia MUST requerir un nombre de entre 1 y 120 caracteres y una moneda de
  tres letras válida.
- **FR-007**: La moneda MUST explicarse antes de crear y MUST informar que no se puede cambiar
  después.
- **FR-008**: Quien crea la familia MUST elegir su rol entre padre y madre y MUST quedar como
  administrador.

**Unirse**

- **FR-009**: Unirse MUST requerir únicamente el código; la pantalla MUST NOT pedir rol familiar ni
  parentesco.
- **FR-010**: Un código MUST ser de un solo uso, MUST caducar a los 7 días y MUST NOT permitir
  superar los 10 integrantes activos.
- **FR-011**: Quien invita MUST declarar el rol de la persona invitada entre padre, madre, hijo,
  hija, tío, abuelo u otro al generar el código.
- **FR-012**: Al unirse, la persona MUST recibir el rol declarado en el código, sin posibilidad de
  elegir otro.
- **FR-013**: Los roles padre y madre MUST otorgar administración; hijo, hija, tío, abuelo y otro
  MUST entrar como miembros sin administración.
- **FR-014**: Un código emitido sin rol declarado MUST incorporar a la persona como miembro, sin rol
  familiar, y la lista MUST mostrarla como "Miembro" (nunca "Sin nombre").
- **FR-015**: Solo quien administra MUST poder generar códigos; quien no administra MUST ver una
  explicación de quién puede y por qué.

**Estados, idioma y accesibilidad**

- **FR-016**: Cada pantalla del ciclo MUST cubrir carga inicial, carga de acción (en el control),
  vacío con acción, error con reintento, error local, sin permiso explicado, éxito local y
  offline/timeout.
- **FR-017**: Todo el texto visible MUST existir en español e inglés, sin claves sin traducir ni
  jerga del modelo de datos.
- **FR-018**: La carga, el error y el éxito MUST anunciarse a tecnologías de asistencia; en web MUST
  existir recorrido por teclado y foco visible; en móvil, objetivos táctiles de al menos 44.
- **FR-019**: Ninguna pantalla MUST introducir colores, tipografías, espaciados o radios fuera de
  los tokens del sistema visual.

**Jerarquía, feedback y sistema visual**

- **FR-020**: La pantalla de inicio MUST renderizar contenido propio (estado de la familia y qué
  hacer ahora) y MUST NOT ser un redirect vacío.
- **FR-021**: Cada pantalla MUST tener una sola acción primaria; las secundarias MUST distinguirse
  visualmente y las destructivas MUST ir separadas con confirmación que nombre el objeto afectado.
- **FR-022**: El contraste MUST ser 4.5:1 en texto y 3:1 en componentes y foco, usando únicamente
  pares `on*`/`*Container` de los tokens.
- **FR-023**: El estado seleccionado MUST exponerse a tecnologías de asistencia, no solo por color.
- **FR-024**: La interfaz MUST soportar zoom 200% y texto grande sin recorte ni solapamiento, y
  MUST respetar la preferencia de movimiento reducido.
- **FR-025**: Las fechas y los números visibles (por ejemplo, la caducidad de un código) MUST
  formatearse con el idioma activo, nunca concatenados a mano.
- **FR-026**: El feedback de éxito MUST ser local e inmediato, junto al control que lo produjo;
  MUST NOT usarse un aviso global lejano, ni introducir skeletons o toasts como patrón nuevo.
- **FR-027**: Cuando no exista un código activo, la pantalla de invitación MUST explicarlo y MUST
  ofrecer generarlo; cuando exista, MUST mostrar para qué rol es y cuándo caduca.
- **FR-028**: Las pantallas MUST verificarse en 375, 768, 1024 y 1440 de ancho en web y en iOS y
  Android en móvil, sin cards dentro de cards ni más de dos líneas por fila en listas.
- **FR-029**: La pantalla de elegir familia MUST adaptar su acción primaria al origen de la
  persona: con un código de invitación pendiente, "unirme con un código" es la primaria y el código
  ya está disponible; sin código pendiente, "crear familia" es la primaria y "me invitaron" aparece
  como secundaria explícita. En ambos casos MUST haber una sola acción primaria.
- **FR-030**: Una persona que llega con un código de invitación pendiente MUST NOT tener que pasar
  por la pantalla de elegir familia para unirse; el código MUST conservarse a través del login de
  modo que, tras autenticarse, la persona llegue directamente a **Unirme**.
- **FR-031**: El campo **Vínculo familiar** MUST mostrarse y ser obligatorio únicamente cuando el rol
  elegido sea **Otro**; con cualquier otro rol MUST ocultarse y no enviarse al backend.
- **FR-032**: La acción de crear familia MUST rotularse **Crear familia** en toda la interfaz, nunca
  "crear grupo".
- **FR-033**: La invitación en Home MUST rotularse **Agregar integrantes a tu familia**, nunca
  "Invita a tu familia".

**Orden de entrada (login → familia)**

- **FR-034**: Sin sesión, la app MUST mostrar el login como primera pantalla y MUST NOT mostrar
  ninguna pantalla del ciclo de familia (elegir, crear, unirse); el ciclo MUST exigir sesión en web
  y móvil.
- **FR-035**: La secuencia de entrada MUST respetar el orden login → perfil mínimo (solo si falta) →
  ciclo de familia → Home; el perfil MUST resolverse antes de elegir, crear o unirse.

**Crear familia (wizard)**

- **FR-036**: La creación de familia MUST presentarse como un wizard de **tres pasos**
  (Nombre → Moneda → Rol + resumen), en **una sola ruta**, y MUST mostrar una **única acción
  primaria por paso**.
- **FR-037**: El paso del nombre MUST validar entre 1 y 120 caracteres y MUST bloquear "Continuar"
  mientras el valor sea inválido.
- **FR-038**: El paso de la moneda MUST explicar, **antes** del control, que no se puede cambiar
  después, y MUST ofrecer detección automática con estado de carga y selección manual si falla.
- **FR-039**: El último paso MUST confirmar el rol entre padre y madre y MUST mostrar un **resumen**
  (nombre y moneda) antes de la acción final.
- **FR-040**: El wizard MUST permitir volver al paso anterior sin perder lo introducido y salir
  descartando el borrador, con confirmación cuando haya datos.
- **FR-041**: La creación MUST seguir enviando `POST /families` **una sola vez**, al confirmar el
  último paso; el contrato backend MUST NOT cambiar.
- **FR-042**: El progreso MUST anunciarse a tecnologías de asistencia ("Paso {n} de 3"), el paso
  actual MUST exponerse (`aria-current`/estado), y el foco MUST moverse al encabezado del paso.
- **FR-043**: El borrador MUST persistirse en el cliente y MUST limpiarse al crear o al descartar;
  MUST NOT contener secretos ni datos de servidor.
- **FR-044**: Los errores de acción MUST mostrarse junto al paso que los origina; un error de
  validación de moneda MUST devolver al paso de la moneda conservando el resto.
- **FR-045**: Un código ya aceptado MUST dejar de mostrarse a la persona que lo emitió: la pantalla
  de invitación MUST volver a consultar el estado del código guardado al entrar y, si ya fue usado,
  MUST ocultarlo y volver al estado sin código activo (FR-027), sin permitir copiarlo ni compartirlo.
- **FR-046**: La sección de la familia MUST llamarse **Familia** en la navegación (es y en, incluida
  la etiqueta accesible) y el acceso desde Home MUST rotularse "Ver familia" / "View family"; el
  encabezado interno de la pantalla MUST seguir siendo "Integrantes", sin usar jerga de modelo.

### Key Entities

- **Persona**: quien usa Kitho. Se identifica con su cuenta de Google y tiene un nombre visible.
  Pertenece como máximo a una familia activa.
- **Familia**: núcleo familiar con nombre, una única moneda para todos sus registros y hasta 10
  integrantes activos.
- **Membresía**: vínculo entre una persona y una familia. Tiene un rol familiar (padre, madre, hijo,
  hija, tío, abuelo u otro) y un permiso derivado (administrador solo para padre y madre; miembro
  para el resto). Cuando el rol es **Otro**, el vínculo familiar es obligatorio.
- **Invitación**: código de un solo uso emitido por una persona administradora. Declara el rol de
  quien lo usará, incluye el vínculo familiar solo si el rol es **Otro** y caduca a los 7 días.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% de las personas nuevas completan la entrada (acceso → perfil si falta → familia)
  sin abandonar.
- **SC-002**: 80% de las personas nuevas llegan a Home en menos de 2 minutos desde el primer acceso.
- **SC-003**: 100% de las uniones registran el rol declarado en el código; ninguna unión pide rol a
  quien se une.
- **SC-004**: 100% de los códigos con rol padre o madre producen una membresía de administrador, y
  los códigos con rol hijo o hija, una membresía de miembro.
- **SC-005**: 0 textos visibles que presenten finanzas o presupuestos como funciones disponibles.
- **SC-006**: 0 violaciones de accesibilidad detectadas por las verificaciones automatizadas en las
  pantallas del ciclo.
- **SC-007**: 100% de las claves nuevas con traducción en español e inglés.
- **SC-008**: 85% de quienes crean o se unen generan o comparten una invitación en su primera
  sesión.
- **SC-009**: 0 pantallas de entrada sin contenido propio (ninguna es un redirect vacío) y 1 sola
  acción primaria por pantalla.
- **SC-010**: 0 violaciones de contraste o de estado seleccionado en las verificaciones
  automatizadas, y las pantallas se muestran sin recorte en 375, 768, 1024 y 1440 px.
- **SC-011**: 100% de las personas con código pendiente llega a "unirme" sin pasar por la elección,
  y 0 de ellas ve "crear" como acción primaria; sin código pendiente, "crear" es la primaria.
- **SC-012**: 100% de las pantallas del ciclo de familia redirigen al login cuando no hay sesión
  (0 accesos sin sesión) y el 100% de los primeros accesos sigue el orden login → perfil (si falta) →
  ciclo de familia → Home.
- **SC-013**: 100% de las creaciones pasan por los tres pasos y envían
  `{nombre, moneda_local, rol_familiar}` una sola vez.
- **SC-014**: 0 avances de paso con el campo del paso inválido; 100% de los errores de moneda
  devuelven al paso 2 con mensaje local.
- **SC-015**: El borrador sobrevive a una recarga y se limpia al crear o descartar; 0 secretos
  persistidos.
- **SC-016**: 0 violaciones de accesibilidad (foco al paso, live region de progreso,
  `aria-current`) en las verificaciones automatizadas.
- **SC-017**: 0 códigos ya aceptados mostrados como activos en la sesión de quien los emitió
  (verificado por prueba automatizada al volver a Miembros).

## Assumptions

- **Alcance**: esta etapa cubre el ciclo de vida de la familia. Finanzas, presupuestos y
  transacciones pertenecen a la spec 004 y solo se anuncian como "en camino".
- **Decisiones heredadas** (`specs/003-ux-audit/decision-day-one.md`): D0 ciclo de familia primero;
  D1 promesa de organización; D2 rol declarado al invitar, padre/madre administradores; D3 moneda
  única explicada antes de crear; D4 solo administradores invitan; D5 medición con Umami.
- **Roles fijos en esta etapa**: no se cambia el rol de una persona después de unirse; esa capacidad
  queda fuera de alcance.
- **Catálogo de roles**: padre, madre, hijo, hija, tío, abuelo y otro. Solo padre y madre
  administran; tío, abuelo y otro entran como miembros.
- **Vínculo familiar**: es texto libre y solo se solicita cuando el rol es **Otro**; en los demás
  casos no se muestra ni se persiste.
- **Padres y madres son pares**: ambos administran con los mismos permisos.
- **Una familia por persona**: no existe pertenencia simultánea a varias familias activas.
- **Acceso**: se reutiliza el inicio de sesión con Google ya existente.
- **Códigos**: un solo uso, 7 días de validez, máximo 10 integrantes activos por familia.
- **Línea base**: hasta que la medición esté activa, los objetivos se contrastan con la ronda 1 de
  pruebas con 5 personas (`usability-test.md`).
- **Idiomas**: español por defecto, inglés completo; no se admiten claves sin traducir.
- **Wizard**: es de cliente; no añade entidades ni columnas, y no cambia el contrato backend.
- **Estado**: se adopta `zustand` con `persist` como borrador del wizard; es el piloto de la decisión
  de estado global prevista para la spec 004. Web con `localStorage`; móvil con el adaptador de
  `lib/storage.ts`.
- **Navegación**: ruta única; el botón "atrás" del navegador abandona el alta (documentado).

## UX Gate *(mandatory for any feature touching UI)*

Checklist completa de la skill `kitho-ux`: [ux-checklist.md](./ux-checklist.md).

- **Objetivo del usuario**: entrar a Kitho y quedar dentro de su familia con el rol correcto, en
  menos de dos minutos.
- **Se cumple en <10 s**: sí en cada pantalla (promesa → acción; crear/unirse → consecuencia).
- **Acción primaria**: una por pantalla, contextual en la elección de familia (FR-029): acceder con
  Google; **con código pendiente → unirme**; **sin código → crear familia**; generar invitación. En
  el wizard, "Continuar" (pasos 1–2) y "Crear familia" (paso 3).
- **Wizard**: tres pasos con progreso anunciado, foco al encabezado del paso, "Atrás" sin pérdida y
  "Salir" con confirmación (FR-036...FR-044).
- **Acciones secundarias**: unirme con código (frente a crear), volver a la selección, reintentar;
  visualmente distintas de la primaria.
- **Acciones destructivas**: abandonar/eliminar familia no entra en este corte; cuando aparezca,
  va separada y con confirmación que nombre la familia.
- **Estados cubiertos**: carga inicial, carga de acción, vacío, error con reintento, error local,
  sin permiso explicado, éxito local, offline/timeout (FR-016).
- **Accesibilidad**: foco visible, teclado, live regions, estado seleccionado, contraste 4.5:1/3:1,
  touch ≥44, zoom 200%, movimiento reducido (FR-018, FR-022, FR-023, FR-024).
- **Tokens**: cero valores fuera de `design-tokens/tokens.json` (FR-019).
- **Responsive**: 375 / 768 / 1024 / 1440 (web) e iOS/Android (móvil) (FR-028).
- **Métricas**: eventos `app_open`, `login_start`, `login_success`, `profile_submit`,
  `family_choice`, `family_created`, `family_joined`, `home_view`, `invite_generated`,
  `invite_shared` (`metrics.md`), sin PII.
- **Veredicto**: aprobado con observaciones — falta añadir el enlace visible a privacidad/términos
  (UX-02.2). La jerarquía contextual de la elección de familia está decidida (FR-029/FR-030) y se
  verifica en la ronda 1.