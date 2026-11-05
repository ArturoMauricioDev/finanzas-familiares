# Implementation Plan: UI, Estilos y Vistas Web y Móvil (Kitho)

**Branch**: `002-ui-styles-and-views` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ui-styles-and-views/spec.md`

## Summary

Refactorizar toda la interfaz de Kitho en web y móvil sobre un sistema de diseño Material Design 3
compartido, derivado del color semilla `#6750A4`, con tokens únicos generados desde
`design-tokens/tokens.json`, tipografía Inter, iconos Lucide y componentes propios por plataforma.
La entrega incluye:

1. **Fundación visual**: tokens MD3 (color claro/oscuro, tipografía, espaciado, radios, elevación,
   movimiento y breakpoints), generador que emite CSS y TypeScript para web y TypeScript para
   móvil, y una comprobación de deriva en las puertas de calidad.
2. **Navegación adaptativa**: topbar + sidebar en web expandida, rail en web media, tabs inferiores
   en web compacta y móvil; Inicio redirige a Miembros; Ajustes vive en la navegación web y se
   alcanza desde Perfil en móvil.
3. **Tema e idioma**: preferencia Sistema/Claro/Oscuro persistida y aplicada sin parpadeo; español
   por defecto e inglés, con `next-intl` en web y `expo-localization`/`i18n-js` en móvil.
4. **Pantallas y estados**: refactor de login, perfil, grupo, invitación y miembros; nuevas vistas
   Inicio, Perfil, Ajustes, edición de perfil y editor de avatar con vista previa.
5. **Calidad**: WCAG 2.1 AA, foco visible, navegación por teclado, regiones live, movimiento
   reducido, objetivos táctiles de 48 dp, sin scroll horizontal desde 320 px, y pruebas de flujo,
   componentes, accesibilidad, tokens e i18n.
6. **Base de gráficos**: Recharts en web y Victory Native en móvil encapsulados en contenedores
   diferidos, sin incluirse en el bundle inicial de ninguna ruta actual.

No se modifican backend, API ni base de datos. El avatar por defecto se genera como SVG compacto y
se envía por el campo existente `foto_avatar`; la personalización del editor solo se previsualiza y
su persistencia queda para la spec 003.

## Technical Context

**Language/Version**: TypeScript 5.x. Web: Next.js 15.0.3 con React 19.0.0 RC y React DOM 19.0.0
RC. Móvil: Expo 52.0.11, React Native 0.76.3 y React 18.3.1.

**Primary Dependencies**:

- Web: `next-intl` 4.14.x, `tailwindcss` 4.3.x, `@tailwindcss/postcss` 4.3.x, `lucide-react`
  1.68.x, `recharts` 3.10.x, `react-is` 19.x, `jest-axe` 11.x.
- Móvil: `expo-localization` ~16.0.1, `i18n-js` 4.5.x, `expo-font` ~13.0.4,
  `@expo-google-fonts/inter` 0.4.x, `expo-splash-screen` ~0.29.24, `expo-status-bar` ~2.0.1,
  `expo-system-ui` ~4.0.9,
  `lucide-react-native` 1.68.x, `react-native-svg` 15.8.0, `victory-native` 41.16.1,
  `@shopify/react-native-skia` 1.5.0, `react-native-reanimated` ~3.16.1,
  `react-native-gesture-handler` ~2.20.2 y `react-native-safe-area-context` 4.12.0.
- Pruebas: Jest 29, Testing Library web 16.x, React Native Testing Library 12.7.2 (la 14.x exige
  RN 0.78+ y no aplica a Expo 52), `jest-axe` y `@types/jest-axe`.

**Storage**: Sin cambios de backend ni PostgreSQL. En web, preferencias en `localStorage` y cookies
`kitho_theme`/`kitho_locale` para render inicial; en móvil, `expo-secure-store` para preferencias y
sesión existente. Los catálogos i18n y tokens son archivos versionados.

**Testing**: Jest + Testing Library en web, con `jest-axe` para accesibilidad; Jest + React Native
Testing Library en móvil; scripts Node para verificar deriva de tokens, imports de gráficos y
literales visuales; pruebas de paridad de claves i18n.

