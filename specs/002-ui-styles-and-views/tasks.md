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
- No se modifican `backend/`, `docker-compose.yml` ni el esquema de PostgreSQL. La UI consume las
  extensiones de la spec 001 (código de invitación de un solo uso/7 días, soft delete, abandono y
  reasignación de administrador).

## Path Conventions

- Web: `frontend-web/`
- Móvil: `frontend-mobile/`
- Artefactos compartidos: `design-tokens/`, `shared/` y `scripts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencias y configuración base de ambos frontends.

- [X] T001 Actualizar dependencias y scripts web en `frontend-web/package.json` y regenerar `frontend-web/pnpm-lock.yaml` con `next-intl`, `tailwindcss`, `@tailwindcss/postcss`, `lucide-react`, `recharts`, `react-is`, `jest-axe`, `@types/jest-axe` y `eslint-plugin-jsx-a11y`.
- [X] T002 Actualizar dependencias móvil en `frontend-mobile/package.json` y regenerar `frontend-mobile/pnpm-lock.yaml` con `i18n-js`, `@expo-google-fonts/inter`, `lucide-react-native`, `expo-location`, `expo-localization`, `victory-native@42.0.1`, Skia 2.14.0, Reanimated 4.7.1 y Gesture Handler 3.3.0.
- [X] T003 [P] Configurar Tailwind 4 y PostCSS en `frontend-web/postcss.config.mjs` y `frontend-web/app/globals.css` con `@import "tailwindcss"`, `@theme inline`, breakpoints MD3 `600px`/`840px` y carga de `frontend-web/app/generated/tokens.generated.css`.
- [X] T004 [P] Configurar `next-intl` sin rutas `[locale]` en `frontend-web/next.config.ts` y el provider cliente en `frontend-web/components/providers/AppProviders.tsx`.
- [X] T005 [P] Configurar Jest, Testing Library, `jest-axe`, mocks de `matchMedia`, `navigator.geolocation` y reglas de accesibilidad en `frontend-web/jest.config.js`, `frontend-web/jest.setup.ts` y `frontend-web/.eslintrc.json`.
- [X] T006 [P] Actualizar `frontend-mobile/app.json` con `name: "Kitho"`, `slug: "kitho"`, `userInterfaceStyle: "automatic"`, plugin `expo-localization` para `es`/`en`, permiso de ubicación de `expo-location` y scheme/package/bundle existentes sin cambios.
- [X] T007 [P] Ampliar mocks de Jest y reglas ESLint móvil en `frontend-mobile/jest.setup.js` y `frontend-mobile/.eslintrc.json` para SecureStore, `expo-localization`, `expo-location`, `useColorScheme`, Google OAuth y fuentes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, generación compartida, proveedores, preferencias, API y utilidades que bloquean
todas las historias. La spec 002 no modifica el backend.

**CRITICAL**: Ninguna historia puede considerarse terminada sin esta fase.

- [X] T008 Crear/ajustar `design-tokens/tokens.json` con roles MD3 claros/oscuros derivados de `#6750A4`, roles `success`/`warning`, tipografía Inter, espaciado, radios, elevación, movimiento, iconos y breakpoints `compact=0`, `medium=600`, `expanded=840`.
- [X] T009 Ampliar `scripts/generate-shared.mjs` para generar `frontend-web/lib/generated/tokens.ts`, `frontend-web/app/generated/tokens.generated.css` y `frontend-mobile/lib/generated/tokens.ts` desde `design-tokens/tokens.json` con cabecera `AUTO-GENERATED`.
- [X] T010 Ampliar `scripts/generate-shared.mjs` para generar `frontend-web/lib/i18n/messages.generated.ts`, `frontend-mobile/lib/i18n/messages.generated.ts`, `frontend-web/lib/generated/error-keys.ts`, `frontend-mobile/lib/generated/error-keys.ts` y las copias de avatar desde `shared/`.
- [X] T011 Crear `shared/currencies/regions.json` con las listas LatAm `MXN, BRL, ARS, COP, CLP`; España/Europa `EUR, GBP, CHF, SEK, PLN`; EE.UU. `USD, CAD, MXN, EUR, GBP`, y el mapeo país→moneda local.
- [X] T012 Ampliar `scripts/generate-shared.mjs` para copiar `shared/currencies/regions.json` a `frontend-web/lib/currencies.generated.ts` y `frontend-mobile/lib/currencies.generated.ts`.
- [X] T013 Crear/ajustar `shared/i18n/es.json` y `shared/i18n/en.json` con los namespaces `common`, `auth`, `profile`, `family`, `invite`, `members`, `settings`, `avatar`, `errors`, `a11y` y `legal`, incluyendo moneda, código de invitación, acciones de familia y errores usados/expirados.
- [X] T014 Crear/ajustar `shared/errors/error-keys.json` con el mapeo detalle→clave para invitación inválida/usada/expirada, moneda inválida, eliminar/abandonar familia y reasignación fallida; mantener `errors.status.<code>`.
- [X] T015 Implementar `frontend-web/lib/branding.ts` y `frontend-mobile/lib/branding.ts` con `BRAND_NAME`, títulos de tienda y wordmark provisional, sin imágenes externas.
- [X] T016 Implementar preferencias web en `frontend-web/lib/preferences.ts` con `kitho_theme` y `kitho_locale` en `localStorage` + cookies `Path=/`, `SameSite=Lax`, `Max-Age=31536000` y `Secure` en HTTPS.
- [X] T017 Implementar preferencias móvil en `frontend-mobile/lib/preferences.ts` con `kitho_theme` y `kitho_locale` en SecureStore, sin borrarlas en logout/`401`.
- [X] T018 Implementar `frontend-web/components/providers/ThemeProvider.tsx` con modos Sistema/Claro/Oscuro, `data-theme`, `matchMedia` en caliente y sin flash inicial.
- [X] T019 Implementar `frontend-mobile/components/providers/ThemeProvider.tsx` con `useColorScheme`, override persistido, `StatusBar` y splash retenido hasta hidratar.
- [X] T020 Implementar `frontend-web/components/providers/LocaleProvider.tsx` con `next-intl`, locale inicial desde cookie y cambio de idioma sin recargar ni cambiar la URL.
- [X] T021 Implementar `frontend-mobile/components/providers/LocaleProvider.tsx` con `i18n-js`, región de `expo-localization` para formato y español por defecto.
- [X] T022 Implementar `frontend-web/lib/format.ts` y `frontend-mobile/lib/format.ts` con `Intl.NumberFormat`, `Intl.DateTimeFormat` y `Intl.DisplayNames` para la moneda única del grupo.
- [X] T023 Actualizar `frontend-web/lib/types.ts` y `frontend-web/lib/api.ts` para el contrato de spec 001: `Invitation.codigo` sin `link`, `expira_en`, `usado`; `Member.rol_familiar`/`rol_permiso`/`created_at`; `Family.estado`; métodos `joinFamilyByCode`, `leaveFamily`, `deleteFamily` y creación de invitación con 168 horas.
- [X] T024 Actualizar `frontend-mobile/lib/types.ts` y `frontend-mobile/lib/api.ts` con el mismo contrato de spec 001 que web, incluidos errores usados/expirados y acciones de familia.
- [X] T025 Renombrar la persistencia de invitación pendiente a código en `frontend-web/lib/session.ts` y `frontend-mobile/lib/session.ts`, conservando la clave `finanzas_familiares_pending_invite` para no romper sesiones existentes.
- [X] T026 Implementar el descriptor de error con `status`, `messageKey` y `fallbackDetail` en `frontend-web/lib/errors.ts` y `frontend-mobile/lib/errors.ts`, traduciendo en render.
- [X] T027 Ampliar `frontend-web/__tests__/helpers/renderWithProviders.tsx` y `frontend-mobile/__tests__/helpers/renderWithProviders.tsx` con mocks de tema, locale, geolocalización, `Intl.DisplayNames` y API de spec 001.

