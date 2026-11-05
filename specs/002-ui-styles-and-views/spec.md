# Feature Specification: UI, Estilos y Vistas Web y Móvil (Kitho)

**Feature Branch**: `002-ui-styles-and-views`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "UI de la app web y móvil: estilos, vistas, navegación, tema, idioma, componentes y accesibilidad."

## Clarifications

### Session 2026-11-04

- **Marca**: el producto se llama **Kitho**. Nombre de pantalla: **Kitho**. Fichas de tienda:
  - España/Latam: **Kitho: Tareas y Finanzas Familiares**
  - EE.UU./Global: **Kitho Family**
- **Significado y vibe**: el nombre deriva del inglés antiguo **"Kith"** (familiares y allegados);
  es corto, estilizado, fresco y con personalidad de startup tecnológica.
- **Atractivo bilingüe**: tiene excelente pronunciación en inglés y en español; suena nativo y no
  choca fonéticamente en ninguno de los dos idiomas.
- **Disponibilidad**: se verificó que está libre de conflicto en la categoría de aplicaciones de
  organización y gestión familiar.
- **Logo**: no existen assets definitivos; se usará un wordmark provisional **Kitho** hasta recibir el logo y el icono de app.
- Q: ¿Cómo debe interpretarse «Kitho Family» en la ficha de EE.UU./Global? → A: Título de ficha
  **Kitho Family**; se elimina la propuesta anterior.
- **Alcance**: refactorizar todas las pantallas actuales de la spec 001 y añadir Inicio (redirección), Ajustes y editor de avatar. No se diseñan aún pantallas financieras futuras.
- **Estilo visual**: Material Design 3 (MD3).
- **Color semilla**: `#6750A4` (púrpura MD3), con paletas tonales claras y oscuras generadas a partir de él.
- **Web**: Tailwind CSS + componentes MD3 propios. Se descarta shadcn/ui.
- **Móvil**: React Native `StyleSheet` con design tokens compartidos. Sin kit de UI externo.
- **Navegación**: Web con topbar + sidebar; móvil con tabs inferiores. En web Ajustes aparece en la navegación; en móvil se accede desde Perfil.
- **Responsive web**: mobile-first con clases de ventana MD3 (compact, medium, expanded).
- **Accesibilidad**: WCAG 2.1 AA.
- **Idiomas**: español (por defecto) e inglés. `next-intl` en web y `expo-localization`/`i18n-js` en móvil. Selector de idioma en Ajustes.
- **Tipografía e iconos**: Inter y Lucide.
- **Estados de UI**: spinners e inline states. Sin skeletons ni toasts.
- **Gráficos**: se incorporan Recharts (web) y Victory Native (móvil) como base para pantallas futuras; ninguna pantalla actual los muestra.
- **Tokens**: `tokens.json` compartido en la raíz y generación de archivos TypeScript por frontend.
- **Modo oscuro**: sigue el sistema por defecto; en Ajustes se puede forzar Sistema, Claro u Oscuro, con persistencia.
- **Login Google**: botón MD3 con el icono oficial de Google.
- **Errores**: mapeo de códigos/mensajes del backend a claves i18n, con el texto del backend como fallback.
- **Plataformas**: últimas 2 versiones de Chrome, Firefox, Safari y Edge; iOS 15+ y Android 10+.
- **Backend en 002**: sin cambios. La subida de archivos de avatar y la persistencia de su personalización se implementan en la spec 003.
- **Avatar en 002**: avatar por defecto generado por la app durante el onboarding; editor con personalización amplia (base, fondo, cabello, ropa, ojos y accesorios) solo en modo vista previa. Guardar la personalización queda para 003.
- **Ajustes**: idioma, tema, cerrar sesión, acerca de/versión/legal y editar perfil.
- **Inicio**: por ahora redirige a Miembros hasta que exista un dashboard financiero.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sistema visual coherente y accesible (Priority: P1)

Como usuario, quiero que la app web y la app móvil compartan la misma identidad visual, tipografía, colores y patrones de interacción para reconocer y usar las funciones sin reaprender en cada plataforma.

**Why this priority**: Sin un sistema visual común, el refactor de pantallas produciría inconsistencias y deuda de estilos; es la base de todas las demás historias.

**Independent Test**: Se puede verificar navegando las pantallas actuales en web y móvil, comprobando que usan los mismos tokens, componentes MD3, tipografía Inter, iconos Lucide y que no existen valores visuales hardcodeados.