**Target Platform**: Web: últimas 2 versiones de Chrome, Firefox, Safari y Edge, con viewports
compacto `<600px`, medio `600–839px` y expandido `>=840px`. Móvil: iOS 15+ y Android 10+ mediante
Expo 52.

**Project Type**: Aplicación web + aplicación móvil + API existente (multi-proyecto). Esta feature
solo toca los dos frontends y artefactos compartidos de presentación.

**Performance Goals**: cambio de tema y de idioma inmediato; vista previa del avatar `<100 ms` por
interacción; onboarding completo `<3 min`; sin scroll horizontal en 320, 600, 840 y 1440 px;
Recharts y Victory Native fuera del bundle inicial de las rutas actuales.

**Constraints**:

- Stack obligatorio sin cambios: Next.js/TypeScript y React Native/Expo/TypeScript.
- No se permite modificar backend, API ni base de datos.
- `foto_avatar` tiene `max_length=2048`: el SVG de avatar por defecto debe ser compacto y validarse
  antes de enviarse.
- Victory Native 43 exige React 19 y RN 0.79+, incompatible con Expo 52/RN 0.76.3/React 18.3.1;
  se fija la línea 41.16.1 con las versiones nativas que Expo 52 incluye.
- No se usan shadcn/ui ni kits de UI externos.
- WCAG 2.1 AA, objetivos táctiles de 48x48 dp, foco visible y `prefers-reduced-motion`.
- La marca canónica es **Kitho**; los títulos de ficha son **Kitho: Tareas y Finanzas Familiares**
  (España/Latam) y **Kitho Family** (EE.UU./Global).

**Scale/Scope**: 71 requisitos funcionales, 14 criterios de éxito, 7 historias de usuario, 6
pantallas existentes refactorizadas y 5 vistas nuevas por plataforma (Inicio, Perfil, Ajustes,
edición de perfil y editor de avatar). Aproximadamente 30 componentes base compartidos por nombre.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Revisión previa al diseño (Principios I–VI y marca):**

- [x] **I. Naturaleza y Alcance**: la feature se limita a UI, navegación, tema, idioma y vistas
  descritas en `spec.md`; no incorpora funciones financieras ni cambios de dominio.
- [x] **II. Stack Tecnológico**: se mantienen Next.js, React Native/Expo, FastAPI, PostgreSQL,
  SQLAlchemy y Docker. Las nuevas dependencias son de presentación y compatibles con el stack.
- [x] **III. Reglas de Dominio**: no se alteran roles, moneda, precisión `DECIMAL`, ciclos
  presupuestarios ni inmutabilidad; el formateo usa la moneda del grupo.
- [x] **IV. No-Objetivos**: sin Open Banking, scraping, captura de SMS/correo, pasarelas de pago ni
  exportación PDF.
- [x] **V. Estructura y Errores**: se conserva la separación `backend/`, `frontend-web/` y
  `frontend-mobile/`; los errores del backend se mapean a claves i18n con fallback, sin duplicar
  autoridad de validación.
- [x] **VI. Comportamiento SDD**: cada decisión y componente traza a un FR, SC, caso límite o
  principio constitucional; no se añade código sombra.
- [x] **Identidad de Marca**: se usa **Kitho** en UI y metadatos; los títulos de tienda coinciden
  con la constitución; no se traduce ni adapta el nombre.

**Gate result**: PASS — sin violaciones que justificar.

## Key Design Decisions