**Checkpoint**: Fundación lista; las historias pueden empezar en paralelo.

---

## Phase 3: User Story 1 - Sistema visual coherente y accesible (Priority: P1)

**Goal**: Tokens, componentes MD3 y accesibilidad compartidos por nombre en web y móvil.

**Independent Test**: Navegar pantallas actuales en web y móvil y comprobar mismos tokens,
tipografía Inter, iconos Lucide, estados de componente y ausencia de valores visuales hardcodeados.

### Tests for User Story 1

- [X] T028 [P] [US1] Crear pruebas de tokens y derivación en `frontend-web/__tests__/design-tokens.test.ts`, validando `#6750A4`, breakpoints `0/600/840`, roles `on-*` y ausencia de hex hardcodeados.
- [X] T029 [P] [US1] Crear pruebas equivalentes de tokens en `frontend-mobile/__tests__/design-tokens.test.ts`, incluyendo objetivos táctiles de 48 dp y contraste WCAG AA.
- [X] T030 [P] [US1] Crear pruebas de componentes y accesibilidad web en `frontend-web/__tests__/ui-components.test.tsx` para roles, nombres, foco, disabled, error y `jest-axe`.

### Implementation for User Story 1

- [X] T031 [P] [US1] Refactorizar botones y campos web en `frontend-web/components/ui/Button.tsx`, `frontend-web/components/ui/IconButton.tsx`, `frontend-web/components/ui/TextField.tsx`, `frontend-web/components/ui/Select.tsx`, `frontend-web/components/ui/Checkbox.tsx`, `frontend-web/components/ui/RadioGroup.tsx`, `frontend-web/components/ui/Switch.tsx` y `frontend-web/components/ui/SearchField.tsx` con variantes filled/tonal/outlined/text/danger y estados completos.
- [X] T032 [P] [US1] Refactorizar contenido web en `frontend-web/components/ui/Card.tsx`, `frontend-web/components/ui/List.tsx`, `frontend-web/components/ui/Avatar.tsx`, `frontend-web/components/ui/Chip.tsx`, `frontend-web/components/ui/Badge.tsx`, `frontend-web/components/ui/Wordmark.tsx` y `frontend-web/components/ui/Breadcrumbs.tsx` usando tokens.
- [X] T033 [P] [US1] Refactorizar feedback web en `frontend-web/components/ui/Dialog.tsx`, `frontend-web/components/ui/Menu.tsx`, `frontend-web/components/ui/InlineBanner.tsx`, `frontend-web/components/ui/Spinner.tsx`, `frontend-web/components/ui/Loading.tsx` y `frontend-web/components/ui/EmptyState.tsx` con `<dialog>`, foco atrapado, Escape y regiones live.
- [X] T034 [US1] Actualizar `frontend-web/components/ui/GoogleSignInButton.tsx` al botón oficial de Google Identity Services con `locale`, `shape="pill"`, `size="large"`, `text="continue_with"`, fondo blanco/outline y logo G sin recolorear.
- [X] T035 [P] [US1] Refactorizar formularios móvil en `frontend-mobile/components/ui/Button.tsx`, `frontend-mobile/components/ui/Field.tsx`, `frontend-mobile/components/ui/Select.tsx`, `frontend-mobile/components/ui/Checkbox.tsx`, `frontend-mobile/components/ui/ChoiceGroup.tsx`, `frontend-mobile/components/ui/Switch.tsx` y `frontend-mobile/components/ui/SearchField.tsx` con las mismas variantes y estados.
- [X] T036 [P] [US1] Refactorizar contenido móvil en `frontend-mobile/components/ui/Card.tsx`, `frontend-mobile/components/ui/List.tsx`, `frontend-mobile/components/ui/Avatar.tsx`, `frontend-mobile/components/ui/Chip.tsx`, `frontend-mobile/components/ui/Badge.tsx`, `frontend-mobile/components/ui/Wordmark.tsx` y `frontend-mobile/components/ui/Breadcrumbs.tsx` usando tokens.
- [X] T037 [P] [US1] Refactorizar feedback móvil en `frontend-mobile/components/ui/Dialog.tsx`, `frontend-mobile/components/ui/Menu.tsx`, `frontend-mobile/components/ui/InlineBanner.tsx`, `frontend-mobile/components/ui/Spinner.tsx`, `frontend-mobile/components/ui/Loading.tsx` y `frontend-mobile/components/ui/EmptyState.tsx` con `accessibilityViewIsModal`, foco inicial y live regions.
- [X] T038 [US1] Actualizar `frontend-mobile/components/ui/GoogleSignInButton.tsx` y `frontend-mobile/components/ui/google-brand.ts` para mantener logo G oficial multicolor, texto traducido, estados disabled/loading y objetivo táctil de 48 dp.
- [X] T039 [US1] Actualizar `frontend-web/components/ui/index.ts` para exportar todos los componentes, variantes y tipos compartidos sin duplicar APIs.
- [X] T040 [US1] Actualizar `frontend-mobile/components/ui/index.ts` para exportar los equivalentes móviles con los mismos nombres y variantes.
- [X] T041 [US1] Aplicar foco visible de 2 px, orden lógico, `aria-describedby`/`aria-invalid`, `aria-busy` y `prefers-reduced-motion` en `frontend-web/components/ui/` y `frontend-web/app/globals.css`.
- [X] T042 [US1] Aplicar foco visible, `accessibilityRole`, `accessibilityState`, `accessibilityLiveRegion`, objetivos de 48 dp y `use-reduced-motion.ts` en `frontend-mobile/components/ui/` y `frontend-mobile/lib/use-reduced-motion.ts`.
- [X] T043 [P] [US1] Completar pruebas de componentes/feedback web en `frontend-web/__tests__/ui-components.test.tsx` y `frontend-web/__tests__/feedback.test.tsx`, incluyendo `jest-axe` sin violaciones críticas.
- [X] T044 [P] [US1] Completar pruebas de componentes/feedback móvil en `frontend-mobile/__tests__/ui-components.test.tsx` y `frontend-mobile/__tests__/feedback.test.tsx`, incluyendo roles, estados y nombres accesibles.
- [X] T045 [US1] Actualizar `scripts/check-ui.mjs` para fallar ante colores/tipografías/espaciados literales fuera de tokens o excepciones documentadas.