**Acceptance Scenarios**:

1. **Given** una pantalla cualquiera de la aplicación, **When** se inspecciona su implementación, **Then** sus colores, tipografía, espaciado, radios y elevación provienen de los tokens compartidos.
2. **Given** el mismo contenido en web y móvil, **When** se comparan ambos, **Then** la jerarquía visual, los colores semánticos y los estados de los componentes son equivalentes.
3. **Given** un componente interactivo, **When** se recorre con teclado o lector de pantalla, **Then** expone foco visible, rol, nombre accesible y estado.

---

### User Story 2 - Navegación adaptada al dispositivo (Priority: P1)

Como usuario, quiero una navegación clara y adaptada a mi dispositivo: barra superior y lateral en escritorio, rail en tablet y tabs inferiores en móvil.

**Why this priority**: La navegación es la estructura que hace accesibles todas las vistas y debe resolverse antes del refactor visual.

**Independent Test**: Se puede verificar iniciando sesión y recorriendo Inicio, Miembros, Perfil y Ajustes en web y móvil, comprobando la navegación correspondiente a cada ancho de pantalla.

**Acceptance Scenarios**:

1. **Given** una sesión válida en web con viewport `>=840px`, **When** el usuario navega, **Then** ve topbar y sidebar con las secciones Inicio, Miembros, Perfil y Ajustes.
2. **Given** una sesión válida en web con viewport entre `600px` y `839px`, **When** el usuario navega, **Then** ve una navegación compacta tipo rail y la topbar.
3. **Given** una sesión válida en web con viewport `<600px` o en móvil nativo, **When** el usuario navega, **Then** ve tabs inferiores con Inicio, Miembros y Perfil, y accede a Ajustes desde Perfil.
4. **Given** que el usuario pulsa Inicio, **When** no existe dashboard financiero, **Then** es redirigido a Miembros.

---

### User Story 3 - Tema e idioma controlables (Priority: P2)

Como usuario, quiero que la app respete el tema de mi sistema y me permita cambiarlo, además de elegir español o inglés, para adaptar la experiencia a mis preferencias.

**Why this priority**: Tema e idioma afectan la legibilidad y la comprensión de toda la interfaz; deben estar disponibles antes de dar por finalizado el refactor.

**Independent Test**: Se puede verificar cambiando de tema y de idioma en Ajustes y recargando la app, comprobando que las preferencias persisten y que ninguna pantalla queda con textos sin traducir.

**Acceptance Scenarios**:

1. **Given** un usuario con el tema del sistema en oscuro, **When** abre la app por primera vez, **Then** la interfaz se muestra en modo oscuro sin parpadeo de tema claro.
2. **Given** un usuario en Ajustes, **When** selecciona Claro, Oscuro o Sistema, **Then** el tema cambia de inmediato y la elección persiste tras recargar.
3. **Given** un usuario en Ajustes, **When** cambia el idioma a inglés o español, **Then** todos los textos visibles y mensajes de error se actualizan sin dejar cadenas en el idioma anterior.
4. **Given** un usuario que cierra y vuelve a abrir la app, **Then** conserva su tema e idioma seleccionados.

---

### User Story 4 - Onboarding y gestión familiar con las nuevas vistas (Priority: P2)

Como usuario, quiero iniciar sesión, completar mi perfil, crear o unirme a un grupo familiar y gestionar sus integrantes con pantallas claras y consistentes.

**Why this priority**: Es el flujo funcional existente que debe seguir operativo tras el cambio de UI.

**Independent Test**: Se puede verificar ejecutando el flujo completo de la spec 001 y comprobando que cada pantalla usa el nuevo sistema visual sin romper autenticación, perfil, grupo, invitación ni miembros.

**Acceptance Scenarios**:

1. **Given** un usuario no autenticado, **When** entra al login, **Then** ve la vista MD3 con el botón de Google oficial y mensajes de error accesibles en el idioma activo.
2. **Given** un usuario autenticado sin perfil, **When** configura su nombre y avatar por defecto, **Then** puede continuar y la pantalla muestra estados de carga y error claros.
3. **Given** un usuario sin grupo, **When** elige crear o unirse a un grupo, **Then** las pantallas de selección, creación e invitación mantienen su funcionalidad con el nuevo diseño.
4. **Given** un administrador en Miembros, **When** consulta y gestiona integrantes, **Then** la lista, acciones, confirmaciones y estados vacíos se muestran con componentes MD3 accesibles.

