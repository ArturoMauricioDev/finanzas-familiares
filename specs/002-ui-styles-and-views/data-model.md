# Data Model: UI, Estilos y Vistas Web y Móvil (Kitho)

**Feature**: 002-ui-styles-and-views  
**Date**: 2026-11-06

## Alcance

Esta feature **no añade cambios propios al modelo de datos del backend**. Consume las extensiones
funcionales definidas en la spec 001 para el ciclo de vida de familia y la invitación por código.
El modelo que sigue describe el estado de presentación, los artefactos compartidos, los contratos
de UI y las dependencias de datos que web y móvil necesitan.

## Dependencias de la spec 001

| Entidad / contrato | Campos o reglas consumidas | Uso en 002 |
|--------------------|----------------------------|------------|
| `Family` | `estado` activo/eliminado y `deleted_at`; soft delete solo con 1 integrante | Mostrar Eliminar/Abandonar y redirigir tras completar |
| `Membership` | `rol_familiar` (Padre/Madre/Hijo/Otro), `rol_permiso` (Administrador/Miembro), `created_at` | Mostrar roles y respetar la reasignación de administrador al miembro más antiguo |
| `Invitation` | `codigo` único, `expira_en` (7 días), `usado`, `fecha_uso` | Mostrar solo el código, validar unión y mapear inválido/usado/expirado |
| Endpoints de spec 001 | Crear invitación, unirse por código, abandonar familia, eliminar familia y listar miembros | `InviteCode`, `FamilyActions` y pantallas de invitación/Miembros |

La UI no calcula soft delete, autorización ni reasignación: solo presenta las acciones posibles y
mapea los errores que devuelve el backend.

## Entities

### BrandIdentity

Identidad de marca canónica usada por UI y metadatos.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | constante `"Kitho"` | Nombre visible del producto |
| storeTitleEs | string | constante `"Kitho: Tareas y Finanzas Familiares"` | Ficha España/Latam |
| storeTitleGlobal | string | constante `"Kitho Family"` | Ficha EE.UU./Global |
| meaning | string | no vacío | Referencia a "Kith" (familiares y allegados) |
| wordmark | `"Kitho"` | sin assets definitivos | Wordmark provisional |
| scheme | string | `"finanzasfamiliares"` | Scheme técnico de OAuth; no es nombre visible |

**Validation**:
- El nombre no se traduce ni se adapta fonéticamente.
- "Finanzas Familiares" solo puede aparecer como descriptor de categoría en la ficha
  España/Latam, nunca como nombre del producto.
- Cualquier cambio de nombre o ficha requiere enmienda constitucional.

### DesignTokenSet

Fuente única en `design-tokens/tokens.json`. Se versiona y se valida con un esquema.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| version | string | SemVer | Versión del conjunto de tokens |
| seedColor | string | `#6750A4` | Color semilla MD3 |
| color | object | roles por esquema | Roles semánticos claro/oscuro |
| typography | object | escala MD3 | Familias, tamaños, pesos y alturas |
| spacing | object | múltiplos de 4 | Escala de espaciado |
| radius | object | px | Radios de esquina |
| elevation | object | niveles 0–5 | Sombras |
| motion | object | duraciones/easings | Movimiento estándar y enfatizado |
| breakpoints | object | `compact`, `medium`, `expanded` | Clases de ventana MD3 |
| icon | object | tamaños | Tamaños base y derivados |
| touchTarget | number | `48` | Objetivo táctil mínimo |

**Schema shape (resumen)**:

```json
{
  "version": "1.0.0",
  "seedColor": "#6750A4",
  "color": {
    "light": { "primary": "#6750A4", "onPrimary": "#FFFFFF" },
    "dark": { "primary": "#D0BCFF", "onPrimary": "#381E72" }
  },
  "typography": {
    "displayLarge": {
      "fontFamily": "Inter",
      "fontSize": 57,
      "lineHeight": 64,
      "fontWeight": 400,
      "letterSpacing": -0.25
    }
  },
  "spacing": { "0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "8": 32, "10": 40, "12": 48, "16": 64 },
  "radius": { "none": 0, "xs": 4, "sm": 8, "md": 12, "lg": 16, "xl": 28, "full": 9999 },
  "elevation": {
    "0": "none",
    "1": "0 1px 2px rgba(0,0,0,0.30), 0 1px 3px 1px rgba(0,0,0,0.15)",
    "2": "0 1px 2px rgba(0,0,0,0.30), 0 2px 6px 2px rgba(0,0,0,0.15)",
    "3": "0 1px 3px rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)",
    "4": "0 2px 3px rgba(0,0,0,0.30), 0 6px 10px 4px rgba(0,0,0,0.15)",
    "5": "0 4px 4px rgba(0,0,0,0.30), 0 8px 12px 6px rgba(0,0,0,0.15)"
  },
  "motion": {
    "short": 150,
    "medium": 300,
    "long": 500,
    "easingStandard": "cubic-bezier(0.2, 0, 0, 1)",
    "easingEmphasized": "cubic-bezier(0.05, 0.7, 0.1, 1)"
  },
  "breakpoints": { "compact": 0, "medium": 600, "expanded": 840 },
  "icon": { "sm": 16, "md": 20, "base": 24, "lg": 32, "xl": 40, "xxl": 48 },
  "touchTarget": 48
}
```

**Validation**:
- Todos los roles `on-*` deben existir para cada rol de color.
- Los valores de color deben ser hexadecimales válidos y los pares texto/fondo deben cumplir
  contraste WCAG AA.
- Los tamaños de espaciado, radio, icono y objetivo táctil deben ser números no negativos.
- Los breakpoints deben ser `0`, `600` y `840`.
- El script `--check` debe detectar cualquier diferencia entre `tokens.json` y los archivos
  generados.

### MD3 Color Scheme

Roles semánticos por tema. Los valores siguientes son la base acordada; el archivo final se
completa con todos los roles MD3 y los roles `success`/`warning`.

| Role | Light | Dark |
|------|-------|------|
| primary | `#6750A4` | `#D0BCFF` |
| on-primary | `#FFFFFF` | `#381E72` |
| primary-container | `#EADDFF` | `#4F378B` |
| on-primary-container | `#21005D` | `#EADDFF` |
| secondary | `#625B71` | `#CCC2DC` |
| on-secondary | `#FFFFFF` | `#332D41` |
| secondary-container | `#E8DEF8` | `#4A4458` |
| on-secondary-container | `#1D192B` | `#E8DEF8` |
| tertiary | `#7D5260` | `#EFB8C8` |
| on-tertiary | `#FFFFFF` | `#492532` |
| tertiary-container | `#FFD8E4` | `#633B48` |
| on-tertiary-container | `#31111D` | `#FFD8E4` |
| surface | `#FFFBFE` | `#1C1B1F` |
| on-surface | `#1C1B1F` | `#E6E1E5` |
| surface-variant | `#E7E0EC` | `#49454F` |
| on-surface-variant | `#49454F` | `#CAC4D0` |
| outline | `#79747E` | `#938F99` |
| outline-variant | `#CAC4D0` | `#49454F` |
| error | `#B3261E` | `#F2B8B5` |
| on-error | `#FFFFFF` | `#601410` |
| error-container | `#F9DEDC` | `#8C1D18` |
| on-error-container | `#410E0B` | `#F9DEDC` |
| success | `#386A20` | `#9CD67D` |
| on-success | `#FFFFFF` | `#0C3900` |
| success-container | `#B7F397` | `#205107` |
| on-success-container | `#072100` | `#B7F397` |
| warning | `#7D5700` | `#F5BF48` |
| on-warning | `#FFFFFF` | `#412D00` |
| warning-container | `#FFDEA6` | `#5E4200` |
| on-warning-container | `#261900` | `#FFDEA6` |
| surface-container-lowest | `#FFFFFF` | `#0F0D13` |
| surface-container-low | `#F7F2FA` | `#1D1B20` |
| surface-container | `#F3EDF7` | `#211F26` |
| surface-container-high | `#ECE6F0` | `#2B2930` |
| surface-container-highest | `#E6E0E9` | `#36343B` |
| inverse-surface | `#313033` | `#E6E1E5` |
| inverse-on-surface | `#F4EFF4` | `#313033` |
| inverse-primary | `#D0BCFF` | `#6750A4` |
| shadow | `#000000` | `#000000` |
| scrim | `#000000` | `#000000` |

**Validation**: los pares `on-*` sobre su rol principal y los roles de contenedor deben superar
4.5:1 para texto normal y 3:1 para texto grande/iconos.