| Área | Decisión | Motivo |
|------|----------|--------|
| Tokens | `design-tokens/tokens.json` en la raíz como fuente única; `scripts/generate-shared.mjs` genera `design-tokens.generated.ts` en ambos frontends y `tokens.generated.css` en web | Cumple FR-001/FR-002 y evita divergencia entre plataformas; el script `--check` detecta deriva |
| Paleta | Roles semánticos MD3 completos (primary, surface, outline, error, success, warning, etc.) para claro y oscuro, derivados de `#6750A4` | Cumple FR-003; permite tema conmutables por variables sin recalcular componentes |
| Tipografía | Inter con escala MD3 (display/headline/title/body/label) y pesos 400/500/600/700; web con `next/font/google` y variable `--font-inter`, móvil con `@expo-google-fonts/inter`; fallback a fuente del sistema | Cumple FR-004 y el caso límite de fallback de fuente |
| Iconos | Lucide en ambas plataformas, tamaños 16/20/24/32/40/48 y color heredado del texto | Cumple FR-005 y mantiene consistencia visual |
| Web CSS | Tailwind CSS 4 con `@theme inline` sobre variables CSS generadas; breakpoints MD3 `medium=600px` y `expanded=840px` | Cumple FR-006/FR-022; mobile-first y sin shadcn/ui |
| Componentes web | Componentes MD3 propios sobre HTML semántico, `<dialog>` nativo para diálogos y `<select>` nativo para ajustes | Accesibilidad sin añadir Radix/shadcn; menos dependencias |
| Componentes móviles | `StyleSheet` + tokens, con `createStyles(theme)` memoizado por componente | Cumple FR-007; sin kit de UI externo |
| Navegación web | Shell CSS responsive: sidebar expandida `>=840px`, rail `600–839px`, topbar siempre y tabs inferiores `<600px` | Cumple FR-016/FR-018/FR-022 con una sola estructura y sin JS de layout |
| Navegación móvil | Expo Router con grupos `(auth)`, `(onboarding)` y `(app)`; dentro de `(app)`, tabs `Inicio`, `Miembros`, `Perfil` y stack para Ajustes/Perfil | Cumple FR-017/FR-018 y conserva URLs existentes |
| Rutas | Se mantienen las URLs actuales y se añaden `/settings`, `/profile`, `/profile/edit`, `/profile/avatar`; `/` redirige a `/family/members` | Cumple FR-019/FR-020 y minimiza rupturas con la spec 001 |
| Sesión | Se conservan las claves de sesión actuales; las preferencias usan claves nuevas `kitho_*` y no se borran al cerrar sesión | Evita migraciones y cumple FR-025/FR-031 y el caso de sesión expirada |
| Tema web | `data-theme` en `<html>`, cookies + `localStorage` y script inline previo al paint; `ThemeProvider` escucha `matchMedia` en modo Sistema | Cumple FR-024/FR-026/FR-027 sin flash de tema incorrecto |
| Tema móvil | `useColorScheme` + override persistido en SecureStore; `userInterfaceStyle: automatic`; splash retenido hasta hidratar preferencias | Cumple FR-024/FR-025/FR-027 y evita parpadeo inicial |
| i18n web | `next-intl` 4 con `NextIntlClientProvider` en un provider cliente; catálogos estáticos `es`/`en`; cookie `kitho_locale` para el `lang` inicial; sin rutas `[locale]` | Cumple FR-028/FR-029/FR-031 sin cambiar URLs ni añadir middleware de routing |
| i18n móvil | `expo-localization` para región/formato e `i18n-js` para catálogos; español por defecto y preferencia en SecureStore | Cumple FR-028/FR-029/FR-031/FR-032 |
| Errores | `ApiError` transporta `status`, `messageKey` y `fallbackDetail`; la UI traduce en render con `t()` y usa el detalle del backend como fallback | Cumple FR-033 y permite que un cambio de idioma actualice errores ya visibles |
| Formato | Utilidades `formatCurrency`/`formatDate`/`formatNumber` con `Intl` y la moneda del grupo | Cumple FR-032 y respeta la moneda única del grupo |
| Avatar | Motor SVG puro compartido (`shared/avatar/avatar-engine.ts`) que genera un SVG compacto y un data URI; web usa `<img>`/SVG y móvil `SvgXml` de `react-native-svg` | Cumple FR-049/FR-050/FR-051 sin assets externos ni cambios de backend |
| Avatar por defecto | Configuración determinista derivada de `user.id`/`email`; se envía por `foto_avatar` con validación de longitud `<=2048` | Cumple FR-049 y el límite del esquema existente |
| Editor de avatar | Estado local, vista previa en tiempo real y aviso explícito de que el guardado llega en 003; no persiste ni sube archivos | Cumple FR-052/FR-053 y el alcance de la spec 002 |
| Gráficos web | Recharts 3 cargado solo mediante `components/charts/ChartContainer.tsx` (client component) con `next/dynamic` y `ssr:false`; ninguna ruta actual lo importa | Cumple FR-058/FR-059/FR-060 y SC-011 |
| Gráficos móvil | Victory Native 41.16.1 + Skia 1.5.0 + Reanimated 3.16.1 + Gesture Handler 2.20.2, encapsulado en `components/charts/ChartContainer.tsx`; ninguna ruta actual lo importa | Cumple FR-058/FR-059/FR-060 con versiones compatibles con Expo 52; Victory Native 43 queda descartado |
| Calidad | Scripts de verificación de tokens, imports de gráficos y literales visuales; `jest-axe` en web; pruebas de paridad de catálogos | Cumple FR-066 y SC-001/SC-002/SC-011 |
| Marca | `lib/branding.ts` en cada frontend con nombre y títulos de tienda; wordmark provisional sin assets definitivos | Cumple FR-034/FR-061/FR-062/FR-063 y la sección de marca de la constitución |

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-styles-and-views/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── token-contract.md
│   ├── ui-contracts.md
│   ├── navigation-contracts.md
│   └── i18n-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
design-tokens/
└── tokens.json                    # Fuente única de tokens MD3

