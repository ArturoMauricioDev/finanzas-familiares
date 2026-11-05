# Tasks: UI, Estilos y Vistas Web y Móvil (Kitho)

**Input**: Design documents from `/specs/002-ui-styles-and-views/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas porque FR-066 exige pruebas nuevas de componentes, accesibilidad, tokens e i18n.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y validación
independientes. Las rutas y contratos de UI se mantienen alineados entre web y móvil.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias directas).
- **[Story]**: Historia de usuario a la que pertenece la tarea.
- Todas las tareas incluyen rutas de archivo exactas.
- No se modifican `backend/`, `docker-compose.yml` ni el esquema de PostgreSQL.

## Path Conventions

- Web: `frontend-web/`
- Móvil: `frontend-mobile/`
- Artefactos compartidos: `design-tokens/`, `shared/` y `scripts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencias y configuración base de ambos frontends.

- [X] T001 Actualizar dependencias y scripts web en `frontend-web/package.json` y regenerar `frontend-web/pnpm-lock.yaml` con `next-intl`, `tailwindcss`, `@tailwindcss/postcss`, `lucide-react`, `recharts`, `react-is`, `jest-axe`, `@types/jest-axe`, `eslint-plugin-jsx-a11y` y tipos React 19.
- [X] T002 Actualizar dependencias móvil en `frontend-mobile/package.json` y regenerar `frontend-mobile/pnpm-lock.yaml` con `i18n-js`, `@expo-google-fonts/inter`, `lucide-react-native`, `victory-native@41.16.1`, módulos Expo 52, Skia, Reanimated y Gesture Handler.
- [X] T003 [P] Configurar Tailwind 4 y PostCSS en `frontend-web/postcss.config.mjs` y `frontend-web/app/globals.css` con `@import "tailwindcss"` y carga de `styles/tokens.generated.css`.
- [X] T004 [P] Configurar `next-intl` sin rutas de locale en `frontend-web/next.config.ts`.
- [X] T005 [P] Configurar Jest, Testing Library, `jest-axe`, mocks de `matchMedia` y reglas de accesibilidad en `frontend-web/jest.config.js`, `frontend-web/jest.setup.ts` y `frontend-web/.eslintrc.json`.
- [X] T006 [P] Actualizar `frontend-mobile/app.json` con `name: "Kitho"`, `slug: "kitho"`, `userInterfaceStyle: "automatic"` y plugin `expo-localization` para `es`/`en`, conservando scheme, package y bundle.
- [X] T007 [P] Ampliar mocks de Jest y reglas ESLint móvil en `frontend-mobile/jest.setup.js` y `frontend-mobile/.eslintrc.json` para SecureStore, `expo-localization`, `useColorScheme`, Google OAuth y fuentes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, generación compartida, tema, idioma, errores, avatar y helpers comunes.

**⚠️ CRITICAL**: Ninguna historia puede darse por terminada hasta completar esta fase.

