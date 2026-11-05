# UI Contracts

**Feature**: 002-ui-styles-and-views  
**Platforms**: Web (React/Tailwind) y Móvil (React Native/StyleSheet)

## Purpose

Definir la API compartida por nombre, las variantes, los estados y los requisitos de accesibilidad
de los componentes MD3. La implementación es nativa por plataforma, pero el contrato es el mismo.

## General Rules

- Todos los componentes consumen tokens; no aceptan colores literales como API pública.
- Todo control interactivo expone nombre accesible, rol y estado.
- El foco visible usa un anillo de 2 px con offset y el color `primary`.
- Los objetivos táctiles miden al menos `48x48dp`.
- `disabled`, `loading`, `error` y `focus` son estados obligatorios cuando aplican.
- Las animaciones respetan `prefers-reduced-motion`/movimiento reducido.
- Los textos visibles provienen de i18n; "Kitho" es la única excepción de marca.

## Form Components

### Button

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `"filled" \| "tonal" \| "outlined" \| "text" \| "danger"` | `filled` | Variantes MD3 |
| `size` | `"sm" \| "md" \| "lg"` | `md` | `sm` puede verse a 40, pero el área táctil es 48; md/lg miden 48 |
| `loading` | boolean | false | Muestra spinner y deshabilita |
| `icon` | LucideIcon | none | Icono inicial |
| `fullWidth` | boolean | false | Ocupa el ancho disponible |
| `disabled` | boolean | false | Estado nativo |

**Accessibility**: `role="button"`, nombre desde el contenido o `aria-label`, `aria-busy` cuando
`loading`, foco visible, no usable si `disabled`.

### IconButton

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | string | required | Nombre accesible obligatorio |
| `icon` | LucideIcon | required | Icono |
| `variant` | `"standard" \| "filled" \| "tonal" \| "outlined"` | `standard` | Variantes |
| `size` | `"sm" \| "md" \| "lg"` | `md` | El área táctil siempre es 48 |

**Accessibility**: `aria-label`/`accessibilityLabel` obligatorio; tooltip web opcional.

### TextField

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | string | required | Etiqueta visible |
| `hint` | string | none | Texto de ayuda |
| `error` | string | none | Error inline |
| `required` | boolean | false | Marca requerido |
| `multiline` | boolean | false | Área de texto |
| `leadingIcon` | LucideIcon | none | Icono inicial |
| `trailingIcon` | LucideIcon | none | Icono final |
| `disabled` | boolean | false | Estado |

**Accessibility**: `label` asociada por `id`/`htmlFor` o `accessibilityLabel`; `aria-describedby`
para hint/error; `aria-invalid` cuando hay error; el error se anuncia con `role="alert"` o
`accessibilityLiveRegion`.

### Select

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | string | required | Etiqueta |
| `options` | `{ value, label }[]` | required | Opciones |
| `value` | string | required | Selección |
| `onChange` | function | required | Cambio |
| `error` | string | none | Error |
| `disabled` | boolean | false | Estado |

**Accessibility**: web usa `<select>` nativo estilizado; móvil usa un modal/lista accesible con
`accessibilityRole="button"` y opciones con rol de radio o menú. Siempre expone etiqueta.

### Checkbox / Radio / Switch

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `checked` | boolean | required | Estado |
| `onChange` | function | required | Cambio |
| `label` | string | required | Etiqueta |
| `disabled` | boolean | false | Estado |
| `error` | string | none | Error |

**Accessibility**: `role="checkbox"`/`radio`/`switch`, `aria-checked`, etiqueta asociada, área
táctil 48.

### GoogleSignInButton

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `onPress` | function | required | Inicia OAuth |
| `loading` | boolean | false | Spinner y deshabilitado |
| `disabled` | boolean | false | Sin configuración/cliente |

**Accessibility**: nombre accesible traducido (por ejemplo, "Continuar con Google"), rol de botón,
estado `busy` al cargar. En web se usa el botón oficial de Google Identity Services
(`GoogleLogin` con `locale`, `shape="pill"`, `size="large"`, `text="continue_with"`) dentro de un
contenedor MD3; no se recolorea ni se sustituye el icono oficial. En móvil se usa un `Pressable`
MD3 con el icono oficial como SVG inline. Ninguna plataforma depende de assets externos ni muestra
una imagen rota.