shared/
├── avatar/
│   ├── avatar-engine.ts           # Generador SVG puro y configuración por defecto
│   └── avatar-options.json        # Catálogo de bases, fondos, cabello, ropa, ojos, accesorios
└── errors/
    └── error-keys.json            # Detalle/status del backend -> clave i18n

scripts/
├── generate-shared.mjs            # Genera tokens CSS/TS, avatar y mapa de errores
├── check-shared.mjs               # Verifica deriva y paridad de catálogos
└── check-ui.mjs                   # Verifica imports de gráficos y literales visuales

frontend-web/
├── app/
│   ├── layout.tsx                 # Server layout: metadata, lang, data-theme, providers
│   ├── globals.css
│   ├── (auth)/auth/login/page.tsx
│   ├── (onboarding)/
│   │   ├── profile/setup/page.tsx
│   │   ├── family/select/page.tsx
│   │   ├── family/create/page.tsx
│   │   └── invite/page.tsx
│   └── (app)/
│       ├── layout.tsx             # Guard de sesión + AppShell
│       ├── page.tsx               # Inicio -> /family/members
│       ├── family/members/page.tsx
│       ├── profile/page.tsx
│       ├── profile/edit/page.tsx
│       ├── profile/avatar/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                        # Button, TextField, Select, Dialog, Tabs, etc.
│   ├── layout/                    # AppShell, TopAppBar, Sidebar, Rail, BottomTabs
│   ├── providers/                 # ThemeProvider, LocaleProvider, AppProviders
│   ├── avatar/                    # Avatar, AvatarEditor
│   └── charts/                    # ChartContainer (Recharts, carga diferida)
├── lib/
│   ├── design-tokens.generated.ts
│   ├── branding.ts
│   ├── theme.ts
│   ├── preferences.ts
│   ├── errors.ts
│   ├── error-keys.generated.ts
│   ├── format.ts
│   └── i18n/
├── messages/
│   ├── es.json
│   └── en.json
├── styles/
│   └── tokens.generated.css
└── __tests__/

frontend-mobile/
├── app/
│   ├── _layout.tsx                # Providers globales + Stack raíz
│   ├── (auth)/auth/login.tsx
│   ├── (onboarding)/
│   │   ├── profile/setup.tsx
│   │   ├── family/select.tsx
│   │   ├── family/create.tsx
│   │   └── invite/index.tsx
│   └── (app)/
│       ├── _layout.tsx            # Guard + SessionProvider + Stack
│       ├── (tabs)/
│       │   ├── _layout.tsx        # Tabs Inicio, Miembros, Perfil
│       │   ├── index.tsx          # Inicio -> /family/members
│       │   ├── family/members.tsx
│       │   └── profile.tsx
│       ├── settings.tsx
│       └── profile/
│           ├── edit.tsx
│           └── avatar.tsx
├── components/
│   ├── ui/                        # Equivalente móvil de componentes MD3
│   ├── layout/                    # Screen, ScreenHeader, BottomTabs
│   ├── providers/                 # ThemeProvider, LocaleProvider, AppProviders
│   ├── avatar/                    # Avatar, AvatarEditor
│   └── charts/                    # ChartContainer (Victory Native)
├── lib/
│   ├── design-tokens.generated.ts
│   ├── branding.ts
│   ├── theme.ts
│   ├── preferences.ts
│   ├── errors.ts
│   ├── error-keys.generated.ts
│   ├── format.ts
│   └── i18n/
└── __tests__/