- [X] T008 [P] Crear `design-tokens/tokens.json` con roles MD3 claros/oscuros, `success`/`warning`, tipografía Inter, espaciado, radios, elevación, movimiento, breakpoints `0/600/840`, iconos y `touchTarget: 48`.
- [X] T009 Implementar `scripts/generate-shared.mjs` para validar el esquema y generar `frontend-web/lib/design-tokens.generated.ts`, `frontend-web/styles/tokens.generated.css`, `frontend-mobile/lib/design-tokens.generated.ts`, copias de avatar y `lib/error-keys.generated.ts`.
- [X] T010 Implementar `scripts/check-shared.mjs` con comprobación `--check` byte a byte, paridad de catálogos i18n y validación de longitud del avatar por defecto.
- [X] T011 Implementar `scripts/check-ui.mjs` para detectar imports de gráficos fuera de `components/charts/` y literales visuales fuera de archivos generados/permitidos.
- [X] T012 Ejecutar `node scripts/generate-shared.mjs` y versionar las salidas en `frontend-web/lib/design-tokens.generated.ts`, `frontend-web/styles/tokens.generated.css`, `frontend-mobile/lib/design-tokens.generated.ts` y `lib/error-keys.generated.ts` de ambos frontends.
- [X] T013 [P] Crear `frontend-web/lib/branding.ts` con `Kitho`, títulos de tienda España/Latam y global, y descripción de marca.
- [X] T014 [P] Crear `frontend-mobile/lib/branding.ts` con las mismas constantes de marca que web.
- [X] T015 [P] Implementar `frontend-web/lib/preferences.ts` para leer/escribir `kitho_theme` y `kitho_locale` en `localStorage` y cookies con `Path=/`, `SameSite=Lax` y `Max-Age=31536000`.
- [X] T016 [P] Implementar `frontend-mobile/lib/preferences.ts` para persistir `kitho_theme` y `kitho_locale` en SecureStore, con fallback seguro si falla el almacenamiento.
- [X] T017 [P] Implementar `frontend-web/components/providers/ThemeProvider.tsx` con modo `system/light/dark`, `data-theme`, `matchMedia` en caliente y respeto a `prefers-reduced-motion`.
- [X] T018 [P] Implementar `frontend-mobile/components/providers/ThemeProvider.tsx` con `useColorScheme`, override persistido, `expo-system-ui` y actualización en caliente del tema del sistema.
- [X] T019 [P] Crear el catálogo español web en `frontend-web/messages/es.json` con los namespaces `common`, `auth`, `profile`, `family`, `invite`, `members`, `settings`, `avatar`, `errors`, `a11y` y `legal`.
- [X] T020 [P] Crear el catálogo inglés web en `frontend-web/messages/en.json` con exactamente las mismas claves que `es.json`.
- [X] T021 Implementar la configuración i18n web en `frontend-web/lib/i18n/index.ts` y el provider cliente en `frontend-web/components/providers/LocaleProvider.tsx`, sin rutas `[locale]`.
- [X] T022 [P] Crear el catálogo español móvil en `frontend-mobile/lib/i18n/messages/es.json` con los mismos namespaces y claves que web.
- [X] T023 [P] Crear el catálogo inglés móvil en `frontend-mobile/lib/i18n/messages/en.json` con exactamente las mismas claves que `es.json`.
- [X] T024 Implementar la configuración i18n móvil en `frontend-mobile/lib/i18n/index.ts` y el provider en `frontend-mobile/components/providers/LocaleProvider.tsx` usando `expo-localization` e `i18n-js`.
- [X] T025 [P] Crear `shared/errors/error-keys.json` con el mapa detalle/status del backend a claves `errors.*` y `errors.status.<code>`.
- [X] T026 [P] Refactorizar `frontend-web/lib/errors.ts` para exponer `ApiError` con `status`, `messageKey` y `fallbackDetail`, errores de configuración traducibles y resolución de arrays/objetos no string.
- [X] T027 [P] Refactorizar `frontend-mobile/lib/errors.ts` con el mismo contrato de descriptor que web.
- [X] T028 [P] Crear `frontend-web/lib/format.ts` con `formatCurrency`, `formatNumber` y `formatDate` basados en `Intl` y el locale activo.
- [X] T029 [P] Crear `frontend-mobile/lib/format.ts` con el mismo contrato de formato que web y la moneda del grupo.
- [X] T030 [P] Crear `shared/avatar/avatar-options.json` con bases, fondos, cabello, ropa, ojos y accesorios, sin assets externos.
- [X] T031 Implementar `shared/avatar/avatar-engine.ts` con hash FNV-1a determinista desde `user.id`/`email`, construcción SVG compacta, data URI y validación `<=2048`.
- [X] T032 [P] Crear `frontend-web/components/providers/AppProviders.tsx` que componga `ThemeProvider`, `LocaleProvider`, `GoogleOAuthProvider` y el provider de sesión cuando exista.
- [X] T033 [P] Crear `frontend-mobile/components/providers/AppProviders.tsx` que componga tema, idioma, fuentes, safe area y sesión.
- [X] T034 [P] Añadir helpers de prueba web en `frontend-web/__tests__/helpers/renderWithProviders.tsx` y mocks de `matchMedia`/Google en `frontend-web/jest.setup.ts`.
- [X] T035 [P] Añadir helpers de prueba móvil en `frontend-mobile/__tests__/helpers/renderWithProviders.tsx` y mocks de SecureStore/`expo-localization`/color scheme en `frontend-mobile/jest.setup.js`.
- [X] T036 [P] Añadir pruebas web de tokens generados y paridad i18n en `frontend-web/__tests__/design-tokens.test.ts` y `frontend-web/__tests__/i18n.test.ts`.
- [X] T037 [P] Añadir pruebas móvil de tokens generados y paridad i18n en `frontend-mobile/__tests__/design-tokens.test.ts` y `frontend-mobile/__tests__/i18n.test.ts`.
- [X] T038 [P] Añadir pruebas web de conservación de `kitho_theme`/`kitho_locale` tras logout y `401` en `frontend-web/__tests__/preferences.test.ts`.
- [X] T039 [P] Añadir pruebas móvil de conservación de preferencias tras logout y `401` en `frontend-mobile/__tests__/preferences.test.ts`.
- [X] T040 [P] Actualizar `frontend-web/lib/api.ts` para lanzar el nuevo descriptor de `ApiError` y preservar `status` para guards/redirecciones.
- [X] T041 [P] Actualizar `frontend-mobile/lib/api.ts` para lanzar el nuevo descriptor de `ApiError` y preservar `status` para guards/redirecciones.
- [X] T042 [P] Actualizar `frontend-web/__tests__/api.test.ts` y `frontend-web/__tests__/errors.test.ts` al contrato de descriptor, incluyendo arrays 422 y fallback desconocido.
- [X] T043 [P] Actualizar `frontend-mobile/__tests__/api.test.ts` y `frontend-mobile/__tests__/errors.test.ts` al contrato de descriptor, incluyendo arrays 422 y fallback desconocido.

**Checkpoint**: Tokens, tema, idioma, errores, avatar y helpers listos; las historias pueden empezar.

---

## Phase 3: User Story 1 - Sistema visual coherente y accesible (Priority: P1) 🎯 MVP

**Goal**: Biblioteca MD3 propia con tokens, tipografía Inter, iconos Lucide y estados accesibles en
web y móvil.

**Independent Test**: Renderizar y recorrer los componentes de `frontend-web/components/ui/` y
`frontend-mobile/components/ui/` verificando variantes, foco, teclado, roles y ausencia de literales
visuales; después, comprobar que las pantallas migradas usan el mismo sistema.

### Tests for User Story 1

- [X] T044 [P] [US1] Crear pruebas web de componentes, variantes y accesibilidad con `jest-axe` en `frontend-web/__tests__/ui-components.test.tsx`.
- [X] T045 [P] [US1] Crear pruebas móvil de componentes, estados y etiquetas accesibles en `frontend-mobile/__tests__/ui-components.test.tsx`.

### Implementation for User Story 1 (Web)

- [X] T046 [P] [US1] Implementar `Button` e `IconButton` MD3 con variantes filled/tonal/outlined/text/danger, loading, disabled y foco visible en `frontend-web/components/ui/Button.tsx` e `frontend-web/components/ui/IconButton.tsx`.
- [X] T047 [P] [US1] Implementar `TextField` y `SearchField` con label, hint, error, iconos y anuncio de error en `frontend-web/components/ui/TextField.tsx` y `frontend-web/components/ui/SearchField.tsx`.
- [X] T048 [P] [US1] Implementar `Select`, `Checkbox`, `Radio` y `Switch` accesibles en `frontend-web/components/ui/Select.tsx`, `Checkbox.tsx`, `Radio.tsx` y `Switch.tsx`.
- [X] T049 [P] [US1] Implementar `Card`, `List`, `ListItem` y `Divider` en `frontend-web/components/ui/Card.tsx`, `List.tsx` y `Divider.tsx`.
- [X] T050 [P] [US1] Implementar `Chip`, `Badge` y `Wordmark` en `frontend-web/components/ui/Chip.tsx`, `Badge.tsx` y `Wordmark.tsx`.
- [X] T051 [P] [US1] Implementar `InlineBanner`, `Spinner` y `EmptyState` con regiones live en `frontend-web/components/ui/InlineBanner.tsx`, `Spinner.tsx` y `EmptyState.tsx`.
- [X] T052 [P] [US1] Implementar `Dialog`, `ConfirmDialog` y `Menu` con `<dialog>`, foco atrapado, Escape y retorno de foco en `frontend-web/components/ui/Dialog.tsx` y `Menu.tsx`.
- [X] T053 [P] [US1] Implementar `Page`, `Tabs` de contenido y `Breadcrumbs` cuando apliquen en `frontend-web/components/ui/Page.tsx` y `Tabs.tsx`.
- [X] T054 [US1] Crear el barrel `frontend-web/components/ui/index.ts` y las utilidades de clase/tokens en `frontend-web/lib/ui.ts`.
- [X] T055 [P] [US1] Implementar `GoogleSignInButton` web con Google Identity Services oficial (`GoogleLogin`, `locale`, `shape="pill"`, `size="large"`, `text="continue_with"`) en `frontend-web/components/ui/GoogleSignInButton.tsx`.
- [X] T056 [US1] Migrar las pantallas web actuales a `frontend-web/components/ui/index.ts` y eliminar `frontend-web/components/ui.tsx`: `frontend-web/app/auth/login/page.tsx`, `frontend-web/app/profile/setup/page.tsx`, `frontend-web/app/family/select/page.tsx`, `frontend-web/app/family/create/page.tsx`, `frontend-web/app/family/members/page.tsx`, `frontend-web/app/invite/page.tsx` y `frontend-web/app/page.tsx`.