---

### User Story 5 - Feedback claro en todas las acciones (Priority: P3)

Como usuario, quiero ver indicadores de carga, mensajes de error y estados vacíos claros para saber qué está ocurriendo en cada momento.

**Why this priority**: El feedback reduce la incertidumbre y los errores repetidos, pero depende de que las vistas y componentes base ya existan.

**Independent Test**: Se puede verificar forzando cargas lentas, errores de backend y listas vacías en web y móvil, comprobando que se muestra el estado correspondiente.

**Acceptance Scenarios**:

1. **Given** una operación en curso, **When** la respuesta tarda, **Then** se muestra un spinner con texto traducido y el botón implicado queda deshabilitado.
2. **Given** un error del backend, **When** la petición falla, **Then** se muestra un mensaje inline traducido y asociado a la acción fallida.
3. **Given** una lista sin elementos, **When** la vista termina de cargar, **Then** se muestra un estado vacío con explicación y acción sugerida si aplica.
4. **Given** una acción destructiva, **When** el usuario la inicia, **Then** se muestra un diálogo de confirmación antes de ejecutarla.

---

### User Story 6 - Editor de avatar con vista previa (Priority: P3)

Como usuario, quiero elegir y previsualizar un avatar personalizado para identificarme dentro del grupo familiar, aunque el guardado definitivo llegue en una versión posterior.

**Why this priority**: Mejora la identidad dentro de la app, pero la persistencia completa depende de la spec 003.

**Independent Test**: Se puede verificar abriendo el editor desde el perfil, modificando base, fondo, cabello, ropa, ojos y accesorios, comprobando que la vista previa cambia y que se informa claramente que el guardado no está disponible en esta versión.

**Acceptance Scenarios**:

1. **Given** un usuario con avatar por defecto, **When** abre el editor, **Then** ve una pantalla dedicada con vista previa y controles de personalización.
2. **Given** un usuario que modifica opciones del avatar, **When** cambia cualquier control, **Then** la vista previa se actualiza de inmediato.
3. **Given** un usuario que intenta guardar la personalización en esta versión, **When** pulsa Guardar, **Then** se le informa que el guardado persistente estará disponible en la spec 003 y se conserva el avatar por defecto.
4. **Given** la pantalla de perfil, **When** el usuario ve su avatar, **Then** se muestra el avatar por defecto generado por la app.

---

### User Story 7 - Base de visualización de datos para el futuro (Priority: P4)

Como responsable del producto, quiero dejar preparada la integración de gráficos para que las futuras pantallas financieras puedan visualizar datos sin rehacer la base técnica de UI.

**Why this priority**: No aporta valor inmediato a las pantallas actuales, pero evita retrabajo cuando se incorporen presupuestos y transacciones.

**Independent Test**: Se puede verificar que las dependencias y componentes contenedores de gráficos existen, que no se renderizan en las rutas actuales y que no aumentan el bundle inicial de forma innecesaria.

**Acceptance Scenarios**:

1. **Given** las pantallas actuales, **When** se cargan, **Then** no muestran gráficos ni cargan sus librerías en el bundle inicial.
2. **Given** una futura pantalla financiera, **When** use el contenedor de gráficos, **Then** dispone de Recharts en web y Victory Native en móvil con tokens de color del tema.

---

### Edge Cases

- **Cambio de tema del sistema en caliente**: si el sistema cambia de claro a oscuro mientras la app está abierta y la preferencia es "Sistema", la interfaz debe actualizarse sin recargar.
- **Idioma con textos largos**: las traducciones en inglés o etiquetas extensas no deben romper el layout ni provocar scroll horizontal.
- **Pantallas compactas y zoom**: con viewport de `320px` o zoom de texto al `200%`, el contenido debe seguir siendo usable y legible.
- **Teclado y foco**: los diálogos deben atrapar el foco, cerrarse con Escape en web y devolver el foco al elemento de origen.
- **Sesión expirada**: al recibir `401`, la app debe redirigir al login conservando tema e idioma elegidos.
- **Error de backend sin traducción**: si no existe clave i18n para un mensaje, se muestra el texto del backend como fallback sin romper la interfaz.
- **Logo ausente**: si no existe el asset definitivo, se muestra el wordmark Kitho sin imágenes rotas ni espacios vacíos.
- **Avatar sin persistencia**: el editor no debe hacer creer al usuario que sus cambios se guardaron en esta versión.
- **Movimiento reducido**: si el sistema solicita reducir movimiento, las animaciones MD3 deben desactivarse o acortarse.
- **Datos vacíos**: listas sin miembros, sin invitación activa o sin grupo deben mostrar estados vacíos claros, no pantallas en blanco.
- **Fallback de fuente**: si Inter no carga, la app debe usar la fuente del sistema sin cambiar la jerarquía visual.