backend/                           # SIN CAMBIOS en esta feature
docker-compose.yml                 # SIN CAMBIOS
```

**Structure Decision**: se conserva la estructura multi-proyecto de la spec 001. Se añaden dos
espacios compartidos de presentación en la raíz (`design-tokens/` y `shared/`) y un generador en
`scripts/`; los frontends consumen copias generadas y versionadas para que Next.js y Metro no
dependan de imports fuera de su raíz. El backend y Docker Compose no se modifican.

## Phase 0 / Phase 1 Outputs

- `research.md`: decisiones resueltas sobre Tailwind 4, `next-intl` sin rutas de locale, tema sin
  flash, i18n móvil, Expo Router, Victory Native compatible con Expo 52, generación compartida,
  errores i18n, accesibilidad y pruebas.
- `data-model.md`: modelo de tokens, preferencias, catálogos, descriptores de error, configuración
  de avatar, rutas/navegación y contratos de componentes. Confirma que el modelo de datos del
  backend no cambia.
- `contracts/token-contract.md`: esquema de `tokens.json`, salidas generadas y reglas de deriva.
- `contracts/ui-contracts.md`: API de componentes compartidos, variantes, estados y requisitos de
  accesibilidad por plataforma.
- `contracts/navigation-contracts.md`: mapa de rutas, guards, visibilidad por breakpoint y
  comportamiento de vuelta.
- `contracts/i18n-contracts.md`: espacios de nombres, claves de error, persistencia, paridad y
  formato.
- `quickstart.md`: comandos de instalación y verificación, y escenarios manuales de aceptación.

## Implementation Strategy

### Fase A — Fundación compartida

1. Crear `design-tokens/tokens.json` con roles MD3 claros/oscuros, tipografía, espaciado, radios,
   elevación, movimiento, breakpoints, iconografía y roles success/warning.
2. Implementar `scripts/generate-shared.mjs` y `scripts/check-shared.mjs`; generar tokens CSS/TS,
   catálogo de avatar y mapa de errores en ambos frontends.
3. Instalar dependencias justificadas y ajustar configuración de Tailwind/PostCSS, Next.js, Expo,
   TypeScript, ESLint y Jest.
4. Implementar `ThemeProvider`, `LocaleProvider`, preferencias, formato, branding y utilidades de
   error en web y móvil.
5. Crear helpers de prueba `renderWithProviders` y mocks de `matchMedia`, `useColorScheme`,
   SecureStore, `expo-localization` y Google OAuth.

### Fase B — Componentes MD3

1. Web: reemplazar `components/ui.tsx` por `components/ui/` con botones, campos, selects,
   checkbox/radio/switch, búsqueda, tarjetas, listas, avatar, chips, badges, divisores, wordmark,
   diálogos, menús, banners, spinner, estado vacío, tabs y navegación.
2. Móvil: reemplazar `components/ui.tsx` por `components/ui/` con los mismos nombres y variantes
   usando `StyleSheet` y tokens, incluyendo header de pantalla, tabs inferiores y estados de
   foco/pressed/disabled/error.
3. Añadir pruebas de variantes, estados y accesibilidad; `jest-axe` en web y aserciones de rol/
   etiqueta en móvil.

### Fase C — Web: shell y rutas

1. Refactorizar `app/layout.tsx` a server component con Inter vía `next/font/google`
   (`--font-inter`, `display: "swap"`, fallback del sistema), `lang`, `data-theme`, script de tema,
   providers cliente y `generateMetadata` con título Kitho y descripción desde el catálogo i18n.
2. Reorganizar rutas en `(auth)`, `(onboarding)` y `(app)` conservando las URLs existentes;
   login con `GoogleSignInButton` usando el botón oficial de Google Identity Services.
3. Implementar `AppShell` responsive (topbar, sidebar, rail, bottom tabs) y `SessionProvider`.
4. Refactorizar login, setup de perfil, selección/creación de grupo, invitación y miembros.
5. Añadir Inicio, Perfil, edición de perfil, Ajustes (idioma, tema, logout, acerca de/versión/
   legal, editar perfil) y editor de avatar.

### Fase D — Móvil: shell y rutas

1. Actualizar `app.json`: `name: "Kitho"`, `slug: "kitho"`, `userInterfaceStyle: "automatic"`,
   plugin `expo-localization` con `es`/`en`, conservando scheme, package y bundle técnicos.
2. Refactorizar `_layout.tsx` con `GestureHandlerRootView`, `SafeAreaProvider`, providers, fuentes
   Inter, splash y Stack raíz.
3. Reorganizar rutas en `(auth)`, `(onboarding)` y `(app)/(tabs)` conservando URLs; login con
   `GoogleSignInButton` como Pressable MD3 con icono oficial inline.
4. Implementar tabs inferiores, `SessionProvider`, header de pantalla y navegación a Ajustes/Perfil.
5. Refactorizar las pantallas existentes y añadir Inicio, Perfil, edición de perfil, Ajustes
   (idioma, tema, logout, acerca de/versión/legal, editar perfil) y editor de avatar.

### Fase E — Errores, estados y accesibilidad

1. Cambiar `ApiError` a descriptor con clave/fallback, convertir `ConfigurationError` a clave
   i18n y adaptar todas las pantallas para traducir en render.
2. Sustituir `window.confirm`/`Alert.alert` por diálogos MD3 accesibles con confirmación
   destructiva, foco atrapado, Escape y retorno de foco.
3. Implementar spinners con texto, banners inline, estados vacíos y `aria-live`/
   `accessibilityLiveRegion`.
4. Verificar foco, teclado, contraste, zoom 200%, 320 px, movimiento reducido y objetivos táctiles
   de 48 dp.

### Fase F — Gráficos y cierre

1. Añadir contenedores de gráficos diferidos con tokens de tema y sin importarlos desde rutas
   actuales.
2. Añadir reglas/scripts que impidan imports de `recharts`/`victory-native` fuera de
   `components/charts/`.
3. Actualizar README, pruebas existentes, pruebas nuevas, `lint`, `typecheck` y validaciones de
   quickstart.

## Requirements Coverage

| Requirements | Dónde se resuelve |
|--------------|-------------------|
| FR-001–FR-008 | `contracts/token-contract.md`, `data-model.md` (`DesignTokenSet`, `MD3 Color Scheme`) y Fase A |
| FR-009–FR-015 | `contracts/ui-contracts.md`, `ComponentSpec` y Fase B |
| FR-016–FR-023 | `contracts/navigation-contracts.md`, `NavigationItem` y Fases C/D |
| FR-024–FR-027 | `ThemePreference`, decisiones de tema web/móvil y `ThemeProvider` |
| FR-028–FR-034 | `contracts/i18n-contracts.md`, `TranslationCatalog` y `LocaleProvider` |
| FR-035–FR-040 | Contratos de accesibilidad de UI/navegación, Fase E y pruebas `jest-axe` |
| FR-041–FR-048 | Mapa de rutas, Fases C/D y `ConfirmDialog` |
| FR-049–FR-053 | `AvatarConfig`, `AvatarEditor` y Fases B/C/D |
| FR-054–FR-057 | `ScreenState`, contrato de feedback y Fase E |
| FR-058–FR-060 | Decisiones de gráficos, `ChartContainer` y Fase F |
| FR-061–FR-063 | `BrandIdentity`, `Wordmark` y `lib/branding.ts` |
| FR-064–FR-068 | Restricciones, Constitution Check y Quality Gates |
| FR-069–FR-071 | `BrandIdentity`, Constitution Check y validación de marca |
| SC-001–SC-014 | Quality Gates, quickstart y pruebas de tokens/i18n/accesibilidad/build |

4. Ejecutar la comprobación de deriva de tokens, paridad i18n y calidad visual.

## Testing and Quality Gates

- **Web**: `pnpm test` con Jest/RTL; incluye flujos existentes, componentes, tema, locale, errores,
  navegación responsive simulada y `jest-axe`. Auditoría Lighthouse de accesibilidad `>=95` en
  Login, Miembros y Ajustes.
- **Móvil**: `pnpm test` con Jest/RNTL; incluye flujos existentes, componentes, tema, locale,
  errores, tabs y accesibilidad.
- **Tokens**: `node scripts/generate-shared.mjs --check` falla si los archivos generados no
  coinciden con `tokens.json`.
- **UI**: `node scripts/check-ui.mjs` falla si una ruta actual importa gráficos o si aparecen
  colores literales fuera de archivos generados/permitidos.
- **i18n**: prueba de paridad de claves entre `es`/`en` y entre catálogos web/móvil; prueba de
  fallback de errores no mapeados.
- **Build**: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` en web; `pnpm run typecheck`,
  `pnpm run lint` y `npx expo-doctor` en móvil.