### Implementation for User Story 1 (Móvil)

- [X] T057 [P] [US1] Implementar `Button` e `IconButton` MD3 con `Pressable`, variantes, loading, disabled y foco en `frontend-mobile/components/ui/Button.tsx` e `frontend-mobile/components/ui/IconButton.tsx`.
- [X] T058 [P] [US1] Implementar `TextField` y `SearchField` con `TextInput`, label, hint, error y `accessibilityLiveRegion` en `frontend-mobile/components/ui/TextField.tsx` y `frontend-mobile/components/ui/SearchField.tsx`.
- [X] T059 [P] [US1] Implementar `Select`, `Checkbox`, `Radio` y `Switch` con modal/lista accesible en `frontend-mobile/components/ui/Select.tsx`, `Checkbox.tsx`, `Radio.tsx` y `Switch.tsx`.
- [X] T060 [P] [US1] Implementar `Card`, `List`, `ListItem` y `Divider` en `frontend-mobile/components/ui/Card.tsx`, `List.tsx` y `Divider.tsx`.
- [X] T061 [P] [US1] Implementar `Chip`, `Badge` y `Wordmark` en `frontend-mobile/components/ui/Chip.tsx`, `Badge.tsx` y `Wordmark.tsx`.
- [X] T062 [P] [US1] Implementar `InlineBanner`, `Spinner` y `EmptyState` con `accessibilityLiveRegion` en `frontend-mobile/components/ui/InlineBanner.tsx`, `Spinner.tsx` y `EmptyState.tsx`.
- [X] T063 [P] [US1] Implementar `Dialog`, `ConfirmDialog` y `Menu` con `Modal`, `accessibilityViewIsModal` y foco accesible en `frontend-mobile/components/ui/Dialog.tsx` y `Menu.tsx`.
- [X] T064 [P] [US1] Implementar `Screen`, `Tabs` de contenido y `Breadcrumbs` cuando apliquen en `frontend-mobile/components/ui/Screen.tsx` y `Tabs.tsx`.
- [X] T065 [US1] Crear el barrel `frontend-mobile/components/ui/index.ts` y las utilidades de estilos por tema en `frontend-mobile/lib/ui.ts`.
- [X] T066 [P] [US1] Implementar `GoogleSignInButton` móvil como `Pressable` MD3 con icono oficial SVG inline y nombre accesible traducido en `frontend-mobile/components/ui/GoogleSignInButton.tsx`.
- [X] T067 [US1] Migrar las pantallas móvil actuales a `frontend-mobile/components/ui/index.ts` y eliminar `frontend-mobile/components/ui.tsx`: `frontend-mobile/app/auth/login.tsx`, `frontend-mobile/app/profile/setup.tsx`, `frontend-mobile/app/family/select.tsx`, `frontend-mobile/app/family/create.tsx`, `frontend-mobile/app/family/members.tsx`, `frontend-mobile/app/invite/index.tsx` y `frontend-mobile/app/index.tsx`.

**Checkpoint**: Biblioteca MD3 y pantallas actuales usan tokens, Inter, Lucide y componentes accesibles.

---

## Phase 4: User Story 2 - Navegación adaptada al dispositivo (Priority: P1)

**Goal**: Topbar + sidebar/rail/tabs web, tabs móvil y redirección de Inicio a Miembros sin cambiar
las URLs existentes.

**Independent Test**: Con sesión completa, recorrer Inicio, Miembros, Perfil y Ajustes a `1440`,
`840`, `839`, `600`, `599` y `320` px en web, y las tabs/stack en móvil, verificando visibilidad,
estado activo, vuelta y redirección de `/`.

### Tests for User Story 2

- [X] T068 [P] [US2] Crear pruebas web de navegación responsive, `aria-current`, visibilidad de Ajustes y redirección de `/` en `frontend-web/__tests__/navigation.test.tsx`.
- [X] T069 [P] [US2] Crear pruebas móvil de tabs, rutas del stack, botón de vuelta y ausencia de tab Ajustes en `frontend-mobile/__tests__/navigation.test.tsx`.

### Implementation for User Story 2 (Web)