### Typography Scale

| Token | Size | Line height | Weight | Uso |
|-------|------|-------------|--------|-----|
| displayLarge | 57 | 64 | 400 | Marca/hero |
| displayMedium | 45 | 52 | 400 | Títulos excepcionales |
| displaySmall | 36 | 44 | 400 | Títulos de sección grandes |
| headlineLarge | 32 | 40 | 400 | Encabezado de pantalla |
| headlineMedium | 28 | 36 | 400 | Sección |
| headlineSmall | 24 | 32 | 400 | Subsección |
| titleLarge | 22 | 28 | 500 | Título de tarjeta |
| titleMedium | 16 | 24 | 500 | Título de lista |
| titleSmall | 14 | 20 | 500 | Etiqueta destacada |
| bodyLarge | 16 | 24 | 400 | Texto principal |
| bodyMedium | 14 | 20 | 400 | Texto secundario |
| bodySmall | 12 | 16 | 400 | Metadatos |
| labelLarge | 14 | 20 | 500 | Botones |
| labelMedium | 12 | 16 | 500 | Chips/badges |
| labelSmall | 11 | 16 | 500 | Ayudas |

**Font family**: `Inter`; web vía `next/font/google` (`--font-inter`) con fallback
`system-ui, -apple-system, "Segoe UI", sans-serif`; móvil vía `@expo-google-fonts/inter` con
fallback `System`.

### ThemePreference

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| mode | `"system" \| "light" \| "dark"` | default `system` | Preferencia elegida |
| resolved | `"light" \| "dark"` | derivado | Tema aplicado |
| storageKeyWeb | string | `kitho_theme` | localStorage/cookie |
| storageKeyMobile | string | `kitho_theme` | SecureStore |
| cookieMaxAge | number | 31536000 | Un año |

**State transitions**:
- `system` → `light` / `dark`: el usuario elige en Ajustes.
- `light` / `dark` → `system`: vuelve a seguir al sistema.
- Si `mode = system`, un cambio de `prefers-color-scheme`/`useColorScheme` actualiza `resolved`
  sin recargar.
- Cerrar sesión o recibir `401` no borra la preferencia.

### LocalePreference

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| locale | `"es" \| "en"` | default `es` | Idioma de UI |
| storageKeyWeb | string | `kitho_locale` | localStorage/cookie |
| storageKeyMobile | string | `kitho_locale` | SecureStore |
| cookieMaxAge | number | 31536000 | Un año |

**Validation**:
- El locale inicial es `es` si no hay preferencia.
- Cambiar el locale actualiza todos los textos y errores visibles sin recargar.
- Cerrar sesión o recibir `401` no borra la preferencia.

### CurrencyOption

Moneda seleccionable en el alta de familia. La fuente ISO 4217 es la del runtime (`Intl`), y las
sugerencias regionales viven en `shared/currencies/regions.json`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| code | string | ISO 4217 válido | Código de moneda, p. ej. `MXN` |
| name | string | desde `Intl.DisplayNames` | Nombre en el idioma activo |
| region | string | `latam`, `europe`, `us` o `other` | Región de la sugerencia |
| isLocal | boolean | default false | Moneda detectada para el país |
| isSuggested | boolean | default false | Pertenece a las 5 sugerencias |
| source | `"geolocation" \| "locale" \| "fallback" \| "user"` | — | Origen de la preselección |

### CurrencySelection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| detectedCountry | string \| null | ISO 3166-1 alpha-2 | País detectado; null si no hay permiso |
| region | `"latam" \| "europe" \| "us" \| "other"` | derivado | Región usada para sugerencias |
| suggested | CurrencyOption[] | exactamente 5 | Sugerencias visibles |
| selectedCode | string | ISO 4217 válido | Selección única |
| source | `"geolocation" \| "locale" \| "fallback" \| "user"` | — | Cómo se eligió |

**Validation**:
- Las listas por región son: LatAm `MXN, BRL, ARS, COP, CLP`; Europa `EUR, GBP, CHF, SEK, PLN`;
  EE.UU. `USD, CAD, MXN, EUR, GBP`.