## Requirements *(mandatory)*

### Functional Requirements

#### Sistema de diseño y tokens

- **FR-001**: El sistema DEBE definir un conjunto único de design tokens en un `tokens.json` compartido en la raíz del repositorio, consumido por web y móvil mediante archivos TypeScript generados.
- **FR-002**: Los tokens DEBEN cubrir color, tipografía, espaciado, radios, elevación, iconografía, breakpoints y movimiento.
- **FR-003**: La paleta DEBE derivarse del color semilla `#6750A4` y expresarse como roles semánticos MD3 (`primary`, `on-primary`, `primary-container`, `secondary`, `tertiary`, `surface`, `surface-variant`, `outline`, `error`, etc.) para tema claro y oscuro.
- **FR-004**: La tipografía DEBE usar Inter y la escala tipográfica de MD3 (display, headline, title, body, label), con pesos y alturas de línea definidos en tokens.
- **FR-005**: La iconografía DEBE usar Lucide (`lucide-react` en web y `lucide-react-native` en móvil), con tamaño base de 24 px y tamaños derivados.
- **FR-006**: La web DEBE implementar Tailwind CSS y componentes MD3 propios; NO debe incorporar shadcn/ui.
- **FR-007**: La app móvil DEBE implementar estilos con `StyleSheet` de React Native y los mismos tokens; NO debe incorporar un kit de UI externo.
- **FR-008**: Ningún componente o pantalla DEBE hardcodear colores, tipografías, espaciados ni radios fuera de los tokens, salvo excepciones documentadas.

#### Componentes base

- **FR-009**: La especificación DEBE cubrir las familias de componentes: formularios, contenido, feedback, navegación y estados.
- **FR-010**: Los componentes de formulario DEBEN incluir botones (filled, tonal, outlined, text y danger), campos de texto, selects, checkbox, radio, switch y búsqueda, con variantes de error, deshabilitado y helper text.
- **FR-011**: Los componentes de contenido DEBEN incluir tarjetas, listas e ítems, avatar, chips, badges, divisores y wordmark.
- **FR-012**: Los componentes de feedback DEBEN incluir diálogos, menús, banners inline, spinner, estado vacío y confirmación destructiva.
- **FR-013**: Los componentes de navegación DEBEN incluir topbar, sidebar/rail, tabs inferiores, tabs de contenido y breadcrumbs cuando apliquen.
- **FR-014**: Todos los componentes DEBEN exponer estado de foco visible, deshabilitado, hover/pressed y error cuando corresponda.
- **FR-015**: Los componentes DEBEN ser reutilizables y compartir nombres y variantes entre web y móvil, aunque su implementación sea nativa en cada plataforma.

#### Navegación y layout

- **FR-016**: La web DEBE usar topbar + sidebar en viewport `>=840px`, rail + topbar entre `600px` y `839px`, y tabs inferiores en `<600px`.
- **FR-017**: La app móvil DEBE usar tabs inferiores con Inicio, Miembros y Perfil.
- **FR-018**: En web, la navegación principal DEBE mostrar Inicio, Miembros, Perfil y Ajustes. En móvil, Ajustes DEBE ser accesible desde Perfil.
- **FR-019**: La ruta Inicio DEBE redirigir a Miembros mientras no exista un dashboard financiero.
- **FR-020**: Las rutas protegidas DEBEN respetar los redireccionamientos de la spec 001: login, configuración de perfil, selección/creación/unión de grupo y miembros.
- **FR-021**: El ítem de navegación activo DEBE reflejarse visualmente y exponerse mediante atributos accesibles.
- **FR-022**: La web DEBE ser mobile-first y usar las clases de ventana MD3: compact `<600px`, medium `600px–839px`, expanded `>=840px`.
- **FR-023**: Las pantallas DEBEN evitar scroll horizontal desde `320px` de ancho y respetar áreas seguras en móvil.