- [X] T070 [P] [US2] Crear la configuración de navegación con iconos Lucide y claves i18n en `frontend-web/lib/navigation.ts`.
- [X] T071 [P] [US2] Implementar `TopAppBar` con wordmark, título de sección y menú de usuario en `frontend-web/components/layout/TopAppBar.tsx`.
- [X] T072 [P] [US2] Implementar `Sidebar` expandida en `frontend-web/components/layout/Sidebar.tsx`.
- [X] T073 [P] [US2] Implementar `Rail` media con iconos y etiquetas cortas en `frontend-web/components/layout/Rail.tsx`.
- [X] T074 [P] [US2] Implementar `BottomTabs` compacta con Inicio, Miembros y Perfil en `frontend-web/components/layout/BottomTabs.tsx`.
- [X] T075 [US2] Implementar `AppShell` con skip link, layout responsive y espacio para tabs en `frontend-web/components/layout/AppShell.tsx`.
- [X] T076 [US2] Implementar `frontend-web/components/providers/SessionProvider.tsx` y adaptar `frontend-web/hooks/useAuthGuard.ts` para el orden login → perfil → grupo, invitación pendiente y `401`.
- [X] T077 [US2] Reorganizar las rutas públicas y de onboarding web en `frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(onboarding)/profile/setup/page.tsx`, `frontend-web/app/(onboarding)/family/select/page.tsx`, `frontend-web/app/(onboarding)/family/create/page.tsx` y `frontend-web/app/(onboarding)/invite/page.tsx`, conservando las URLs.
- [X] T078 [US2] Reorganizar las rutas autenticadas web en `frontend-web/app/(app)/layout.tsx`, `frontend-web/app/(app)/page.tsx` y `frontend-web/app/(app)/family/members/page.tsx`, con `SessionProvider` y `AppShell`.
- [X] T079 [US2] Implementar la redirección de Inicio y el estado activo (`aria-current`) para Miembros/Perfil/Ajustes en `frontend-web/app/(app)/page.tsx` y `frontend-web/lib/navigation.ts`.

### Implementation for User Story 2 (Móvil)