- La moneda local detectada se coloca primero; si no está en la lista, se añade como primera.
- Si se deniega la geolocalización, se usa la moneda del locale; si no hay, `USD`.
- **Otros** busca sobre todo ISO 4217 y no permite códigos inválidos.
- La selección es única y se persiste en `Family.moneda_local`, no como preferencia local.

### InvitationCodeView

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| code | string | no vacío, normalizado | Código visible y copiable |
| expiresAt | ISO date | +7 días desde creación | Caducidad |
| daysRemaining | number | >= 0 | Texto de vigencia |
| singleUse | boolean | `true` | Se invalida al aceptar |
| status | `"active" \| "used" \| "expired"` | derivado | Estado de la invitación |
| canCopy | boolean | default true | Acción de copiar |
| canShare | boolean | default true | Compartir solo texto, sin URL |

**Validation**:
- La UI muestra solo el código; nunca construye ni muestra un enlace de invitación.
- El código introducido se normaliza (mayúsculas, sin espacios) antes de enviarlo.
- `used`/`expired`/`invalid` se mapean a claves i18n y no permiten reintentar con el mismo código.

### FamilyAction

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | `"delete" \| "leave"` | único | Acción disponible |
| labelKey | string | clave i18n | Texto del botón |
| visibleWhen | `"memberCount == 1" \| "memberCount > 1"` | — | Regla de visibilidad |
| destructive | boolean | `true` | Usa estilo danger |
| requiresConfirmation | boolean | `true` | Abre `ConfirmDialog` |
| redirectTo | string | `/family/select` | Destino al completar |
| endpoint | string | contrato spec 001 | Operación de backend |

**Validation**:
- Con exactamente 1 integrante se muestra **Eliminar familia** (soft delete).
- Con más de 1 integrante se muestra **Abandonar familia**; nunca Eliminar.
- La UI no ejecuta la reasignación: si el backend la realiza, se refresca la membresía.
- Toda acción muestra carga, deshabilita doble envío y mapea errores.

### TranslationCatalog

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| locale | `"es" \| "en"` | único por plataforma | Idioma |
| namespaces | object | claves estables | `common`, `auth`, `profile`, `family`, `invite`, `members`, `settings`, `avatar`, `errors`, `a11y`, `legal` |
| errorKeys | object | detalle/status → clave | Mapa compartido |

**Validation**:
- Las claves de `es` y `en` deben ser idénticas.
- Las claves de web y móvil deben ser idénticas (prueba de paridad).
- No se permiten textos hardcodeados en componentes; el texto de marca "Kitho" es la única
  excepción permitida.

### ErrorKeyMap y ErrorDescriptor

`shared/errors/error-keys.json` contiene el mapa compartido. `ErrorDescriptor` es el estado que
guardan las pantallas para traducir en render.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| key | string \| null | clave i18n `errors.*` | Clave conocida |
| fallback | string | puede estar vacío | Detalle string del backend; si falta, se usa la clave de estado |
| status | number | 0–599 | Código HTTP; `0` = red |

**Validation**:
- Si `key` existe, la UI usa `t(key)`.
- Si no hay clave, usa `fallback`; si también falta, usa `errors.status.<status>` y, en último
  caso, `errors.unexpected`.
- `status` conserva el código para decisiones de guard/redirect.
- El mapa se genera en ambos frontends desde la fuente compartida.

### NavigationItem y RouteDefinition

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | único | `home`, `members`, `profile`, `settings` |
| path | string | ruta válida | Destino |
| labelKey | string | clave i18n | Texto visible |
| icon | LucideIcon | nombre válido | Icono |
| visibility | object | `compact`, `medium`, `expanded` | Dónde aparece |
| requiresFamily | boolean | default `true` | Guard de grupo |
| activeMatch | string[] | prefijos | Detección de activo |

**Route map**:

| Route | Platform | Guard | Nav |
|-------|----------|-------|-----|
| `/` | ambas | autenticado + perfil + grupo | Inicio (redirige a Miembros) |
| `/auth/login` | ambas | público | No |
| `/profile/setup` | ambas | autenticado sin perfil | No |
| `/family/select` | ambas | autenticado con perfil sin grupo | No |
| `/family/create` | ambas | autenticado con perfil sin grupo | No |
| `/invite` | ambas | autenticado con perfil sin grupo | No |
| `/family/members` | ambas | autenticado + grupo | Sí (Miembros) |
| `/profile` | ambas | autenticado + grupo | Sí (Perfil) |
| `/profile/edit` | ambas | autenticado + grupo | No (desde Perfil/Ajustes) |
| `/profile/avatar` | ambas | autenticado + grupo | No (desde Perfil/Ajustes) |
| `/settings` | ambas | autenticado + grupo | Web: Sí; móvil: desde Perfil |