- **Manual**: escenarios de `quickstart.md` en web y móvil, incluyendo cambio de tema/idioma en
  caliente, recarga, sesión expirada, avatar y breakpoints.

## Risks and Mitigations

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Victory Native 41.16.1 no compila con Expo 52 en un development build | Medio | Versiones fijadas a las nativas de Expo 52; ninguna ruta actual lo importa. Si `expo-doctor`/build falla, se mantiene el contrato `ChartContainer` y se usa `victory-native@36.9.2` (solo SVG) como fallback documentado |
| Recharts 3 con React 19 RC | Bajo | Carga diferida con `next/dynamic` y `ssr:false`; validar build antes de conectar pantallas futuras |
| Tailwind 4 cambia utilidades o detección de contenido | Bajo | Usar configuración PostCSS oficial, breakpoints MD3 explícitos y pruebas de build; no depender de plugins de terceros |
| SVG de avatar supera 2048 caracteres | Medio | Generador compacto, paleta limitada y prueba que valida la longitud del data URI por configuración por defecto |
| Deriva entre tokens/catálogos web y móvil | Medio | Generación desde fuentes compartidas y `--check` en pruebas; paridad de claves i18n |
| Textos largos en inglés rompen layouts | Medio | Pruebas con cadenas largas, `min-w-0`, `break-words`, flexibilidad y ancho mínimo 320 px |
| Cambio de tema con parpadeo en web | Medio | Cookie + script inline antes del paint; `suppressHydrationWarning` y prueba de recarga con tema oscuro |
| Hidratación de fechas/locale entre servidor y cliente | Medio | Formatear fechas dinámicas en cliente tras montar o fijar `timeZone`/`now` estables; evitar tiempos relativos en SSR |
| Errores ya visibles no cambian de idioma | Medio | `ApiError` con clave/fallback y traducción en render, no en la capa API |
| Dependencias de test incompatibles con RN 0.76 | Bajo | Mantener `@testing-library/react-native` 12.7.2; no subir a 14.x hasta actualizar Expo/RN |
| Imports accidentales de gráficos | Bajo | ESLint `no-restricted-imports` + `scripts/check-ui.mjs` + SC-011 |

## Post-Design Constitution Check

*Re-evaluación posterior al diseño (Phase 1):*

- [x] **I**: el diseño se limita a las vistas y requisitos de `spec.md`; no añade funciones
  financieras ni cambios de dominio.
- [x] **II**: stack, contenedorización y estructura multi-proyecto se mantienen; las dependencias
  nuevas son de presentación y están justificadas.
- [x] **III**: no se tocan reglas de roles, moneda, precisión ni ciclos; el formato usa la moneda
  del grupo.
- [x] **IV**: no se introducen integraciones prohibidas.
- [x] **V**: la autoridad de validación sigue en FastAPI; la UI solo traduce errores y presenta
  estados.
- [x] **VI**: cada decisión traza a FR/SC y no se implementa comportamiento no especificado.
- [x] **Marca**: Kitho, títulos de tienda y wordmark provisional cumplen la constitución.

**Post-design gate result**: PASS.

## Complexity Tracking

*No violations - tracking not needed.*