- [X] T080 [P] [US2] Crear la configuración de navegación móvil con iconos Lucide y claves i18n en `frontend-mobile/lib/navigation.ts`.
- [X] T081 [P] [US2] Implementar `ScreenHeader` MD3 con título, vuelta opcional y acción en `frontend-mobile/components/layout/ScreenHeader.tsx`.
- [X] T082 [P] [US2] Implementar `BottomTabs` y el layout de tabs con Inicio, Miembros y Perfil en `frontend-mobile/components/layout/BottomTabs.tsx` y `frontend-mobile/app/(app)/(tabs)/_layout.tsx`.
- [X] T083 [US2] Implementar `frontend-mobile/components/providers/SessionProvider.tsx` y adaptar `frontend-mobile/hooks/useAuthGuard.ts` para el orden login → perfil → grupo, invitación pendiente y `401`.
- [X] T084 [US2] Reorganizar las rutas públicas y de onboarding móvil en `frontend-mobile/app/(auth)/auth/login.tsx`, `frontend-mobile/app/(onboarding)/profile/setup.tsx`, `frontend-mobile/app/(onboarding)/family/select.tsx`, `frontend-mobile/app/(onboarding)/family/create.tsx` y `frontend-mobile/app/(onboarding)/invite/index.tsx`.
- [X] T085 [US2] Reorganizar las rutas autenticadas móvil en `frontend-mobile/app/(app)/_layout.tsx`, `frontend-mobile/app/(app)/(tabs)/index.tsx` y `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, con redirección de Inicio a Miembros.
- [X] T086 [US2] Implementar la navegación de Ajustes desde Perfil y el botón de vuelta a Perfil cuando no hay historial en `frontend-mobile/app/(app)/settings.tsx` y `frontend-mobile/components/layout/ScreenHeader.tsx`.
- [X] T087 [US2] Actualizar las pruebas de guard existentes a la matriz de redirecciones y rutas agrupadas en `frontend-web/__tests__/useAuthGuard.test.tsx` y `frontend-mobile/__tests__/useAuthGuard.test.tsx`.

**Checkpoint**: Navegación web responsive y móvil completa, con URLs existentes y guards operativos.

---

## Phase 5: User Story 3 - Tema e idioma controlables (Priority: P2)

**Goal**: Tema Sistema/Claro/Oscuro sin parpadeo, idioma español/inglés completo y persistencia
local, con Ajustes operativo en ambas plataformas.

**Independent Test**: Cambiar tema e idioma en Ajustes, recargar web, cerrar/abrir móvil y verificar
persistencia, actualización en caliente, `lang`/`data-theme` iniciales y errores visibles
traducidos.

### Tests for User Story 3

- [X] T088 [P] [US3] Crear pruebas web de tema inicial sin parpadeo, cambio en caliente y persistencia en `frontend-web/__tests__/theme.test.tsx`.
- [X] T089 [P] [US3] Crear pruebas web de cambio de idioma sin recarga, traducción de errores visibles y persistencia en `frontend-web/__tests__/locale.test.tsx`.
- [X] T090 [P] [US3] Crear pruebas móvil de tema sistema/claro/oscuro, cambio en caliente y persistencia en `frontend-mobile/__tests__/theme.test.tsx`.
- [X] T091 [P] [US3] Crear pruebas móvil de cambio de idioma, formato `Intl` y persistencia en `frontend-mobile/__tests__/locale.test.tsx`.

### Implementation for User Story 3

- [X] T092 [US3] Convertir `frontend-web/app/layout.tsx` en server layout con Inter (`next/font/google`, `--font-inter`, `display: "swap"`), `lang` desde cookie, `data-theme`, script previo al paint, `AppProviders` y `generateMetadata` con marca Kitho.
- [X] T093 [US3] Implementar Ajustes web con tema, idioma, cerrar sesión, acerca de/versión (`package.json`), aviso legal y enlaces a editar perfil/avatar en `frontend-web/app/(app)/settings/page.tsx`.
- [X] T094 [US3] Refactorizar `frontend-mobile/app/_layout.tsx` con `GestureHandlerRootView`, `SafeAreaProvider`, fuentes Inter, splash retenido hasta hidratar preferencias, `AppProviders` y Stack raíz.
- [X] T095 [US3] Implementar Ajustes móvil con tema, idioma, cerrar sesión, acerca de/versión (`app.json`), aviso legal y enlaces a editar perfil/avatar en `frontend-mobile/app/(app)/settings.tsx`.
- [X] T096 [US3] Conectar los selectores de tema/idioma a `ThemeProvider`/`LocaleProvider` y asegurar que logout y `401` no borran `kitho_theme`/`kitho_locale` en `frontend-web/app/(app)/settings/page.tsx`, `frontend-mobile/app/(app)/settings.tsx`, `frontend-web/lib/session.ts` y `frontend-mobile/lib/session.ts`.

**Checkpoint**: Tema e idioma persisten, cambian en caliente y no dejan cadenas sin traducir.

---

## Phase 6: User Story 4 - Onboarding y gestión familiar con las nuevas vistas (Priority: P2)

**Goal**: Refactorizar login, perfil, grupo, invitación y miembros; añadir Perfil, edición de perfil
e Inicio sin romper los flujos de la spec 001.

**Independent Test**: Ejecutar login → perfil → creación/unión de grupo → miembros → perfil/edición
en web y móvil, comprobando URLs, guards, errores y datos existentes.

### Tests for User Story 4

- [X] T097 [P] [US4] Actualizar las pruebas de flujos web existentes a las nuevas rutas/componentes en `frontend-web/__tests__/flows.test.tsx`.
- [X] T098 [P] [US4] Actualizar las pruebas de flujos móvil existentes a las nuevas rutas/componentes en `frontend-mobile/__tests__/flows.test.tsx`.

### Implementation for User Story 4 (Web)

- [X] T099 [P] [US4] Refactorizar el login web con `Wordmark`, `GoogleSignInButton`, `InlineBanner`, spinner y errores traducidos en `frontend-web/app/(auth)/auth/login/page.tsx`.
- [X] T100 [P] [US4] Refactorizar la configuración de perfil web con `TextField`, avatar por defecto y estados en `frontend-web/app/(onboarding)/profile/setup/page.tsx`.
- [X] T101 [P] [US4] Refactorizar selección y creación de grupo web con `Card`, `Select` de moneda, validación y conflictos en `frontend-web/app/(onboarding)/family/select/page.tsx` y `frontend-web/app/(onboarding)/family/create/page.tsx`.
- [X] T102 [P] [US4] Refactorizar invitación web con resumen, parentesco, estados inválido/expirado y acciones en `frontend-web/app/(onboarding)/invite/page.tsx`.
- [X] T103 [P] [US4] Refactorizar miembros web con lista, límite de 10, roles, invitación y acciones accesibles en `frontend-web/app/(app)/family/members/page.tsx`.
- [X] T104 [P] [US4] Crear Perfil web con avatar, nombre, correo, editar perfil, editar avatar y enlace a Ajustes en `frontend-web/app/(app)/profile/page.tsx`.
- [X] T105 [P] [US4] Crear edición de perfil web con nombre, avatar actual y guardar/cancelar en `frontend-web/app/(app)/profile/edit/page.tsx`.

### Implementation for User Story 4 (Móvil)

- [X] T106 [P] [US4] Refactorizar el login móvil con `Wordmark`, `GoogleSignInButton`, `InlineBanner`, spinner y errores traducidos en `frontend-mobile/app/(auth)/auth/login.tsx`.
- [X] T107 [P] [US4] Refactorizar la configuración de perfil móvil con `TextField`, avatar por defecto y estados en `frontend-mobile/app/(onboarding)/profile/setup.tsx`.
- [X] T108 [P] [US4] Refactorizar selección y creación de grupo móvil con `Card`, `Select` de moneda, validación y conflictos en `frontend-mobile/app/(onboarding)/family/select.tsx` y `frontend-mobile/app/(onboarding)/family/create.tsx`.
- [X] T109 [P] [US4] Refactorizar invitación móvil con resumen, parentesco, estados inválido/expirado y acciones en `frontend-mobile/app/(onboarding)/invite/index.tsx`.
- [X] T110 [P] [US4] Refactorizar miembros móvil con lista, límite de 10, roles, invitación y acciones accesibles en `frontend-mobile/app/(app)/(tabs)/family/members.tsx`.
- [X] T111 [P] [US4] Crear Perfil móvil con avatar, nombre, correo, editar perfil, editar avatar y enlace a Ajustes en `frontend-mobile/app/(app)/(tabs)/profile.tsx`.
- [X] T112 [P] [US4] Crear edición de perfil móvil con nombre, avatar actual y guardar/cancelar en `frontend-mobile/app/(app)/profile/edit.tsx`.
- [X] T113 [US4] Integrar el avatar por defecto determinista en onboarding web/móvil y validar que `foto_avatar` no supera 2048 caracteres en `frontend-web/app/(onboarding)/profile/setup/page.tsx` y `frontend-mobile/app/(onboarding)/profile/setup.tsx`.
- [X] T114 [US4] Conectar las entradas a Ajustes, edición de perfil y editor de avatar desde Perfil en `frontend-web/app/(app)/profile/page.tsx` y `frontend-mobile/app/(app)/(tabs)/profile.tsx`.

**Checkpoint**: Flujos de la spec 001 completos con el nuevo sistema y nuevas vistas Perfil/edición.

---

## Phase 7: User Story 5 - Feedback claro en todas las acciones (Priority: P3)

**Goal**: Spinners, banners inline, estados vacíos, regiones live y confirmaciones destructivas en
todas las pantallas.

**Independent Test**: Forzar carga lenta, error conocido/desconocido, lista vacía y acción
destructiva en web y móvil, comprobando spinner + control deshabilitado, banner traducido, estado
vacío y diálogo MD3 con foco.

### Tests for User Story 5

- [X] T115 [P] [US5] Crear pruebas web de estados de carga/error/éxito/vacío, live regions y confirmación destructiva en `frontend-web/__tests__/feedback.test.tsx`.
- [X] T116 [P] [US5] Crear pruebas móvil de estados de carga/error/éxito/vacío, live regions y confirmación destructiva en `frontend-mobile/__tests__/feedback.test.tsx`.

### Implementation for User Story 5

- [X] T117 [US5] Sustituir `window.confirm` por `ConfirmDialog` en la expulsión de miembros web y actualizar las expectativas en `frontend-web/app/(app)/family/members/page.tsx` y `frontend-web/__tests__/flows.test.tsx`.
- [X] T118 [US5] Sustituir `Alert.alert` por `ConfirmDialog` en la expulsión de miembros móvil y actualizar las expectativas en `frontend-mobile/app/(app)/(tabs)/family/members.tsx` y `frontend-mobile/__tests__/flows.test.tsx`.
- [X] T119 [US5] Integrar spinner con texto y control deshabilitado en todas las acciones asíncronas web (`frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(onboarding)/profile/setup/page.tsx`, `frontend-web/app/(onboarding)/family/select/page.tsx`, `frontend-web/app/(onboarding)/family/create/page.tsx`, `frontend-web/app/(onboarding)/invite/page.tsx`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-web/app/(app)/profile/edit/page.tsx`).
- [X] T120 [US5] Integrar spinner con texto y control deshabilitado en todas las acciones asíncronas móvil (`frontend-mobile/app/(auth)/auth/login.tsx`, `frontend-mobile/app/(onboarding)/profile/setup.tsx`, `frontend-mobile/app/(onboarding)/family/select.tsx`, `frontend-mobile/app/(onboarding)/family/create.tsx`, `frontend-mobile/app/(onboarding)/invite/index.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, `frontend-mobile/app/(app)/profile/edit.tsx`).
- [X] T121 [US5] Integrar banners inline con reintento y descriptor `{ key, fallback, status }`, incluido error de configuración, en `frontend-web/components/ui/InlineBanner.tsx`, `frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(onboarding)/profile/setup/page.tsx`, `frontend-web/app/(onboarding)/family/select/page.tsx`, `frontend-web/app/(onboarding)/family/create/page.tsx`, `frontend-web/app/(onboarding)/invite/page.tsx`, `frontend-web/app/(app)/family/members/page.tsx` y `frontend-web/app/(app)/profile/edit/page.tsx`.
- [X] T122 [US5] Integrar banners inline con reintento y descriptor `{ key, fallback, status }`, incluido error de configuración, en `frontend-mobile/components/ui/InlineBanner.tsx`, `frontend-mobile/app/(auth)/auth/login.tsx`, `frontend-mobile/app/(onboarding)/profile/setup.tsx`, `frontend-mobile/app/(onboarding)/family/select.tsx`, `frontend-mobile/app/(onboarding)/family/create.tsx`, `frontend-mobile/app/(onboarding)/invite/index.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx` y `frontend-mobile/app/(app)/profile/edit.tsx`.
- [X] T123 [US5] Añadir estados vacíos y acciones sugeridas web en miembros/invitación/grupo en `frontend-web/app/(app)/family/members/page.tsx`, `frontend-web/app/(onboarding)/invite/page.tsx` y `frontend-web/app/(onboarding)/family/select/page.tsx`.
- [X] T124 [US5] Añadir estados vacíos y acciones sugeridas móvil en miembros/invitación/grupo en `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, `frontend-mobile/app/(onboarding)/invite/index.tsx` y `frontend-mobile/app/(onboarding)/family/select.tsx`.
- [X] T125 [US5] Verificar y ajustar regiones `role="alert"`/`role="status"`, `aria-live`, `accessibilityLiveRegion`, foco y anuncios en `frontend-web/components/ui/InlineBanner.tsx` y `frontend-web/components/ui/Dialog.tsx`.
- [X] T126 [US5] Verificar y ajustar regiones live, foco y anuncios en `frontend-mobile/components/ui/InlineBanner.tsx` y `frontend-mobile/components/ui/Dialog.tsx`.
- [X] T127 [US5] Cubrir expiración de sesión con `401` conservando tema/idioma y redirigiendo a login en `frontend-web/hooks/useAuthGuard.ts` y `frontend-mobile/hooks/useAuthGuard.ts`.

**Checkpoint**: Todas las acciones muestran carga, error, éxito, vacío o confirmación según contrato.

---

## Phase 8: User Story 6 - Editor de avatar con vista previa (Priority: P3)

**Goal**: Avatar por defecto y editor dedicado con vista previa inmediata, sin persistencia ni
subida de archivos en 002.

**Independent Test**: Abrir el editor desde Perfil, cambiar base/fondo/cabello/ropa/ojos/accesorios,
ver la vista previa actualizarse en `<100 ms`, pulsar Guardar y comprobar el aviso de spec 003 sin
cambiar el avatar guardado.

### Tests for User Story 6

- [X] T128 [P] [US6] Crear pruebas web del motor de avatar determinista, longitud `<=2048` y data URI válido en `frontend-web/__tests__/avatar.test.ts`.
- [X] T129 [P] [US6] Crear pruebas móvil del motor de avatar determinista, longitud `<=2048` y data URI válido en `frontend-mobile/__tests__/avatar.test.ts`.
- [X] T130 [P] [US6] Crear pruebas web del editor: opciones, vista previa inmediata, aviso de guardado y confirmación al descartar en `frontend-web/__tests__/avatar-editor.test.tsx`.
- [X] T131 [P] [US6] Crear pruebas móvil del editor: opciones, vista previa inmediata, aviso de guardado y confirmación al descartar en `frontend-mobile/__tests__/avatar-editor.test.tsx`.

### Implementation for User Story 6

- [X] T132 [P] [US6] Implementar `Avatar` web con `src`, `config`, iniciales, tamaños y `alt` en `frontend-web/components/avatar/Avatar.tsx`.
- [X] T133 [P] [US6] Implementar `Avatar` móvil con `SvgXml`/`Image`, iniciales, tamaños y etiqueta accesible en `frontend-mobile/components/avatar/Avatar.tsx`.
- [X] T134 [P] [US6] Implementar `AvatarEditor` web con controles de base/fondo/cabello/ropa/ojos/accesorios, vista previa y aviso de spec 003 en `frontend-web/components/avatar/AvatarEditor.tsx`.
- [X] T135 [P] [US6] Implementar `AvatarEditor` móvil con los mismos controles, vista previa y aviso de spec 003 en `frontend-mobile/components/avatar/AvatarEditor.tsx`.
- [X] T136 [P] [US6] Crear la ruta dedicada web del editor en `frontend-web/app/(app)/profile/avatar/page.tsx` con vuelta y confirmación si hay cambios.
- [X] T137 [P] [US6] Crear la ruta dedicada móvil del editor en `frontend-mobile/app/(app)/profile/avatar.tsx` con `ScreenHeader`, vuelta y confirmación si hay cambios.
- [X] T138 [US6] Mostrar el avatar por defecto en Perfil y conectar las entradas al editor desde Perfil/Ajustes en `frontend-web/app/(app)/profile/page.tsx`, `frontend-web/app/(app)/settings/page.tsx`, `frontend-mobile/app/(app)/(tabs)/profile.tsx` y `frontend-mobile/app/(app)/settings.tsx`.
- [X] T139 [US6] Asegurar que Guardar solo muestra el aviso inline de spec 003, no persiste ni navega, y que el data URI por defecto se mantiene en `frontend-web/components/avatar/AvatarEditor.tsx` y `frontend-mobile/components/avatar/AvatarEditor.tsx`.

**Checkpoint**: Editor de avatar previsualiza al instante y comunica claramente que no persiste.

---

## Phase 9: User Story 7 - Base de visualización de datos para el futuro (Priority: P4)

**Goal**: Contenedores de gráficos diferidos con tokens de tema, sin incluirlos en el bundle
inicial de las rutas actuales.

**Independent Test**: Verificar que Recharts/Victory Native solo se importan desde
`components/charts/`, que ninguna ruta actual los importa y que `check-ui`/build no los incluyen en
el bundle inicial.

### Tests for User Story 7

- [X] T140 [P] [US7] Crear prueba web de frontera de gráficos y ausencia de imports en rutas actuales en `frontend-web/__tests__/charts.test.ts`.
- [X] T141 [P] [US7] Crear prueba móvil de frontera de gráficos y ausencia de imports en rutas actuales en `frontend-mobile/__tests__/charts.test.ts`.

### Implementation for User Story 7

- [X] T142 [P] [US7] Implementar `ChartContainer` web con `next/dynamic`/`ssr:false`, tokens de tema y resumen accesible en `frontend-web/components/charts/ChartContainer.tsx`.
- [X] T143 [P] [US7] Implementar `ChartContainer` móvil con Victory Native, tokens de tema y resumen accesible en `frontend-mobile/components/charts/ChartContainer.tsx`.
- [X] T144 [US7] Añadir reglas `no-restricted-imports` para `recharts` y `victory-native` fuera de `components/charts/` en `frontend-web/.eslintrc.json` y `frontend-mobile/.eslintrc.json`.
- [X] T145 [US7] Ejecutar `node scripts/check-ui.mjs` y verificar que ninguna ruta actual importa `ChartContainer` ni las librerías de gráficos; documentar el resultado en `specs/002-ui-styles-and-views/quickstart.md`.

**Checkpoint**: Base de gráficos disponible y fuera del bundle inicial actual.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Limpieza, validación integral y cierre de la feature.

- [X] T146 Eliminar restos de la UI antigua y referencias obsoletas en `frontend-web/components/ui.tsx`, `frontend-mobile/components/ui.tsx`, `frontend-web/__tests__/ui.test.tsx` y `frontend-mobile/__tests__/ui.test.tsx`.
- [X] T147 [P] Actualizar `README.md` con los comandos de instalación, generación y validación de la feature 002.
- [X] T148 [P] Ejecutar `node scripts/generate-shared.mjs --check`, `node scripts/check-shared.mjs` y `node scripts/check-ui.mjs`; corregir cualquier deriva en `design-tokens/tokens.json`, `shared/` o archivos generados.
- [X] T149 [P] Ejecutar y corregir `pnpm run typecheck`, `pnpm run lint`, `pnpm test` y `pnpm run build` definidos en `frontend-web/package.json`.
- [X] T150 [P] Ejecutar y corregir `pnpm run typecheck`, `pnpm run lint`, `pnpm test` y `npx expo-doctor` definidos en `frontend-mobile/package.json`.
- [ ] T151 Ejecutar auditoría de accesibilidad con `jest-axe` en `frontend-web/__tests__/ui-components.test.tsx` y `frontend-web/__tests__/feedback.test.tsx`, Lighthouse `>=95` en `frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(app)/family/members/page.tsx` y `frontend-web/app/(app)/settings/page.tsx`, además de teclado, zoom 200 %, 320 px y movimiento reducido.
- [ ] T152 Ejecutar los escenarios manuales de `specs/002-ui-styles-and-views/quickstart.md` en web y móvil, incluidos tema, idioma, avatar, sesión expirada y breakpoints.
- [X] T153 Auditar marca y metadatos en `frontend-web/lib/branding.ts`, `frontend-mobile/lib/branding.ts`, `frontend-web/app/layout.tsx` y `frontend-mobile/app.json`: wordmark Kitho, títulos `Kitho: Tareas y Finanzas Familiares`/`Kitho Family`, ausencia de imágenes rotas y ausencia de variantes no aprobadas.
- [ ] T154 Verificar paridad visual web/móvil en `frontend-web/app/(auth)/auth/login/page.tsx`, `frontend-web/app/(app)/family/members/page.tsx`, `frontend-web/app/(app)/profile/page.tsx`, `frontend-web/app/(app)/settings/page.tsx`, `frontend-mobile/app/(auth)/auth/login.tsx`, `frontend-mobile/app/(app)/(tabs)/family/members.tsx`, `frontend-mobile/app/(app)/(tabs)/profile.tsx` y `frontend-mobile/app/(app)/settings.tsx`, y ausencia de scroll horizontal en 320/600/840/1440 px.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; puede empezar de inmediato.
- **Foundational (Phase 2)**: depende de Phase 1 y bloquea todas las historias.
- **User Stories (Phase 3+)**: dependen de Foundational.
  - US1 y US2 son P1 y forman el MVP técnico; US2 consume componentes de US1.
  - US3 depende de US1/US2 para Ajustes y navegación.
  - US4 depende de US1–US3 para reutilizar componentes y enlaces.
  - US5 depende de US4 porque integra estados en esas pantallas.
  - US6 depende de US1/US2 y de las entradas de Perfil/Ajustes de US3/US4.
  - US7 solo depende de Foundational y US1; puede ejecutarse en paralelo con US3–US6.
- **Polish (Phase 10)**: depende de todas las historias incluidas en la entrega.

### User Story Dependencies

- **US1 (P1)**: sin dependencias de otras historias; base de componentes.
- **US2 (P1)**: depende de Botón/IconButton/Wordmark/Page de US1.
- **US3 (P2)**: depende de US1/US2 y de la ruta de Ajustes.
- **US4 (P2)**: depende de US1–US3 y del motor de avatar foundational.
- **US5 (P3)**: depende de US4.
- **US6 (P3)**: depende de US1, US2 y las entradas de Perfil de US3/US4.
- **US7 (P4)**: independiente tras Foundational; no debe importarse desde rutas actuales.

### Within Each User Story

- Las pruebas deben escribirse y fallar antes de la implementación.
- Componentes base antes de pantallas.
- Rutas y guards antes de integraciones de estado.
- La historia debe validarse en su checkpoint antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- T003–T007 de Setup pueden ejecutarse en paralelo.
- T008–T011, T013–T020, T022–T023, T025–T030, T032–T039 y T042–T043 de Foundational pueden ejecutarse en paralelo dentro de sus dependencias.
- En US1, los componentes web T046–T053 y T055 comparten pocas dependencias y pueden paralelizarse; igual en móvil T057–T064 y T066.
- En US2, T070–T074 y T080–T082 pueden paralelizarse; los layouts T075–T079 y T083–T086 son secuenciales.
- En US3, las pruebas T088–T091 y las pantallas T093/T095 pueden paralelizarse; layouts T092/T094 van antes de validar.
- En US4, las pantallas T099–T112 pueden repartirse por flujo (login, onboarding, miembros, perfil).
- En US6, componentes T132–T135 y rutas T136–T137 pueden paralelizarse.
- US7 T142–T143 pueden ejecutarse en paralelo.

---

## Parallel Example: User Story 1

```bash
# Componentes web independientes
Task: "Implementar Button e IconButton en frontend-web/components/ui/Button.tsx e IconButton.tsx"
Task: "Implementar TextField y SearchField en frontend-web/components/ui/TextField.tsx y SearchField.tsx"
Task: "Implementar Card, List, ListItem y Divider en frontend-web/components/ui/Card.tsx, List.tsx y Divider.tsx"

# Componentes móvil independientes
Task: "Implementar Button e IconButton en frontend-mobile/components/ui/Button.tsx e IconButton.tsx"
Task: "Implementar TextField y SearchField en frontend-mobile/components/ui/TextField.tsx y SearchField.tsx"
Task: "Implementar Card, List, ListItem y Divider en frontend-mobile/components/ui/Card.tsx, List.tsx y Divider.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational.
3. Completar US1 (sistema visual y componentes).
4. Completar US2 (navegación adaptativa y guards).
5. **STOP and VALIDATE**: recorrer las pantallas existentes en web/móvil, comprobar tokens, rutas,
   breakpoints y accesibilidad básica.
6. Demo del MVP técnico si está listo.

### Incremental Delivery

1. Setup + Foundational → base compartida sin deriva.
2. US1 + US2 → MVP visual/navegable.
3. US3 → tema e idioma persistentes.
4. US4 → flujos existentes refactorizados y Perfil/edición.
5. US5 → estados y confirmaciones completos.
6. US6 → editor de avatar con vista previa.
7. US7 → base de gráficos diferida.
8. Polish → validación integral y cierre.

### Parallel Team Strategy

1. El equipo completa Setup + Foundational.
2. Tras Foundational:
   - Persona A: US1 web.
   - Persona B: US1 móvil.
   - Persona C: US7 (contenedores y guardas).
3. Tras US1: US2 web/móvil en paralelo; después US3 y US4 por flujo.
4. US5 y US6 después de US4; Polish al final con todas las personas.

---

## Notes

- `[P]` implica archivos distintos y sin dependencia directa.
- Cada tarea conserva la trazabilidad a un FR/SC mediante el contrato o la historia.
- No se modifican backend, API, PostgreSQL ni Docker Compose.
- Los tests deben fallar antes de implementar y pasar en el checkpoint de cada historia.
- No se persiste la personalización del avatar en 002; solo se previsualiza.
- No se importan librerías de gráficos desde rutas actuales.
- Verificar `quickstart.md` antes de considerar la feature terminada.

---

## Phase 11: Convergence

**Purpose**: Cerrar las brechas detectadas entre `spec.md`, `plan.md`, `tasks.md` y la implementación actual.

- [X] T155 Añadir personalización de ropa y ojos al avatar en `shared/avatar/avatar-options.json`, `shared/avatar/avatar-engine.ts`, catálogos i18n y editores web/móvil (`frontend-web/components/ui/AvatarEditor.tsx`, `frontend-mobile/components/ui/AvatarEditor.tsx`), con pruebas de opciones y vista previa, per FR-050 (partial).
- [X] T156 Implementar `prefers-reduced-motion` en web (`frontend-web/app/globals.css`) y respetar la preferencia de movimiento reducido en las animaciones móviles, con verificación documentada, per FR-040 (missing).
- [X] T157 Sustituir los colores literales `rgba(0,0,0,0.4)` de `frontend-mobile/components/ui/Dialog.tsx` y `frontend-mobile/components/ui/Select.tsx` por un token de scrim del tema, per FR-008 (contradicts).
- [X] T158 Eliminar las cadenas visibles hardcodeadas en los valores por defecto de `Spinner`, `Loading`, `Dialog` y `Breadcrumbs` de web y móvil, usando los catálogos i18n, per FR-030 (partial).
- [X] T159 Añadir la sección de aviso legal en Ajustes web y móvil usando `legal.title`/`legal.body`, conservando acerca de y versión, per FR-042 (partial).
- [X] T160 Añadir confirmación de cambios sin guardar y navegación de vuelta correcta en las rutas del editor de avatar web/móvil, per FR-047/FR-051 (partial).
- [X] T161 Añadir una acción explícita de guardado en el editor de avatar web/móvil que solo muestre el aviso de la spec 003, sin persistir ni navegar, per FR-053 (partial).
- [X] T162 Sincronizar el fondo del sistema móvil con el tema resuelto usando `expo-system-ui`, per T018/plan: tema móvil (partial).
- [X] T163 Añadir estados pressed/focus visibles a los componentes interactivos móviles que aún no los exponen (`Chip`, `ListItem`), per FR-014 (partial).

**Nota**: T151, T152 y T154 siguen pendientes como validación manual (Lighthouse, teclado/zoom/movimiento reducido, VoiceOver/TalkBack, breakpoints y paridad visual); no se duplican aquí.