**Nota**: `/invite` es la pantalla de unión mediante código; la invitación generada se muestra
dentro de Miembros y nunca se expone como URL.

**Nav visibility**:
- Web expandida (`>=840px`): sidebar con Inicio, Miembros, Perfil y Ajustes.
- Web media (`600–839px`): rail con los cuatro destinos.
- Web compacta (`<600px`): tabs inferiores Inicio, Miembros, Perfil; Ajustes desde Perfil.
- Móvil: tabs inferiores Inicio, Miembros, Perfil; Ajustes desde Perfil.

### ComponentSpec

Catálogo de componentes con nombres compartidos y variantes. La implementación concreta difiere
por plataforma, pero la API y los estados son equivalentes.

| Family | Components | Variants / states |
|--------|------------|-------------------|
| Formularios | `Button`, `IconButton`, `GoogleSignInButton`, `TextField`, `Select`, `Checkbox`, `Radio`, `Switch`, `SearchField` | filled, tonal, outlined, text, danger; hover, pressed, focus, disabled, error, helper |
| Familia | `CurrencySelect`, `InviteCode`, `FamilyActions` | default, searching, loading, empty; invalid/used/expired code; destructive confirm |
| Contenido | `Card`, `List`, `ListItem`, `Avatar`, `AvatarEditor`, `Chip`, `Badge`, `Divider`, `Wordmark` | elevated, filled, outlined; selected, unread, role |
| Feedback | `Dialog`, `ConfirmDialog`, `Menu`, `InlineBanner`, `Spinner`, `EmptyState` | info, success, warning, error; loading |
| Navegación | `TopAppBar`, `Sidebar`, `Rail`, `BottomTabs`, `Tabs`, `Breadcrumbs` | active, inactive, compact, expanded |
| Layout | `Page`, `Screen`, `ScreenHeader`, `AppShell` | compact, medium, expanded; safe area |

**Validation**:
- Todo control interactivo tiene nombre accesible, rol y estado.
- El foco visible usa el token de foco y un anillo de 2 px con offset.
- Los objetivos táctiles miden al menos 48x48 dp.
- Los banners de error usan `role="alert"`/`accessibilityLiveRegion`; los de éxito usan
  `role="status"`.

### AvatarConfig

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| base | string | id de `avatar-options.json` | Tono de piel/forma base |
| background | string | clave de token de color | Fondo del avatar |
| hair | string | id de opción o `none` | Cabello |
| clothes | string | id de opción | Ropa |
| eyes | string | id de opción | Ojos |
| accessories | string | id de opción o `none` | Accesorios |

**AvatarOptionCatalog** (`shared/avatar/avatar-options.json`):

```json
{
  "bases": [{ "id": "base-1", "skin": "#F2C9A0", "shape": "round" }],
  "backgrounds": ["primary-container", "secondary-container", "tertiary-container"],
  "hair": [{ "id": "short", "color": "#2B1B17" }],
  "clothes": [{ "id": "hoodie", "color": "primary" }],
  "eyes": [{ "id": "round", "color": "#1C1B1F" }],
  "accessories": [{ "id": "none" }, { "id": "glasses" }]
}
```

**Default derivation**:
- Hash estable de `user.id` + `email` (FNV-1a) para elegir una opción de cada lista.
- `accessories` puede ser `none`.
- El SVG resultante se serializa como data URI y se valida `length <= 2048` antes de enviarlo en
  `foto_avatar`.
- En 002 el editor no persiste; el avatar por defecto se envía en el onboarding y el editor solo
  previsualiza.

**Validation**:
- Todos los ids deben existir en el catálogo.
- `background` debe ser una clave de color válida.
- El SVG debe ser determinista para la misma entrada.
- El data URI por defecto no debe superar 2048 caracteres.

### ScreenState