**Checkpoint**: US1 funcional y verificable de forma independiente.

---

## Phase 4: User Story 2 - Navegación adaptada al dispositivo (Priority: P1)

**Goal**: Shell y navegación responsive con sidebar/rail/tabs y guards de la spec 001.

**Independent Test**: Iniciar sesión y recorrer Inicio, Miembros, Perfil y Ajustes en 1440/840/839/600/599/320 px y en móvil.

### Tests for User Story 2

- [X] T046 [P] [US2] Crear pruebas de navegación web en `frontend-web/__tests__/navigation.test.tsx` para sidebar/rail/tabs, `aria-current`, guards y redirección de Inicio.
- [X] T047 [P] [US2] Crear pruebas de navegación móvil en `frontend-mobile/__tests__/navigation.test.tsx` para tabs Inicio/Miembros/Perfil, Ajustes desde Perfil y botón de vuelta.

### Implementation for User Story 2

- [X] T048 [US2] Implementar `frontend-web/components/navigation/AppShell.tsx`, `TopAppBar.tsx`, `Sidebar.tsx`, `NavigationRail.tsx` y `BottomNavigation.tsx` con topbar + sidebar `>=840px`, rail `600–839px` y tabs `<600px`.
- [X] T049 [US2] Actualizar `frontend-web/components/navigation/nav-items.ts` con Inicio, Miembros, Perfil y Ajustes, visibilidad por breakpoint, iconos Lucide y estado activo accesible.
- [X] T050 [US2] Actualizar `frontend-web/app/(app)/layout.tsx` para montar `AppShell`, `SessionProvider` y el guard de sesión sin duplicar refresh.
- [X] T051 [US2] Implementar `frontend-mobile/components/navigation/BottomTabs.tsx` y `ScreenHeader.tsx` con tabs Inicio/Miembros/Perfil, header propio y safe area.
- [X] T052 [US2] Actualizar `frontend-mobile/app/(app)/(tabs)/_layout.tsx` y `frontend-mobile/app/(app)/_layout.tsx` para tabs, stack de Ajustes/Perfil y botón de vuelta.
- [X] T053 [US2] Implementar la redirección de `frontend-web/app/(app)/page.tsx` y `frontend-mobile/app/(app)/(tabs)/index.tsx` a Miembros, y los guards login→perfil→grupo en layouts.
- [X] T054 [US2] Aplicar `SafeAreaView`/`useSafeAreaInsets`, `min-w-0`, `flexShrink` y ausencia de scroll horizontal en `frontend-web/components/navigation/` y `frontend-mobile/components/navigation/`.
- [X] T055 [US2] Actualizar `frontend-web/__tests__/navigation.test.tsx`, `frontend-mobile/__tests__/navigation.test.tsx` y `frontend-web/__tests__/useAuthGuard.test.tsx` con los breakpoints y redirecciones finales.

**Checkpoint**: US2 funcional y verificable de forma independiente.

---

## Phase 5: User Story 3 - Tema e idioma controlables (Priority: P2)

**Goal**: Ajustes con tema e idioma persistentes, sin flash y con errores traducidos.

**Independent Test**: Cambiar tema/idioma en Ajustes, recargar y comprobar persistencia, cambio en caliente y ausencia de cadenas sin traducir.

### Tests for User Story 3

- [X] T056 [P] [US3] Crear pruebas de tema web en `frontend-web/__tests__/theme.test.tsx` para Sistema/Claro/Oscuro, cookie, `localStorage`, `data-theme` y cambio de `matchMedia` en caliente.
- [X] T057 [P] [US3] Crear pruebas de tema móvil en `frontend-mobile/__tests__/theme.test.tsx` para SecureStore, `useColorScheme` y persistencia tras reapertura.
- [X] T058 [P] [US3] Crear pruebas de locale en `frontend-web/__tests__/locale.test.tsx` y `frontend-mobile/__tests__/locale.test.tsx` para español por defecto, cambio a inglés sin recargar y errores ya visibles traducidos.

### Implementation for User Story 3