### SearchField

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `value` | string | required | Texto |
| `onChange` | function | required | Cambio |
| `placeholder` | string | required | Clave i18n |
| `onClear` | function | none | Acción de limpiar |

**Accessibility**: `role="searchbox"`, botón de limpiar con nombre accesible.

## Content Components

### Card

Variantes `elevated`, `filled`, `outlined`; contenedor semántico (`<section>` web, `View` móvil con
`accessibilityRole="summary"` solo si es interactiva). No debe ser clickable sin un control interno
accesible.

### List / ListItem

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | string | required | Texto principal |
| `subtitle` | string | none | Texto secundario |
| `leading` | ReactNode | none | Avatar/icono |
| `trailing` | ReactNode | none | Acción |
| `selected` | boolean | false | Estado |
| `onPress` | function | none | Si existe, el ítem es interactivo |

**Accessibility**: si es interactivo, `role="button"`/`accessibilityRole="button"`, nombre
accesible y estado `selected` expuesto. Los divisores son decorativos (`aria-hidden`).

### Avatar

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `src` | string | none | `foto_avatar` (URL/data URI) |
| `config` | AvatarConfig | none | Para vista previa generada |
| `name` | string | none | Fallback de iniciales |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `md` | 32/40/48/64 |
| `alt` | string | none | Descripción; vacío si decorativo |

**Accessibility**: si transmite información, `alt`/`accessibilityLabel`; si es decorativo, vacío y
oculto a lectores.

### AvatarEditor

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `initialConfig` | AvatarConfig | required | Configuración de partida |
| `onChange` | `(config) => void` | none | Notifica cambios para vista previa |
| `onSave` | `(config) => void` | required | Muestra aviso de que el guardado llega en 003 |
| `onCancel` | `() => void` | required | Descarta; confirma si hay cambios |

**Accessibility**: cada opción (fondo, piel, pelo, ropa, accesorios) tiene etiqueta y estado
seleccionado; la vista previa tiene descripción textual; los botones Guardar/Cancelar son
alcanzables por teclado y lectores; el aviso de guardado se anuncia como `status`. La vista previa
se actualiza en `<100 ms` y no sube archivos ni persiste en 002.

### Chip / Badge / Divider

- `Chip`: variantes `assist`, `filter`, `input`, `suggestion`; seleccionable con `aria-pressed`.
- `Badge`: rol `status` solo si cambia dinámicamente; color semántico.
- `Divider`: decorativo, `aria-hidden`/`accessible={false}`.

### Wordmark

Texto "Kitho" con tipografía de marca, sin imagen. Si no hay assets definitivos, no renderiza
`<img>` ni placeholders vacíos.

## Feedback Components

### InlineBanner

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `"info" \| "success" \| "warning" \| "error"` | `info` | Color semántico |
| `title` | string | none | Título opcional |
| `message` | string | required | Texto traducido |
| `action` | ReactNode | none | Acción opcional |

**Accessibility**: `error` usa `role="alert"`; `success`/`info` usan `role="status"` o
`aria-live="polite"`; móvil usa `accessibilityLiveRegion="polite"`/`"assertive"`.

### Spinner

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | string | required | Texto traducido |
| `size` | `"sm" \| "md" \| "lg"` | `md` | Tamaño |

**Accessibility**: `role="status"`, texto visible u oculto; el control que inició la operación
queda `aria-busy` y deshabilitado.

### Dialog / ConfirmDialog

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `open` | boolean | required | Estado |
| `title` | string | required | Título |
| `description` | string | none | Descripción |
| `confirmLabel` | string | required | Acción principal |
| `cancelLabel` | string | required | Cancelar |
| `destructive` | boolean | false | Estilo danger |
| `onConfirm` | function | required | Acción |
| `onCancel` | function | required | Cierre |

**Accessibility**: web usa `<dialog>` nativo con `showModal()`, foco atrapado, Escape y retorno de
foco; móvil usa `Modal` con `accessibilityViewIsModal`, foco inicial en el título y cierre
accesible. No se usan `window.confirm`/`Alert.alert` para acciones destructivas.

### Menu

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `trigger` | ReactNode | required | Botón |
| `items` | `{ id, label, icon?, onSelect }[]` | required | Acciones |
| `align` | `"start" \| "end"` | `end` | Alineación |

