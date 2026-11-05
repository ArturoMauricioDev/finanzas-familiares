# Research: UI, Estilos y Vistas Web y Móvil (Kitho)

**Feature**: 002-ui-styles-and-views  
**Date**: 2026-11-04

## Decisions

### 1. Sistema de tokens compartido y generación de artefactos

- **Decision**: `design-tokens/tokens.json` es la fuente única. Un script Node
  (`scripts/generate-shared.mjs`) valida el esquema y genera:
  - `frontend-web/lib/design-tokens.generated.ts`
  - `frontend-web/styles/tokens.generated.css`
  - `frontend-mobile/lib/design-tokens.generated.ts`
  - copias generadas del motor de avatar y del mapa de errores compartidos.
  El script admite `--check` para fallar si los archivos versionados no coinciden con la fuente.
- **Rationale**: Cumple FR-001/FR-002/FR-008 y evita que web y móvil mantengan paletas o escalas
  divergentes. Next.js y Metro consumen archivos dentro de su propio proyecto, sin imports fuera
  de la raíz.
- **Alternatives considered**: Mantener dos archivos de tokens (rechazado: deriva inevitable);
  importar JSON de la raíz directamente (rechazado: Metro no lo soporta de forma fiable);
  generar tokens en tiempo de ejecución (rechazado: añade complejidad y no elimina el riesgo de
  deriva).

### 2. Paleta Material Design 3 desde `#6750A4`

- **Decision**: Usar la paleta tonal MD3 estándar derivada de `#6750A4`, expresada como roles
  semánticos para tema claro y oscuro: `primary`, `on-primary`, `primary-container`,
  `on-primary-container`, `secondary`, `tertiary`, `surface`, `surface-variant`,
  `surface-container-*`, `outline`, `outline-variant`, `error`, `success`, `warning`, `inverse-*`,
  `scrim`, etc. Los roles `success` y `warning` se añaden porque MD3 no los define y la UI los
  necesita para estados y roles.
- **Rationale**: Cumple FR-003 y permite cambiar de tema por variables sin recalcular componentes.
  Los pares `on-*` garantizan contraste AA.
- **Alternatives considered**: Colores hardcodeados por componente (prohibido por SC-001); usar
  solo la paleta por defecto de Tailwind (no es MD3); generar la paleta en runtime con una librería
  de color (más dependencia y coste innecesario).

### 3. Tipografía Inter en web y móvil