- [X] T059 [US3] Implementar `frontend-web/app/(app)/settings/page.tsx` con tema, idioma, editar perfil, avatar, acerca de/versión/legal y logout con confirmación.
- [X] T060 [US3] Implementar `frontend-mobile/app/(app)/settings.tsx` con las mismas secciones y navegación de vuelta a Perfil.
- [X] T061 [US3] Implementar el script inline y la lectura de cookie en `frontend-web/app/layout.tsx` para aplicar `data-theme` antes del paint, con `suppressHydrationWarning`.
- [X] T062 [US3] Sincronizar cambios de tema del sistema en caliente en `frontend-web/components/providers/ThemeProvider.tsx` y `frontend-mobile/components/providers/ThemeProvider.tsx`.
- [X] T063 [US3] Sincronizar cambio de idioma en caliente en `frontend-web/components/providers/LocaleProvider.tsx` y `frontend-mobile/components/providers/LocaleProvider.tsx`, actualizando textos y errores visibles.
- [X] T064 [US3] Actualizar `scripts/check-shared.mjs` para validar paridad exacta de claves `es`/`en` y entre catálogos web/móvil.
- [X] T065 [US3] Actualizar `frontend-web/lib/format.ts` y `frontend-mobile/lib/format.ts` para usar la moneda del grupo y el locale activo en montos, números y fechas.
- [X] T066 [US3] Completar `frontend-web/__tests__/theme.test.tsx`, `frontend-web/__tests__/locale.test.tsx`, `frontend-mobile/__tests__/theme.test.tsx` y `frontend-mobile/__tests__/locale.test.tsx` con persistencia y errores i18n.

**Checkpoint**: US3 funcional y verificable de forma independiente.

---

## Phase 6: User Story 4 - Onboarding y gestión familiar con las nuevas vistas (Priority: P2)

**Goal**: Refactor de login, perfil, grupo, invitación y miembros; unión por código, moneda por
geolocalización, invitación solo con código y acciones Eliminar/Abandonar.

**Independent Test**: Ejecutar login→perfil→crear familia→miembros→generar invitación→unirse por
código→abandonar/eliminar, sin romper autenticación, perfil, grupo, invitación ni miembros.

### Tests for User Story 4

- [X] T067 [P] [US4] Crear pruebas de moneda web en `frontend-web/__tests__/currency.test.ts` para 5 sugerencias, local primero, geolocalización denegada, fallback locale/USD y búsqueda **Otros** ISO 4217.
- [X] T068 [P] [US4] Crear pruebas de moneda móvil en `frontend-mobile/__tests__/currency.test.ts` con los mismos casos y el mock de `expo-location`.
- [X] T069 [P] [US4] Crear pruebas de invitación web en `frontend-web/__tests__/invite-code.test.tsx` para código único, single-use, 7 días, sin URL, normalización y errores inválido/usado/expirado.
- [X] T070 [P] [US4] Crear pruebas de invitación móvil en `frontend-mobile/__tests__/invite-code.test.tsx` con los mismos casos.
- [X] T071 [P] [US4] Crear pruebas de acciones de familia web en `frontend-web/__tests__/family-actions.test.tsx` para Eliminar con 1 integrante, Abandonar con más de 1, confirmación, carga y redirección.
- [X] T072 [P] [US4] Crear pruebas de acciones de familia móvil en `frontend-mobile/__tests__/family-actions.test.tsx` con los mismos casos.

### Implementation for User Story 4

- [X] T073 [P] [US4] Implementar `frontend-web/lib/currency.ts` con catálogo ISO 4217, 5 sugerencias regionales, moneda local, búsqueda por código/nombre y fallback locale/USD.
- [X] T074 [P] [US4] Implementar `frontend-mobile/lib/currency.ts` con el mismo contrato y `Intl.DisplayNames` para nombres traducidos.
- [X] T075 [US4] Implementar `frontend-web/components/family/CurrencySelect.tsx` como selector único con 5 sugerencias, indicador de moneda local, **Otros** y estados loading/error/disabled.
- [X] T076 [US4] Implementar `frontend-mobile/components/family/CurrencySelect.tsx` con el mismo contrato y modal/lista accesible.
- [X] T077 [US4] Implementar `frontend-web/lib/geolocation.ts` con geolocalización opcional, timeout, país detectado y fallback al locale sin bloquear el alta.
- [X] T078 [US4] Implementar `frontend-mobile/lib/geolocation.ts` con `expo-location`, permiso opcional y fallback al locale.
- [X] T079 [US4] Actualizar `frontend-web/app/(onboarding)/family/create/page.tsx` para usar `CurrencySelect`, preseleccionar la moneda local y enviar `moneda_local` única.
- [X] T080 [US4] Actualizar `frontend-mobile/app/(onboarding)/family/create.tsx` para usar `CurrencySelect` y el mismo comportamiento.
- [X] T081 [US4] Actualizar `frontend-web/app/(auth)/auth/login/page.tsx` para integrar el botón oficial de Google, textos traducidos y errores accesibles.
- [X] T082 [US4] Actualizar `frontend-mobile/app/(auth)/auth/login.tsx` para integrar el botón oficial de Google, estados loading/disabled y errores accesibles.
- [X] T083 [US4] Actualizar `frontend-web/app/(onboarding)/profile/setup/page.tsx` con nombre, avatar por defecto, validación, carga, error y redirección.
- [X] T084 [US4] Actualizar `frontend-mobile/app/(onboarding)/profile/setup.tsx` con el mismo flujo y estados.
- [X] T085 [US4] Actualizar `frontend-web/app/(onboarding)/family/select/page.tsx` para rotular **Unirme mediante código**, navegar a `/invite` y eliminar cualquier opción de enlace.
- [X] T086 [US4] Actualizar `frontend-mobile/app/(onboarding)/family/select.tsx` con la misma opción y navegación.
- [X] T087 [US4] Actualizar `frontend-web/app/(onboarding)/invite/page.tsx` para unirse introduciendo código, normalizar mayúsculas/espacios, limpiar código pendiente y mapear errores inválido/usado/expirado inline.
- [X] T088 [US4] Actualizar `frontend-mobile/app/(onboarding)/invite/index.tsx` con el mismo flujo y sin leer `token` de la URL.
- [X] T089 [US4] Implementar `frontend-web/components/family/InviteCode.tsx` para mostrar solo el código agrupado, caducidad de 7 días, single-use, copiar y compartir texto sin URL.
- [X] T090 [US4] Implementar `frontend-mobile/components/family/InviteCode.tsx` con el mismo contrato y `Share.share` solo de texto.
- [X] T091 [US4] Actualizar `frontend-web/app/(app)/family/members/page.tsx` para generar invitación con `codigo`, mostrar `InviteCode`, caducidad y acciones de copiar/compartir, sin `link`.
- [X] T092 [US4] Actualizar `frontend-mobile/app/(app)/(tabs)/family/members.tsx` para el mismo comportamiento sin `link`.
- [X] T093 [US4] Implementar `frontend-web/components/family/FamilyActions.tsx` con Eliminar visible solo si `memberCount === 1`, Abandonar si `> 1`, `ConfirmDialog`, loading/error y redirección a `/family/select`.
- [X] T094 [US4] Implementar `frontend-mobile/components/family/FamilyActions.tsx` con el mismo contrato.
- [X] T095 [US4] Integrar `FamilyActions` y llamadas `deleteFamily`/`leaveFamily` en `frontend-web/app/(app)/family/members/page.tsx`, refrescando sesión tras completar.
- [X] T096 [US4] Integrar `FamilyActions` y llamadas `deleteFamily`/`leaveFamily` en `frontend-mobile/app/(app)/(tabs)/family/members.tsx`.
- [X] T097 [US4] Mostrar límite de 10 integrantes, rol familiar, rol de permiso y estado en `frontend-web/app/(app)/family/members/page.tsx`.
- [X] T098 [US4] Mostrar límite de 10 integrantes, rol familiar, rol de permiso y estado en `frontend-mobile/app/(app)/(tabs)/family/members.tsx`.