#### Tema

- **FR-024**: La app DEBE seguir la preferencia del sistema por defecto.
- **FR-025**: Ajustes DEBE permitir elegir entre Sistema, Claro y Oscuro, con persistencia local en web y almacenamiento seguro o persistente en móvil.
- **FR-026**: El tema DEBE aplicarse a toda la app sin recargar y sin parpadeo de tema incorrecto en la carga inicial web.
- **FR-027**: Cuando la preferencia sea Sistema, los cambios de tema del sistema operativo DEBEN reflejarse en caliente.

#### Idioma e internacionalización

- **FR-028**: El idioma por defecto DEBE ser español; el usuario DEBE poder cambiar a inglés desde Ajustes.
- **FR-029**: La web DEBE usar `next-intl` y la app móvil `expo-localization`/`i18n-js`, con catálogos de traducción equivalentes.
- **FR-030**: Toda cadena visible DEBE provenir de los catálogos i18n; no se permiten textos hardcodeados en componentes.
- **FR-031**: La preferencia de idioma DEBE persistir entre sesiones y aplicarse sin dejar cadenas en el idioma anterior.
- **FR-032**: Fechas, números y moneda DEBEN formatearse con `Intl` según el idioma activo, usando la moneda definida por el grupo familiar.
- **FR-033**: Los errores del backend DEBEN mapearse a claves i18n por código o mensaje conocido; si no hay mapeo, se mostrará el mensaje del backend como fallback.
- **FR-034**: El nombre de la app y los metadatos visibles DEBEN usar **Kitho**; la ficha de
  España/Latam DEBE usar **Kitho: Tareas y Finanzas Familiares** y la de EE.UU./Global **Kitho
  Family**. «Finanzas Familiares» solo puede aparecer como descriptor de categoría en la ficha
  España/Latam, nunca como nombre del producto.

#### Accesibilidad

- **FR-035**: La interfaz DEBE cumplir WCAG 2.1 AA en contraste, foco, etiquetas, roles, navegación por teclado y lectores de pantalla.
- **FR-036**: Todos los controles interactivos DEBEN tener nombre accesible, rol correcto y estado expuesto.
- **FR-037**: El foco DEBE ser visible, seguir un orden lógico y gestionarse correctamente en diálogos y menús.
- **FR-038**: Los objetivos táctiles DEBEN tener al menos `48x48dp` en móvil y un área equivalente en web táctil.
- **FR-039**: Los mensajes de error y estado DEBEN anunciarse mediante regiones live o `accessibilityLiveRegion` cuando aparezcan.
- **FR-040**: La app DEBE respetar `prefers-reduced-motion` en web y la preferencia de movimiento reducido en móvil.

#### Pantallas y vistas

- **FR-041**: Se DEBEN refactorizar con el nuevo sistema visual las pantallas existentes: login, configuración de perfil, selección de grupo, creación de grupo, miembros e invitación.
- **FR-042**: Se DEBE añadir la vista Ajustes con idioma, tema, cerrar sesión, acerca de/versión/legal y editar perfil.
- **FR-043**: Se DEBE añadir la vista dedicada de edición de avatar accesible desde Perfil y Ajustes.
- **FR-044**: La vista Inicio DEBE existir como ruta de entrada y redirigir a Miembros.
- **FR-045**: Cada pantalla DEBE cubrir sus estados de carga, error, éxito y vacío cuando aplique.
- **FR-046**: El botón de inicio de sesión con Google DEBE ser una variante MD3 con el icono oficial de Google y nombre accesible.
- **FR-047**: Las acciones destructivas (expulsar miembro, cerrar sesión, abandonar flujo) DEBEN solicitar confirmación.
- **FR-048**: La pantalla de miembros DEBE mostrar el límite máximo de 10 integrantes y el estado de rol de cada miembro de forma visualmente clara.

#### Avatar

- **FR-049**: Durante el onboarding, la app DEBE asignar un avatar por defecto generado por la propia app y enviarlo mediante el campo `foto_avatar` existente, sin cambios de backend.
- **FR-050**: El editor de avatar DEBE ofrecer personalización amplia: avatar base, color de fondo, cabello, ropa, ojos y accesorios, todo generado por la app sin assets externos.
- **FR-051**: El editor DEBE mostrar una vista previa en tiempo real y una pantalla dedicada con navegación de vuelta.
- **FR-052**: En la spec 002, el editor NO debe persistir la personalización; el guardado definitivo y la subida de archivos quedan para la spec 003.
- **FR-053**: La UI DEBE informar claramente al usuario cuando intente guardar una personalización no disponible en esta versión.