**Accessibility**: `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`, navegación con flechas,
Home/End, Escape y retorno de foco.

### EmptyState

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | string | required | Título |
| `description` | string | required | Explicación |
| `action` | ReactNode | none | Acción sugerida |
| `icon` | LucideIcon | none | Icono |

**Accessibility**: título como encabezado, descripción legible, acción con nombre accesible.

## Navigation Components

### TopAppBar

- Web: `<header>` con wordmark, título de sección y menú de usuario.
- Móvil: `<ScreenHeader>` con título, botón de vuelta opcional y acción.
- El botón de vuelta tiene nombre accesible y vuelve a la pantalla anterior; si no hay historial,
  va a Perfil.

### Sidebar / Rail / BottomTabs

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `items` | NavigationItem[] | required | Destinos |
| `activeId` | string | required | Activo |
| `onNavigate` | function | required | Navegación |

**Accessibility**: `<nav aria-label>`; el activo usa `aria-current="page"`; los tabs inferiores
usan `accessibilityRole="tab"` y `accessibilityState={{ selected }}`. En web compacta, Ajustes no
aparece como tab; se llega desde Perfil.

### Tabs (contenido)

`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`; flechas para mover foco. No se
usan para navegación entre rutas (para eso, enlaces con `aria-current`).

### Breadcrumbs

Solo cuando haya jerarquía real; `<nav aria-label>` y el último elemento con `aria-current="page"`.
No se muestran en las rutas actuales si no aportan.

## Layout Components

### Page / Screen

- Web: `<main id="main">` con ancho máximo y padding responsive; skip link al inicio.
- Móvil: `ScrollView`/`View` con `SafeAreaView`, `paddingTop` de header y `paddingBottom` de tabs.
- Sin scroll horizontal a 320 px; textos largos con `min-w-0`/`flexShrink`.

### ScreenHeader

Título, subtítulo opcional, acción de vuelta y acciones. Usa tokens de top app bar y respeta el
área segura.

### AppShell

Web: topbar + sidebar/rail/bottom tabs según breakpoint. Móvil: `Stack` + `Tabs`. El shell no
renderiza navegación en `(auth)`/`(onboarding)`.

## Screen Contracts

| Screen | Required composition | States |
|--------|----------------------|--------|
| Login | Wordmark, `GoogleSignInButton`, InlineBanner | Loading, config error, auth error |
| Profile setup | TextField, `Avatar`/preview, default avatar, submit | Loading, validation, error, success redirect |
| Family select/create | Card, form, `Select` for currency, primary/secondary actions | Loading, validation, conflict, error |
| Invite | Invitation summary, parentesco field, join/back actions | Loading, expired/invalid empty/error, success |
| Members | List/ListItem with role and limit, invite card, actions | Loading, empty, error, destructive confirm |
| Home | Redirect only, Spinner + text while resolving | Loading, redirect |
| Profile | Avatar, name/email, edit profile, edit avatar, settings link | Loading, error |
| Settings | Theme radio, language `Select`, edit profile, avatar, about/version/legal (versión desde `package.json`/`app.json`), logout | Loading, error, destructive confirm |
| Profile edit | Form with name, current avatar + link to editor, save/cancel | Loading, validation, error, success |
| Avatar editor | `AvatarEditor` with preview and option controls | Idle, changed, save notice, discard confirm |

Los textos de todas las pantallas provienen de i18n. Las acciones destructivas usan
`ConfirmDialog`; los errores de red usan InlineBanner con reintento cuando exista una acción
repetible.

## State and Feedback Contract

| State | Required UI |
|-------|-------------|
| Loading | Spinner con texto y control deshabilitado |
| Error | InlineBanner `error` con clave i18n o fallback; reintento si aplica |
| Success | InlineBanner `success` anunciado |
| Empty | EmptyState con explicación y acción sugerida |
| Disabled | Opacidad y `disabled`, sin foco |
| Focus | Anillo visible de 2 px |
| Reduced motion | Sin animaciones o duración 0 |

## Platform Notes

- Web usa HTML semántico, Tailwind y `<dialog>` nativo.
- Móvil usa `Pressable`, `TextInput`, `Modal`, `accessibilityRole` y `react-native-svg`.
- Las diferencias de implementación no cambian nombres, variantes ni estados del contrato.