**Checkpoint**: US4 funcional y verificable de forma independiente.

---

## Phase 7: User Story 5 - Feedback claro en todas las acciones (Priority: P3)

**Goal**: Spinners, banners inline, estados vacíos y confirmaciones consistentes, sin toasts ni skeletons.

**Independent Test**: Forzar cargas lentas, errores de backend y listas vacías en web y móvil.

### Tests for User Story 5

- [X] T099 [P] [US5] Actualizar `frontend-web/__tests__/feedback.test.tsx` para loading, error inline, éxito, vacío, confirmación y `role="alert"`/`status`.
- [X] T100 [P] [US5] Actualizar `frontend-mobile/__tests__/feedback.test.tsx` para loading, error inline, éxito, vacío, confirmación y live regions.

### Implementation for User Story 5

- [X] T101 [US5] Integrar `Loading`, `Spinner`, `InlineBanner`, `EmptyState` y `ConfirmDialog` en las pantallas web de `frontend-web/app/(auth)`, `frontend-web/app/(onboarding)` y `frontend-web/app/(app)`.
- [X] T102 [US5] Integrar los equivalentes de feedback en las pantallas móvil de `frontend-mobile/app/(auth)`, `frontend-mobile/app/(onboarding)` y `frontend-mobile/app/(app)`.
- [X] T103 [US5] Actualizar `frontend-web/lib/errors.ts` y `frontend-mobile/lib/errors.ts` para que todos los errores conocidos usen claves i18n y los desconocidos usen fallback sin romper la UI.
- [X] T104 [US5] Verificar en `frontend-web/__tests__/feedback.test.tsx` y `frontend-mobile/__tests__/feedback.test.tsx` que no se usan `window.confirm`, `Alert.alert`, toasts ni skeletons.
- [X] T105 [US5] Añadir estados vacíos con acción sugerida en listas de miembros/invitaciones y estados de carga/error en `frontend-web/app/(auth)`, `frontend-web/app/(onboarding)`, `frontend-web/app/(app)`, `frontend-mobile/app/(auth)`, `frontend-mobile/app/(onboarding)` y `frontend-mobile/app/(app)`.

**Checkpoint**: US5 funcional y verificable de forma independiente.

---

## Phase 8: User Story 6 - Editor de avatar con vista previa (Priority: P3)

**Goal**: Avatar por defecto generado y editor con vista previa sin persistencia.

**Independent Test**: Abrir el editor desde Perfil, modificar base/fondo/cabello/ropa/ojos/accesorios y comprobar vista previa, aviso de guardado y `foto_avatar` intacto.

### Tests for User Story 6

- [X] T106 [P] [US6] Actualizar `frontend-web/__tests__/avatar.test.ts` y `frontend-web/__tests__/avatar-editor.test.tsx` para determinismo, `foto_avatar` `<=2048`, vista previa `<100 ms` y aviso de spec 003.
- [X] T107 [P] [US6] Actualizar `frontend-mobile/__tests__/avatar.test.ts` y `frontend-mobile/__tests__/avatar-editor.test.tsx` con los mismos casos.

### Implementation for User Story 6

- [X] T108 [US6] Ajustar `shared/avatar/avatar-engine.ts` y `shared/avatar/avatar-options.json` para generar un SVG compacto determinista con base, fondo, cabello, ropa, ojos y accesorios, y validar longitud `<=2048`.
- [X] T109 [US6] Integrar avatar por defecto generado en `frontend-web/app/(onboarding)/profile/setup/page.tsx` y `frontend-web/app/(app)/profile/page.tsx`.
- [X] T110 [US6] Integrar avatar por defecto generado en `frontend-mobile/app/(onboarding)/profile/setup.tsx` y `frontend-mobile/app/(app)/(tabs)/profile.tsx`.
- [X] T111 [US6] Implementar `frontend-web/components/ui/AvatarEditor.tsx` y `frontend-web/app/(app)/profile/avatar/page.tsx` con vista previa, controles y aviso de guardado en 003.
- [X] T112 [US6] Implementar `frontend-mobile/components/ui/AvatarEditor.tsx` y `frontend-mobile/app/(app)/profile/avatar.tsx` con el mismo contrato y navegación de vuelta.
- [X] T113 [US6] Actualizar `frontend-web/app/(app)/profile/edit/page.tsx` y `frontend-web/app/(app)/profile/page.tsx` para enlazar edición de perfil y avatar.
- [X] T114 [US6] Actualizar `frontend-mobile/app/(app)/profile/edit.tsx` y `frontend-mobile/app/(app)/(tabs)/profile.tsx` para enlazar edición de perfil y avatar.