#### Feedback y estados

- **FR-054**: Las operaciones asíncronas DEBEN mostrar spinners con texto traducido y deshabilitar el control que las inició.
- **FR-055**: Los errores y éxitos DEBEN mostrarse inline en la pantalla correspondiente; no se implementan toasts ni skeletons en esta versión.
- **FR-056**: Las listas y vistas sin datos DEBEN mostrar un estado vacío con explicación y, si aplica, una acción sugerida.
- **FR-057**: Los mensajes DEBEN ser claros, no técnicos y consistentes entre web y móvil.

#### Gráficos

- **FR-058**: Se DEBE incorporar Recharts en web y Victory Native en móvil como base de gráficos, con contenedores que consuman los tokens del tema.
- **FR-059**: Ninguna pantalla actual DEBE renderizar gráficos ni cargar sus librerías en el bundle inicial.
- **FR-060**: Los componentes de gráficos DEBEN cargarse de forma diferida para futuras pantallas financieras.

#### Marca y assets

- **FR-061**: La UI DEBE mostrar el wordmark provisional Kitho hasta que existan logo e icono definitivos.
- **FR-062**: Los metadatos de la app DEBEN usar **Kitho** y los nombres de ficha de tienda
  acordados: **Kitho: Tareas y Finanzas Familiares** (España/Latam) y **Kitho Family**
  (EE.UU./Global).
- **FR-063**: No se DEBEN mostrar imágenes rotas ni placeholders vacíos por ausencia de assets.

#### Alcance técnico y calidad

- **FR-064**: La spec 002 NO debe modificar el backend; reutiliza los endpoints de la spec 001.
- **FR-065**: Se DEBE eliminar el uso de estilos inline actuales en web y centralizar los estilos móviles en tokens y componentes.
- **FR-066**: La implementación DEBE pasar `lint`, `typecheck` y las pruebas de web y móvil existentes, además de las nuevas pruebas de componentes y accesibilidad.
- **FR-067**: La app DEBE soportar las últimas 2 versiones de Chrome, Firefox, Safari y Edge; iOS 15+ y Android 10+.
- **FR-068**: Las dependencias nuevas (Tailwind, next-intl, expo-localization/i18n-js, Recharts, Victory Native, Lucide) DEBEN registrarse en el plan técnico y justificarse contra la constitución.

#### Identidad de marca

- **FR-069**: La comunicación de marca DEBE reflejar el significado de **"Kith"** (familiares y
  allegados) y un tono fresco, cercano y tecnológico.
- **FR-070**: El nombre **Kitho** DEBE mantenerse sin traducción ni adaptación fonética para
  conservar su atractivo bilingüe en inglés y español.
- **FR-071**: La UI y los metadatos NO DEBEN introducir variantes, traducciones o adaptaciones no
  aprobadas del nombre.

### Key Entities *(include if feature involves data)*

- **Brand Identity**: nombre canónico **Kitho**, nombres de ficha por región, significado, tono,
  pronunciación bilingüe, disponibilidad verificada y reglas de uso.