| State | Description | UI |
|-------|-------------|----|
| `idle` | Sin operación | Contenido normal |
| `loading` | Operación en curso | Spinner + texto traducido; control deshabilitado |
| `success` | Operación completada | Banner `role="status"` |
| `error` | Error conocido o fallback | Banner `role="alert"` + reintento si aplica |
| `empty` | Lista/vista sin datos | `EmptyState` con explicación y acción sugerida |

### ChartContainerProps (base futura)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| type | `"line" \| "bar" \| "pie" \| "area"` | enum | Tipo de gráfico |
| data | array | no vacío si se renderiza | Serie de datos |
| series | array | claves válidas | Series y etiquetas |
| colors | string[] | tokens de color | Paleta del tema |
| title | string | clave i18n | Título accesible |
| summary | string | clave i18n | Resumen textual para lectores |
| height | number | >= 160 | Altura |

**Validation**:
- Ninguna ruta actual importa `ChartContainer` ni las librerías de gráficos.
- El contenedor usa los tokens del tema resuelto y ofrece un resumen textual accesible.

## Relationships

```text
DesignTokenSet 1 ──< MD3 Color Scheme
DesignTokenSet 1 ──< Typography Scale
ThemePreference 1 ── 1 ThemeProvider
LocalePreference 1 ── 1 TranslationCatalog
TranslationCatalog 1 ──< ErrorKeyMap
AvatarOptionCatalog 1 ──< AvatarConfig
NavigationItem 1 ── 1 RouteDefinition
ComponentSpec 1 ──< ScreenState
ChartContainerProps 1 ── 1 DesignTokenSet (colores)
CurrencyOption 1 ──< CurrencySelection
Family 1 ──< Membership (spec 001)
Family 1 ──< FamilyAction
Invitation 1 ── 1 InvitationCodeView (spec 001)
```

## Persistence Mapping

| Data | Web | Móvil | Backend |
|------|-----|-------|---------|
| Session | `localStorage` (clave existente) | SecureStore (clave existente) | JWT existente |
| Pending invite code | `localStorage` (clave existente) | SecureStore (clave existente) | Código de invitación de spec 001 |
| Theme | `localStorage` + cookie `kitho_theme` | SecureStore `kitho_theme` | No |
| Locale | `localStorage` + cookie `kitho_locale` | SecureStore `kitho_locale` | No |
| Family currency | Estado de la pantalla | Estado de la pantalla | `Family.moneda_local` |
| Invitation code view | No persiste | No persiste | `Invitation.codigo` |
| Family action state | No persiste | No persiste | `Family`/`Membership` de spec 001 |
| Avatar default | `foto_avatar` en sesión y backend | `foto_avatar` en sesión y backend | Campo existente |
| Avatar editor | Estado local (no persiste) | Estado local (no persiste) | No (spec 003) |
| Tokens | Archivos generados versionados | Archivos generados versionados | No |
| Catálogos i18n | `messages/*.json` | `lib/i18n/messages/*.json` | No |

## Generated Artifacts

| Source | Output | Consumer |
|--------|--------|----------|
| `design-tokens/tokens.json` | `frontend-web/lib/design-tokens.generated.ts` | Componentes/charts web |
| `design-tokens/tokens.json` | `frontend-web/styles/tokens.generated.css` | Tailwind/globals |
| `design-tokens/tokens.json` | `frontend-mobile/lib/design-tokens.generated.ts` | Componentes móvil |
| `shared/avatar/avatar-engine.ts` | copia generada en ambos frontends | Avatar web/móvil |
| `shared/avatar/avatar-options.json` | copia generada en ambos frontends | Editor de avatar |
| `shared/currencies/regions.json` | copia generada en ambos frontends | `CurrencySelect` |
| `shared/errors/error-keys.json` | `lib/error-keys.generated.ts` en ambos | Mapeo de errores |

**Validation**: los archivos generados incluyen una cabecera `AUTO-GENERATED` y un hash; el script
`--check` falla si hay deriva.

## Out of Scope (future features)

- Persistencia y subida de la personalización del avatar (spec 003).
- Entidades financieras, transacciones, presupuestos y sus gráficos reales.
- Sincronización de tema/idioma en backend o entre dispositivos.
- Assets definitivos de logo, icono de app y splash.
- Invitaciones por enlace o multi-moneda.
- Cambios de backend propios de 002; las extensiones de spec 001 se consumen tal como se definen
  allí.