**Checkpoint**: US6 funcional y verificable de forma independiente.

---

## Phase 9: User Story 7 - Base de visualización de datos para el futuro (Priority: P4)

**Goal**: Contenedores de gráficos diferidos que no entren en el bundle inicial.

**Independent Test**: Verificar que las rutas actuales no cargan Recharts/Victory Native y que los contenedores consumen tokens.

### Tests for User Story 7

- [X] T115 [P] [US7] Actualizar `frontend-web/__tests__/charts.test.ts` para carga diferida, ausencia de imports en rutas y resumen accesible.
- [X] T116 [P] [US7] Actualizar `frontend-mobile/__tests__/charts.test.ts` para Victory Native encapsulado, tokens de tema y ausencia de imports en rutas.

### Implementation for User Story 7

- [X] T117 [US7] Actualizar `frontend-web/components/charts/ChartContainer.tsx` y `frontend-web/components/charts/ChartCanvas.tsx` con Recharts 3, `next/dynamic` y `ssr:false`.
- [X] T118 [US7] Actualizar `frontend-mobile/components/charts/ChartContainer.tsx` con Victory Native 42.0.1, Skia 2.14.0 y resumen textual accesible.
- [X] T119 [US7] Conectar colores de gráficos a `design-tokens/tokens.json` y `lib/generated/tokens.ts` en ambos frontends, sin valores literales.
- [X] T120 [US7] Actualizar `scripts/check-ui.mjs` para impedir imports de `recharts`/`victory-native` fuera de `frontend-web/components/charts/` y `frontend-mobile/components/charts/`.
- [X] T121 [US7] Verificar build web y `expo-doctor` móvil para confirmar que las librerías de gráficos no están en el bundle inicial de rutas actuales.

**Checkpoint**: US7 funcional y verificable de forma independiente.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cierre, documentación y validación end-to-end.