- **Design Token Set**: colección versionada de colores, tipografía, espaciado, radios, elevación, movimiento y breakpoints en `tokens.json`.
- **MD3 Color Scheme**: conjunto de roles semánticos claros y oscuros derivados del color semilla `#6750A4`.
- **Component Spec**: definición de cada componente con variantes, estados, tokens usados y comportamiento accesible.
- **Screen/View**: ruta, plataforma, propósito, estados (carga, error, vacío, éxito) y componentes que la componen.
- **Translation Catalog**: claves y textos equivalentes en español e inglés para la interfaz y los errores.
- **Theme Preference**: preferencia local del usuario entre Sistema, Claro y Oscuro.
- **Locale Preference**: preferencia local del usuario entre español e inglés.
- **Avatar Configuration**: configuración de avatar base, fondo, cabello, ropa, ojos y accesorios; en 002 solo se previsualiza, se persiste en 003.
- **Navigation Model**: secciones, rutas, orden, visibilidad por plataforma y comportamiento adaptativo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las pantallas actuales y nuevas usan los tokens compartidos; no quedan colores, tipografías ni espaciados hardcodeados en componentes de pantalla.
- **SC-002**: Las pantallas clave superan una auditoría automatizada de accesibilidad con puntuación `>=95` y no presentan violaciones críticas WCAG 2.1 AA.
- **SC-003**: El 100% de los controles interactivos son alcanzables y operables por teclado en web.
- **SC-004**: El tema sigue al sistema por defecto y la selección manual persiste en el 100% de las recargas y reaperturas.
- **SC-005**: El cambio de idioma actualiza el 100% de las cadenas visibles sin recargar la app.
- **SC-006**: No aparece scroll horizontal en anchos de `320px`, `600px`, `840px` y `1440px` en las pantallas revisadas.
- **SC-007**: Los flujos de login, perfil, grupo, invitación y miembros de la spec 001 siguen completándose al 100% tras el refactor.
- **SC-008**: El onboarding completo (login, perfil y grupo) se puede completar en menos de 3 minutos en condiciones normales.
- **SC-009**: El 100% de los errores conocidos del backend se muestran con un mensaje traducido; los no mapeados usan fallback sin romper la UI.
- **SC-010**: El editor de avatar actualiza la vista previa en menos de 100 ms por interacción y comunica claramente que el guardado llega en 003.
- **SC-011**: Las librerías de gráficos no forman parte del bundle inicial de ninguna ruta actual.
- **SC-012**: La apariencia de una misma pantalla es consistente entre web y móvil en color, jerarquía, tipografía, espaciado y estados de componente.
- **SC-013**: El 100% de las referencias públicas al producto usan **Kitho**; «Finanzas Familiares»
  solo aparece como descriptor de categoría en la ficha de España/Latam.
- **SC-014**: Los metadatos de tienda coinciden exactamente con **Kitho: Tareas y Finanzas
  Familiares** (España/Latam) y **Kitho Family** (EE.UU./Global) en el 100% de las plataformas.

## Assumptions

- La spec 001 y sus endpoints siguen siendo la fuente funcional para autenticación, perfil, grupos, miembros e invitaciones.
- El nombre de producto es **Kitho**, derivado del inglés antiguo "Kith" (familiares y allegados),
  con un tono corto, fresco y tecnológico; no existen assets definitivos de logo, icono de app o
  splash, por lo que se usará el wordmark provisional.
- **Kitho** se pronuncia de forma natural en inglés y español; no se traduce ni se adapta
  fonéticamente en ninguna plataforma.
- La disponibilidad de la marca se verificó como libre de conflicto en la categoría de
  organización y gestión familiar; esta verificación es un supuesto de producto.
- La ficha de España/Latam usa **Kitho: Tareas y Finanzas Familiares** y la de EE.UU./Global usa
  **Kitho Family**.
- El avatar por defecto puede representarse como un descriptor de texto generado por la app y almacenarse en el campo `foto_avatar` existente.
- La personalización y subida de avatar se completarán en la spec 003.
- La spec 002 no requiere cambios de backend; cualquier necesidad nueva se documentará para 003.
- Las futuras pantallas financieras usarán Recharts y Victory Native, pero no forman parte de esta iteración.
- Los usuarios tienen conexión a internet estable durante los flujos de autenticación y gestión de grupo.
- El español es el idioma inicial y el inglés se ofrece como alternativa completa.
- Las preferencias de tema e idioma se guardan en el dispositivo, no en el backend.
- Se pueden añadir Tailwind CSS, next-intl, expo-localization/i18n-js, Recharts, Victory Native y Lucide como dependencias justificadas en el plan técnico.
- Las pantallas de Ajustes se añaden como ruta nueva; en web aparece en la navegación y en móvil se accede desde Perfil.
- La ruta Inicio no tendrá contenido propio hasta que exista un dashboard; por ahora redirige a Miembros.

## Out of Scope

- Subida de archivos de avatar, almacenamiento de imágenes y persistencia de la personalización del avatar (spec 003).
- Pantallas financieras de presupuestos, ingresos, gastos, transacciones o reportes.
- Gráficos visibles en las pantallas actuales.
- Exportación o generación de PDF.
- Integraciones bancarias, captura de notificaciones o pasarelas de pago, conforme a la constitución.
- Diseño o entrega final de logo, icono de app y splash.
- Trámites legales de registro, renovación o defensa de la marca Kitho.
- Cambios en la API o base de datos del backend.
- Notificaciones push y correos transaccionales.