- **Decision**: Web carga Inter con `next/font/google` en el layout raíz (`display: "swap"`,
  fallback del sistema), expone la variable CSS `--font-inter` y la usa en `@theme inline` como
  `--font-sans`; móvil carga Inter con `@expo-google-fonts/inter` y `useFonts`. El token
  `fontFamily` es `Inter` y el fallback es `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Rationale**: Cumple FR-004 sin añadir otra dependencia web y sin depender de una CDN en
  runtime; Next self-hostea la fuente en el build. El fallback del sistema cubre el caso límite.
- **Alternatives considered**: `@fontsource/inter` (dependencia adicional innecesaria);
  `@expo-google-fonts/inter` también en web (pensado para React Native y con otra carga);
  CDN de Google Fonts (dependencia externa y flash).

### 4. Tailwind CSS 4 y breakpoints MD3

- **Decision**: Tailwind CSS 4.3.x con `@tailwindcss/postcss`, `@import "tailwindcss"` y un archivo
  generado de variables CSS. Los tokens semánticos se exponen con `@theme inline` para obtener
  utilidades como `bg-surface`, `text-on-surface`, `border-outline-variant` y
  `text-title-large`. Se definen breakpoints MD3 `medium: 600px` y `expanded: 840px`; no se usan
  los breakpoints por defecto para la navegación. Las variantes se resuelven con mapas de clases
  literales, no concatenando nombres de clase en runtime.
- **Rationale**: Cumple FR-006/FR-022 y permite tema conmutables por `data-theme` sin recompilar
  clases. Tailwind 4 elimina la necesidad de `tailwind.config.js` y detecta el contenido
  automáticamente.
- **Alternatives considered**: Tailwind 3 con configuración JS (válido pero más configuración y
  peor integración con variables CSS); CSS Modules puro (más código y menos consistencia);
  shadcn/ui (prohibido por la spec).

### 5. Tema web sin parpadeo

- **Decision**: Guardar la preferencia en `localStorage` (`kitho_theme`) y en una cookie
  (`kitho_theme`). El layout raíz es un server component que lee la cookie para fijar
  `data-theme` y `color-scheme` en `<html>` y usa `generateMetadata` para el título Kitho y la
  descripción localizada. Si no hay cookie, no fija `data-theme`; un script inline mínimo lee
  `localStorage` antes del paint y resuelve `system`/`light`/`dark`. `ThemeProvider` escucha `matchMedia` cuando el modo es
  `system`, aplica cambios en caliente y sincroniza cookie + `localStorage`.
- **Rationale**: Cumple FR-024/FR-026/FR-027 y el caso límite de cambio de tema del sistema en
  caliente. Evita el flash de tema claro en la primera carga.
- **Alternatives considered**: Solo `localStorage` (produce flash porque el servidor no lo conoce);
  solo CSS `prefers-color-scheme` (no permite forzar Claro/Oscuro); `next-themes` (dependencia
  adicional innecesaria para una preferencia de tres estados).

### 6. Tema móvil y splash

- **Decision**: `ThemeProvider` móvil usa `useColorScheme` para el modo `system`, un override
  `light`/`dark` persistido en SecureStore (`kitho_theme`) y `userInterfaceStyle: "automatic"` en
  `app.json` (con `expo-system-ui` para Android). `expo-splash-screen` se mantiene visible hasta
  que tema, locale y fuente Inter estén hidratados; `StatusBar` usa estilo claro/oscuro según el
  tema resuelto.
- **Rationale**: Cumple FR-024/FR-025/FR-026/FR-027 y evita parpadeo inicial. SecureStore ya está
  instalado y es adecuado para una preferencia pequeña.
- **Alternatives considered**: `AsyncStorage` (añade dependencia para un dato de dos valores);
  solo `Appearance` sin override (no permite forzar tema); cambiar `userInterfaceStyle` a `light`
  (rompe el modo oscuro del sistema).

### 7. i18n web con `next-intl` sin rutas de locale

- **Decision**: Usar `next-intl` 4.14.x con `NextIntlClientProvider` en un provider cliente que
  importa los catálogos `es`/`en`. La cookie `kitho_locale` determina el locale inicial para el
  `lang` del documento; el cambio de idioma actualiza el estado del provider y la cookie sin
  recargar ni cambiar la URL. No se usa el plugin de routing `[locale]`.
- **Rationale**: Cumple FR-028/FR-029/FR-031 y SC-005 sin alterar las rutas existentes de la spec
  001. `next-intl` sigue siendo la librería acordada y aporta `useTranslations`/`useFormatter`.
- **Alternatives considered**: Rutas `/[locale]/...` (cambia URLs y exige middleware; mayor
  alcance); `react-i18next` (no es la elección de la spec); traducciones ad hoc (sin claves ni
  formato).
- **Compatibility note**: `next-intl@4.14.9` declara soporte para Next 12–16 y React 19 RC, por lo
  que es compatible con Next 15.0.3 y React 19.0.0 RC.

### 8. i18n móvil con `expo-localization` + `i18n-js`

- **Decision**: `i18n-js` 4.5.x con catálogos `es`/`en`; `expo-localization` aporta la región y
  los datos de configuración regional para `Intl`. El idioma inicial es español salvo preferencia
  guardada; la preferencia se persiste en SecureStore (`kitho_locale`) y el provider fuerza un
  re-render al cambiarla.
- **Rationale**: Cumple FR-028/FR-029/FR-031/FR-032. `expo-localization` se usa para formato y
  configuración regional, no para imponer el idioma, porque la spec exige español por defecto.
- **Alternatives considered**: `react-native-localize` (no es Expo-first); detectar el idioma del
  dispositivo como inicial (contradice el español por defecto); usar `Intl` sin catálogos (no
  cubre textos).

### 9. Tema, idioma y sesión desacoplados

- **Decision**: Las preferencias usan claves `kitho_theme`/`kitho_locale` y no se borran al cerrar
  sesión ni al recibir `401`. Las claves de sesión existentes (`finanzas_familiares_session`,
  `finanzas_familiares_pending_invite`) se conservan para no invalidar sesiones ni romper la spec
  001.
- **Rationale**: Cumple FR-025/FR-031 y el caso límite de sesión expirada que conserva tema e
  idioma. Evita una migración de almacenamiento no pedida.
- **Alternatives considered**: Renombrar todas las claves a `kitho_*` (obliga a migrar sesiones y
  pruebas); guardar preferencias en el backend (fuera de alcance y sin endpoints).

### 10. Navegación web responsive

- **Decision**: Un único `AppShell` con CSS grid/flex y breakpoints MD3:
  - `>=840px`: topbar + sidebar con Inicio, Miembros, Perfil y Ajustes.
  - `600–839px`: topbar + rail con los mismos cuatro destinos.
  - `<600px`: topbar + tabs inferiores Inicio, Miembros y Perfil; Ajustes se alcanza desde Perfil.
  El destino activo usa `aria-current="page"` y un indicador visual MD3.
- **Rationale**: Cumple FR-016/FR-018/FR-022 y evita lógica JavaScript de layout. La misma
  estructura sirve a web compacta y a móvil conceptualmente.
- **Alternatives considered**: Cambiar la estructura con `matchMedia` en JS (más estados y riesgo de
  desajuste); drawer lateral en compacto (la spec pide tabs inferiores); sidebar colapsable manual
  (no pedido).

### 11. Navegación móvil con Expo Router

- **Decision**: Reorganizar `app/` en grupos `(auth)`, `(onboarding)` y `(app)`. Dentro de `(app)`,
  un stack contiene `(tabs)` (Inicio, Miembros, Perfil), `settings`, `profile/edit` y
  `profile/avatar`. Se conservan las URLs actuales (`/auth/login`, `/profile/setup`,
  `/family/select`, `/family/create`, `/invite`, `/family/members`). El layout `(app)` aplica el
  guard, provee la sesión y evita duplicar refresh en cada pantalla.
- **Rationale**: Cumple FR-017/FR-018/FR-019/FR-020/FR-021. Expo Router 4 ya incluye
  `@react-navigation/bottom-tabs`, por lo que no se añade un sistema de navegación alternativo.
- **Alternatives considered**: Barra de tabs personalizada (más código y menos accesible); mantener
  un Stack plano sin tabs (no cumple FR-017); usar React Navigation manualmente (duplica lo que
  Expo Router ya ofrece).

### 12. Guard de sesión y contexto

- **Decision**: En web, el layout `(app)` ejecuta `useAuthGuard(true)` y provee
  `SessionContext`; las pantallas de esa área consumen el contexto. En móvil, el layout `(app)`
  hace lo mismo. Las pantallas de `(auth)`/`(onboarding)` conservan `useAuthGuard` individual.
- **Rationale**: Evita refresh y redirecciones duplicadas, mantiene el comportamiento de la spec
  001 y cumple FR-020. El guard sigue siendo la única autoridad de redirección en cliente.
- **Alternatives considered**: Llamar `useAuthGuard` en cada pantalla (duplica peticiones y puede
  provocar carreras); mover el guard a middleware de Next (no puede leer localStorage y requeriría
  rehacer la sesión); confiar solo en el backend (la UI debe redirigir).

### 13. Errores i18n con descriptor y fallback

- **Decision**: `ApiError` deja de contener un mensaje ya traducido. Transporta `status`,
  `messageKey` (si el detalle es conocido) y `fallbackDetail` (texto string del backend, si
  existe). La UI guarda un `ErrorDescriptor` y lo traduce en render con `t()`. El mapa
  detalle→clave se comparte desde `shared/errors/error-keys.json` y se genera en ambos frontends.
- **Rationale**: Cumple FR-033 y FR-031: un cambio de idioma actualiza también errores ya visibles.
  El texto del backend sigue siendo el fallback si no hay clave.
- **Alternatives considered**: Traducir en `api.ts` (el mensaje queda congelado en el idioma de la
  petición); mostrar siempre el detalle del backend (rompe la localización y la consistencia);
  ignorar el backend y usar solo códigos HTTP (pierde información útil).

### 14. Avatar generado y editor de vista previa

- **Decision**: `shared/avatar/avatar-engine.ts` es una función pura que recibe `AvatarConfig` y
  devuelve un SVG compacto; `shared/avatar/avatar-options.json` define las opciones de base,
  fondo, cabello, ropa, ojos y accesorios. El avatar por defecto se deriva de forma determinista
  (hash de `user.id`/`email`), se serializa como data URI SVG y se envía en `foto_avatar`. El
  editor usa el mismo motor para la vista previa en tiempo real; Guardar muestra un aviso de que
  la persistencia llega en 003 y no modifica `foto_avatar`.
- **Rationale**: Cumple FR-049/FR-050/FR-051/FR-052/FR-053 sin assets externos ni backend nuevo.
  El generador compartido evita avatares distintos entre web y móvil. `react-native-svg` ya es
  necesario para Lucide y permite renderizar el SVG en móvil con `SvgXml`.
- **Alternatives considered**: Avatar remoto (dependencia externa, privacidad y disponibilidad);
  imágenes empaquetadas (no son "generadas por la app" y aumentan el bundle); guardar el editor en
  002 (requiere subida/persistencia de la spec 003).
- **Constraint**: El esquema actual limita `foto_avatar` a 2048 caracteres. El motor debe producir
  un SVG compacto y una prueba debe validar la longitud del data URI por defecto. Si una
  configuración excede el límite, no se envía y se muestra un error inline; el editor no persiste
  en 002, por lo que no afecta al avatar guardado.

### 15. Gráficos compatibles con el stack actual

- **Decision**: Web: `recharts@3.10.x` dentro de `components/charts/ChartContainer.tsx`, un client
  component que carga el gráfico con `next/dynamic` y `ssr:false`; ninguna ruta actual lo importa. Móvil:
  `victory-native@42.0.1` con `@shopify/react-native-skia@2.14.0`,
  `react-native-reanimated@4.7.1`, `react-native-worklets@0.13.0` y
  `react-native-gesture-handler@3.3.0`, encapsulado en `components/charts/ChartContainer.tsx`;
  ninguna ruta actual lo importa.
- **Rationale**: Cumple FR-058/FR-059/FR-060 y SC-011. Las versiones móviles coinciden con las
  nativas incluidas en Expo SDK 58; `babel-preset-expo` ya incluye el plugin de Reanimated/Worklets.
  Victory Native 43 se descarta porque exige Skia `>=2.15.1`, fuera de la versión que fija SDK 58.
- **Alternatives considered**: Victory Native 43 + Skia 2.15 (rompe la matriz de SDK 58); Victory
  Native clásico 36 (solo SVG, sin Skia; se mantiene como fallback si el build nativo de 42 falla);
  gráficos propios con SVG (más trabajo y sin la base acordada).
- **Fallback**: si `expo-doctor` o un development build rechazan la combinación 42.0.1, se
  conserva el contrato `ChartContainer` con un adaptador interno y se fija
  `victory-native@36.9.2` (compatible con `react-native-svg`) como implementación de la base,
  documentando el cambio. La decisión final se
  validará en la fase de implementación con `expo-doctor`.

### 16. Accesibilidad y movimiento reducido

- **Decision**: Web: HTML semántico, `<dialog>` nativo para diálogos (foco atrapado, Escape,
  retorno de foco), `aria-current`, `aria-describedby`/`aria-invalid` en campos, regiones
  `role="alert"`/`status`, skip link, foco visible con anillo MD3 y `@media
  (prefers-reduced-motion: reduce)`. Móvil: `accessibilityRole`, `accessibilityLabel`,
  `accessibilityState`, `accessibilityLiveRegion`, objetivos de 48 dp y hook de movimiento
  reducido basado en `AccessibilityInfo`.
- **Rationale**: Cumple FR-014/FR-035–FR-040 y SC-002/SC-003. Evita añadir Radix/shadcn para
  diálogos simples y mantiene el control visual MD3.
- **Alternatives considered**: Radix primitives (accesibles pero dependencia extra y no es el
  enfoque MD3 propio); `window.confirm`/`Alert.alert` (no son MD3 y no permiten el diseño ni el
  estado de confirmación requerido); confiar solo en pruebas manuales (no reproducible).

### 17. Estrategia de pruebas y puertas de calidad

- **Decision**: Web con Jest + Testing Library + `jest-axe`; móvil con Jest 30 + React Native
  Testing Library 14.1.0. Helpers `renderWithProviders` con locale/tema controlados. Pruebas de
  paridad de claves i18n, derivación de tokens (`--check`), imports de gráficos y literales
  visuales. Mantener las pruebas de flujo de la spec 001 actualizadas.
- **Rationale**: Cumple FR-066 y SC-001/SC-002/SC-011. RNTL 14 es la línea compatible con Expo
  SDK 58 / RN 0.88 / React 19 y usa una API asíncrona (`await render`, `await fireEvent`).
- **Alternatives considered**: Playwright/Detox (fuera de alcance y más coste); solo pruebas
  manuales (no reproducibles); mantener RNTL 12 (incompatible con el stack actualizado).

### 18. Marca y metadatos

- **Decision**: Un módulo `lib/branding.ts` por frontend centraliza `BRAND_NAME = "Kitho"`,
  `STORE_TITLE_ES = "Kitho: Tareas y Finanzas Familiares"` y
  `STORE_TITLE_GLOBAL = "Kitho Family"`. El wordmark provisional es texto "Kitho" con la
  tipografía y color de marca. Web usa `generateMetadata` con título Kitho y descripción
  localizada; móvil usa `name: "Kitho"` y `slug: "kitho"` en `app.json`, manteniendo el scheme
  técnico actual para no romper OAuth.
- **Rationale**: Cumple FR-034/FR-061/FR-062/FR-063 y la sección de marca de la constitución. El
  scheme no es un nombre visible y cambiarlo obligaría a reconfigurar OAuth.
- **Alternatives considered**: Cambiar el scheme a `kitho` en 002 (rompe redirects y credenciales
  existentes); traducir el nombre (prohibido); usar assets de logo inexistentes (rompería FR-063).

## Version Matrix

| Paquete | Versión fijada | Nota |
|---------|----------------|------|
| `next-intl` | 4.14.x | Soporta Next 12–16 y React 19 RC |
| `tailwindcss` | 4.3.x | Configuración PostCSS oficial |
| `@tailwindcss/postcss` | 4.3.x | Requerido por Tailwind 4 |
| `lucide-react` | 1.68.x | Iconos web |
| `lucide-react-native` | 1.68.x | Requiere `react-native-svg` 15.x |
| `recharts` | 3.10.x | Carga diferida, cliente |
| `react-is` | 19.x | Peer de Recharts |
| `jest-axe` | 11.x | Accesibilidad web |
| `expo-localization` | ~58.0.5 | Versión de Expo SDK 58 |
| `i18n-js` | 4.5.x | Catálogos móviles |
| `expo-font` | ~58.0.11 | Carga de Inter |
| `@expo-google-fonts/inter` | 0.4.x | Fuente Inter |
| `expo-splash-screen` | ~58.0.13 | Retención hasta hidratar |
| `expo-status-bar` | ~58.0.4 | Barra de estado por tema |
| `expo-system-ui` | ~58.0.7 | `userInterfaceStyle` en Android |
| `react-native-svg` | 15.16.0 | Lucide, avatar y Victory fallback |
| `victory-native` | 42.0.1 | Compatible con Expo SDK 58; 43 exige Skia >=2.15 |
| `@shopify/react-native-skia` | 2.14.0 | Versión de Expo SDK 58 |
| `react-native-reanimated` | 4.7.1 | Versión de Expo SDK 58 |
| `react-native-worklets` | 0.13.0 | Peer de Reanimated 4 |
| `react-native-gesture-handler` | 3.3.0 | Versión de Expo SDK 58 |
| `react-native-safe-area-context` | 5.11.1 | Versión de Expo SDK 58 |
| `@testing-library/react-native` | 14.1.0 | API asíncrona para React 19 |

## Resolved Clarifications

All aspects from `spec.md` are clear; no `NEEDS CLARIFICATION` remain. Las decisiones de
compatibilidad de Victory Native y del formato de avatar quedan resueltas con las versiones y
límites anteriores.