- [X] T122 [P] Actualizar `README.md` y `specs/002-ui-styles-and-views/quickstart.md` con dependencias, comandos, escenarios 15–18 y nota de extensiones de spec 001.
- [X] T123 Ejecutar `node scripts/generate-shared.mjs` y `node scripts/generate-shared.mjs --check`; corregir cualquier deriva en `design-tokens/`, `shared/` y artefactos generados.
- [X] T124 Ejecutar `node scripts/check-shared.mjs` y `node scripts/check-ui.mjs`; corregir paridad i18n, literales visuales e imports de gráficos.
- [X] T125 Ejecutar en `frontend-web`: `pnpm run typecheck`, `pnpm run lint` y `pnpm test`; corregir fallos de componentes, navegación, tema, locale, avatar, feedback, código, moneda y acciones de familia.
- [X] T126 Ejecutar `pnpm run build` en `frontend-web` y verificar que Recharts no entra en el bundle inicial de rutas actuales.
- [X] T127 Ejecutar en `frontend-mobile`: `pnpm run typecheck`, `pnpm run lint` y `pnpm test`; corregir los mismos fallos que web.
- [X] T128 Ejecutar `npx expo-doctor` en `frontend-mobile` y resolver incompatibilidades de Expo SDK 58, Skia, Reanimated, Victory Native y `expo-location`.
- [ ] T129 Ejecutar manualmente los escenarios 1–14 de `specs/002-ui-styles-and-views/quickstart.md` en web y móvil.
- [ ] T130 Ejecutar manualmente los escenarios 15–18 de `specs/002-ui-styles-and-views/quickstart.md`: botón Google, invitación por código, moneda regional y Eliminar/Abandonar familia.
- [ ] T131 Ejecutar auditoría Lighthouse de accesibilidad `>=95` en Login, Miembros y Ajustes, y revisar foco/teclado, zoom 200 %, 320 px, movimiento reducido y VoiceOver/TalkBack.
- [X] T132 Corregir incidencias encontradas en T123–T131 en `frontend-web/`, `frontend-mobile/`, `shared/`, `scripts/` y `design-tokens/`, y repetir las puertas de calidad afectadas.
- [X] T133 Actualizar el estado final de `specs/002-ui-styles-and-views/tasks.md` y registrar la validación en `specs/002-ui-styles-and-views/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; puede empezar de inmediato.
- **Foundational (Phase 2)**: Depende de Setup y bloquea todas las historias.
- **User Stories (Phase 3–9)**: Dependen de Foundational; pueden ejecutarse en paralelo si hay equipo.
- **Polish (Phase 10)**: Depende de las historias deseadas.

### User Story Dependencies

- **US1 (P1)**: Base visual; puede empezar tras Foundational.
- **US2 (P1)**: Depende de US1 para shell/componentes, pero se valida de forma independiente.
- **US3 (P2)**: Depende de US1 y de los providers de Foundational.
- **US4 (P2)**: Depende de US1, US2 y de los contratos de API de Foundational; consume endpoints de spec 001.
- **US5 (P3)**: Depende de US1 (feedback) y se integra en US2/US4.
- **US6 (P3)**: Depende de US1 (Avatar) y de los enlaces de Perfil de US2.
- **US7 (P4)**: Solo depende de Foundational (tokens) y es independiente de las demás historias.

### Within Each User Story

- Pruebas primero, deben fallar antes de implementar.
- Componentes/utilidades antes de pantallas.
- Pantallas antes de integración y pruebas end-to-end.
- Validar la historia antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- T003–T007 de Setup pueden ejecutarse en paralelo.
- T008–T027 de Foundational pueden paralelizarse por archivo (tokens, i18n, API web, API móvil).
- US1 y US2 pueden trabajar en paralelo con dos desarrolladores tras Foundational.
- US3, US4, US5, US6 y US7 pueden paralelizarse por plataforma o por historia una vez que US1/US2 estén estables.
- Las tareas web y móvil de una misma historia pueden ejecutarse en paralelo si no comparten archivos.

---

## Parallel Example: User Story 1

```bash
Task: "Refactorizar botones y campos web en frontend-web/components/ui/*.tsx"
Task: "Refactorizar formularios móvil en frontend-mobile/components/ui/*.tsx"
Task: "Crear pruebas de tokens y derivación en frontend-web/__tests__/design-tokens.test.ts"
Task: "Crear pruebas equivalentes de tokens en frontend-mobile/__tests__/design-tokens.test.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Implementar frontend-web/lib/currency.ts"
Task: "Implementar frontend-mobile/lib/currency.ts"
Task: "Implementar frontend-web/components/family/CurrencySelect.tsx"
Task: "Implementar frontend-mobile/components/family/CurrencySelect.tsx"
Task: "Actualizar frontend-web/app/(onboarding)/invite/page.tsx"
Task: "Actualizar frontend-mobile/app/(onboarding)/invite/index.tsx"
```

## Parallel Example: User Story 7

```bash
Task: "Actualizar frontend-web/components/charts/ChartContainer.tsx"
Task: "Actualizar frontend-mobile/components/charts/ChartContainer.tsx"
Task: "Actualizar scripts/check-ui.mjs"
```

---

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Completar US1 y US2 (P1): sistema visual y navegación.
3. Validar US1/US2 de forma independiente y desplegar una base visual navegable.

### Incremental Delivery

1. Setup + Foundational.
2. US1 + US2 → validar → demo de base visual/navegación.
3. US3 → tema/idioma persistentes → validar.
4. US4 → onboarding/familia/código/moneda/acciones → validar.
5. US5 + US6 → feedback y avatar → validar.
6. US7 → base de gráficos → validar.
7. Polish → puertas de calidad y quickstart completo.

### Parallel Team Strategy

1. Equipo completo termina Setup + Foundational.
2. Developer A: US1; Developer B: US2.
3. Tras estabilizar US1/US2:
   - Developer A: US3.
   - Developer B: US4 web.
   - Developer C: US4 móvil.
   - Developer D: US5/US6.
4. US7 puede hacerse en paralelo desde el inicio de las historias.

---

## Notes

- [P] significa archivos distintos y sin dependencia directa.
- Cada historia se puede validar de forma independiente en web y móvil.
- Las pruebas deben fallar antes de implementar cuando se incluyan.
- No se modifican `backend/`, `docker-compose.yml` ni PostgreSQL; las extensiones de spec 001 son
  prerequisito funcional.
- Evitar tareas vagas, conflictos de archivo y dependencias cruzadas que rompan la independencia.

---

## Phase 11: Convergence

- [X] T134 Implementar las extensiones de la spec 001 que consume esta feature (código de invitación de un solo uso con caducidad de 7 días, soft delete y abandono de familia, y reasignación de administrador) en `backend/app/services/invitation_service.py`, `backend/app/services/family_service.py`, `backend/app/api/v1/invitations.py`, `backend/app/api/v1/families.py` y esquemas/migraciones asociadas, dejando de exponer `token`/`link` per `spec 001 FR-006` y `spec 001 FR-014–FR-018` (missing).
- [X] T135 Asociar los errores de código inválido, usado y expirado al campo de código con estado inválido y descripción accesible, y mapearlos inline en `frontend-web/app/(onboarding)/invite/page.tsx` y `frontend-mobile/app/(onboarding)/invite/index.tsx` per `FR-078` (partial).
- [X] T136 Mostrar en las pantallas de unión por código de `frontend-web/app/(onboarding)/invite/page.tsx` y `frontend-mobile/app/(onboarding)/invite/index.tsx` que el código es de un solo uso y caduca a los 7 días per `FR-083` (partial).
- [ ] T137 Ejecutar la auditoría de accesibilidad (Lighthouse `>=95`, teclado, zoom 200 %, movimiento reducido y VoiceOver/TalkBack) y registrar los resultados en `specs/002-ui-styles-and-views/quickstart.md` per `T131`, `SC-002` y `SC-003` (missing).
- [ ] T138 Ejecutar y registrar los escenarios manuales 1–18 de `specs/002-ui-styles-and-views/quickstart.md` en web y móvil per `T129` y `T130` (missing).

---

## Phase 12: Convergence

- [X] T139 Configurar `frontend-web/components/ui/GoogleSignInButton.tsx` con los props oficiales de Google Identity Services (`text="continue_with"`, `shape="pill"`, `size="large"` y `locale` derivado del idioma activo) y añadir `locale` a `GoogleOAuthProvider` en `frontend-web/components/providers/AppProviders.tsx`, evitando además el desbordamiento horizontal en 320 px por `width` fijo, per `FR-046`/`SC-015`/`T034` (partial).
- [ ] T140 Ejecutar la auditoría de accesibilidad (Lighthouse `>=95` en Login, Miembros y Ajustes; recorrido con teclado, zoom de texto al 200 %, movimiento reducido y VoiceOver/TalkBack) y corregir en `frontend-web/` y `frontend-mobile/` las incidencias halladas, registrando los resultados en `specs/002-ui-styles-and-views/quickstart.md`, per `SC-002`/`SC-003`/`T131`/`T137` (missing).
- [ ] T141 Ejecutar y registrar los escenarios manuales 1–18 de `specs/002-ui-styles-and-views/quickstart.md` en web y móvil (breakpoints 320/600/840/1440 px, paridad visual web/móvil y flujos de onboarding/familia), corrigiendo cualquier desviación, per `SC-006`/`SC-007`/`T129`/`T130`/`T138` (missing).
- [X] T142 Eliminar `// @ts-nocheck` de `frontend-mobile/components/charts/ChartContainer.tsx` y tipar correctamente la integración con Victory Native/Skia para que `pnpm run typecheck` la valide, per `FR-066`/`FR-058`/`T118` (contradicts).
- [X] T143 Ajustar `scripts/check-ui.mjs` para que la verificación de colores literales cubra `frontend-web/components/charts/` y `frontend-mobile/components/charts/`, o documentar explícitamente la excepción de `components/charts/`, per `FR-008`/`T045`/`T120` (partial).
- [X] T144 Trasladar a los catálogos i18n las descripciones de metadatos y `BRAND_DESCRIPTION` de `frontend-web/app/layout.tsx`, `frontend-web/lib/branding.ts` y `frontend-mobile/app.json`, evitando cadenas visibles hardcodeadas, per `FR-030` (partial).

---

## Phase 13: Migración de autenticación Google móvil a `react-native-nitro-google-signin`

**Goal**: Sustituir `@react-native-google-signin/google-signin` por `react-native-nitro-google-signin` en el frontend móvil, sin cambios funcionales en el flujo de login.

**Independent Test**: `frontend-mobile` compila con `npx expo-doctor` y un development build nativo, y el login obtiene un `idToken` (o cancelación) a través de la nueva librería; `typecheck`, `lint` y `test` en verde.

- [X] T145 [P] Actualizar `frontend-mobile/package.json` y regenerar `frontend-mobile/pnpm-lock.yaml`: eliminar `@react-native-google-signin/google-signin` y añadir `react-native-nitro-google-signin` (~2.3.x) y su peer `react-native-nitro-modules` (>=0.36.0) mediante `npx expo install`, per `FR-068`/plan: decisión botón Google (partial).
- [X] T146 Actualizar `frontend-mobile/app.json`: sustituir el plugin `@react-native-google-signin/google-signin` por `react-native-nitro-google-signin`, configurar el `webClientId`/`google-services.json` de Android y el `REVERSED_CLIENT_ID`/`urlScheme` de iOS, conservando `name`/`slug`/`userInterfaceStyle`, per plan: decisión botón Google (partial).
- [X] T147 Habilitar la React Native New Architecture en `frontend-mobile/app.json` (`newArchEnabled: true`) y la configuración nativa asociada, requisito de `react-native-nitro-modules`, per plan: restricción Nitro (missing).
- [X] T148 Reescribir `frontend-mobile/lib/google-signin.ts` contra la API `GoogleOneTapSignIn` (`configure({ webClientId })`, `checkPlayServices()` en Android, `signIn()`, `isSuccessResponse(response)` → `response.data.idToken`), conservando el export `requestGoogleIdToken`, per `FR-046`/plan: decisión botón Google (contradicts).
- [X] T149 [P] Actualizar el mock de Google en `frontend-mobile/jest.setup.js` de `@react-native-google-signin/google-signin` a `react-native-nitro-google-signin` (`GoogleOneTapSignIn` con `configure`/`checkPlayServices`/`signIn`, más `isSuccessResponse` e `isNoSavedCredentialFoundResponse`), per `T007` (partial).
- [X] T150 Verificar que `frontend-mobile/app/(auth)/auth/login.tsx` y `frontend-mobile/components/ui/GoogleSignInButton.tsx` siguen integrando el login nativo con nombre accesible "Continuar con Google", estados loading/disabled y objetivo táctil de 48 dp, per `FR-046`/`T038`/`T082` (partial).
- [ ] T151 Ejecutar en `frontend-mobile` `npx expo-doctor`, `pnpm run typecheck`, `pnpm run lint`, `pnpm test` y un development build nativo (no Expo Go) para confirmar que el módulo Nitro resuelve, y actualizar `specs/002-ui-styles-and-views/quickstart.md` con los pasos resultantes, per `FR-066`/plan: riesgo Nitro/Expo Go (missing).

---

## Phase 14: Convergence

- [X] T152 Ajustar `frontend-mobile/components/providers/LocaleProvider.tsx` para que el idioma inicial sea español cuando no exista preferencia guardada, usando `expo-localization` solo para región/formato, y añadir en `frontend-mobile/__tests__/locale.test.tsx` una prueba con dispositivo en inglés que verifique que la UI sigue en español per `FR-028`/contracts/i18n-contracts.md (`contradicts`).
- [X] T153 Encaminar las traducciones de `frontend-web/components/providers/LocaleProvider.tsx` a través de `next-intl` (`createTranslator`/`useTranslations`) conservando la API `useI18n` y actualizando `frontend-web/__tests__/locale.test.tsx` para cubrir la integración real per `FR-029` (`partial`).
- [X] T154 Hacer que `frontend-web/app/layout.tsx` y el provider de locale generen y actualicen título y metadatos según el idioma activo con los títulos aprobados (**Kitho: Tareas y Finanzas Familiares** para `es`, **Kitho Family** para `en`), y alinear `shared/i18n/en.json` `app.webTitle` para no introducir variantes traducidas no aprobadas per `FR-030`/`FR-031`/`FR-034`/`SC-005`/`SC-014` (`partial`).
- [X] T155 Localizar el texto de permiso de ubicación de `frontend-mobile/app.json` para `es`/`en` mediante la configuración `locales` de Expo, evitando cadenas visibles hardcodeadas per `FR-030` (`partial`).
- [X] T156 Completar `frontend-mobile/components/charts/ChartContainer.tsx` y `frontend-web/components/charts/ChartCanvas.tsx` para respetar el `type` declarado (`line`/`bar`/`pie`/`area`) o reducir la API a los tipos realmente soportados, y aplicar tokens del tema a ejes, grid y tooltip per `FR-058`/`US7/AC2` (`partial`).
- [X] T157 Sustituir los estilos inline de `frontend-web/components/ui/Avatar.tsx` y `frontend-web/components/charts/ChartContainer.tsx` por clases o variables CSS basadas en tokens, o documentar explícitamente la excepción per `FR-065` (`partial`).

---

## Phase 15: Convergence

- [X] T158 Derivar el locale/región del dispositivo por separado del idioma de UI (`expo-localization` en móvil y `navigator.language` en web) y usarlo en `detectCountry`/`createCurrencySelection` y en `format.ts` para el fallback de moneda y formato, manteniendo español por defecto, con pruebas de dispositivo en inglés/región US mientras la UI sigue en español per `FR-029`/`FR-073`/plan: geolocalización opcional/`T021`/`T077`/`T078` (`partial`).
