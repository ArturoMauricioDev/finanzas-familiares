# Token Contract

**Feature**: 002-ui-styles-and-views  
**Source of truth**: `design-tokens/tokens.json`

## Purpose

Definir el contrato de tokens MD3 que consumen web y móvil, las salidas generadas y las reglas que
impiden que los valores visuales se dupliquen o diverjan.

## Source File

`design-tokens/tokens.json` es el único archivo editable. Los archivos generados no se editan a
mano.

### Required Top-Level Keys

| Key | Type | Required | Notes |
|-----|------|----------|-------|
| `version` | string | Yes | SemVer del conjunto |
| `seedColor` | string | Yes | `#6750A4` |
| `color.light` | object | Yes | Roles semánticos claros |
| `color.dark` | object | Yes | Roles semánticos oscuros |
| `typography` | object | Yes | Escala MD3 |
| `spacing` | object | Yes | Múltiplos de 4 |
| `radius` | object | Yes | Radios |
| `elevation` | object | Yes | Niveles 0–5 |
| `motion` | object | Yes | Duraciones/easings |
| `breakpoints` | object | Yes | `compact`, `medium`, `expanded` |
| `icon` | object | Yes | Tamaños |
| `touchTarget` | number | Yes | `48` |

### Color Roles

Cada tema debe incluir como mínimo:

```text
primary, onPrimary, primaryContainer, onPrimaryContainer,
secondary, onSecondary, secondaryContainer, onSecondaryContainer,
tertiary, onTertiary, tertiaryContainer, onTertiaryContainer,
error, onError, errorContainer, onErrorContainer,
success, onSuccess, successContainer, onSuccessContainer,
warning, onWarning, warningContainer, onWarningContainer,
surface, onSurface, surfaceVariant, onSurfaceVariant,
surfaceContainerLowest, surfaceContainerLow, surfaceContainer,
surfaceContainerHigh, surfaceContainerHighest,
outline, outlineVariant, inverseSurface, inverseOnSurface,
inversePrimary, shadow, scrim
```

### Typography Tokens

Cada token debe incluir `fontFamily`, `fontSize`, `lineHeight`, `fontWeight` y `letterSpacing`.
Los nombres son los de MD3: `displayLarge`, `displayMedium`, `displaySmall`, `headlineLarge`,
`headlineMedium`, `headlineSmall`, `titleLarge`, `titleMedium`, `titleSmall`, `bodyLarge`,
`bodyMedium`, `bodySmall`, `labelLarge`, `labelMedium`, `labelSmall`.

### Other Tokens

- `spacing`: `0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16` (valores en px; la escala base es 4).
- `radius`: `none, xs, sm, md, lg, xl, full`.
- `elevation`: `0–5` con `boxShadow` web y sombra móvil equivalente.
- `motion`: `short`, `medium`, `long`, `easingStandard`, `easingEmphasized`.
- `breakpoints`: `compact: 0`, `medium: 600`, `expanded: 840`.
- `icon`: `sm: 16`, `md: 20`, `base: 24`, `lg: 32`, `xl: 40`, `xxl: 48`.
- `touchTarget`: `48`.

## Generated Outputs

| Output | Platform | Contents |
|--------|----------|----------|
| `frontend-web/lib/design-tokens.generated.ts` | Web | Objeto tipado `tokens` con todos los grupos |
| `frontend-web/styles/tokens.generated.css` | Web | `:root`, `[data-theme="dark"]` y `@theme inline` |
| `frontend-mobile/lib/design-tokens.generated.ts` | Móvil | Objeto tipado `tokens` con todos los grupos |

### Naming

- En JSON y TypeScript se usa `camelCase` (`onPrimary`, `surfaceContainerHigh`).
- En CSS se usa `kebab-case` (`--md-sys-color-on-primary`,
  `--md-sys-color-surface-container-high`).
- En Tailwind se exponen utilidades con guiones (`text-on-surface`, `bg-surface-container-high`,
  `border-outline-variant`) mediante `@theme inline`; `--font-sans` usa la variable
  `--font-inter` que define `next/font/google` en web.
- En web, `fontFamily` se emite como `var(--font-inter), system-ui, ...`; en móvil se emite
  `Inter` y `@expo-google-fonts/inter` registra la familia.

### Web CSS Contract

```css
:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  /* ...todos los roles... */
}

[data-theme="dark"] {
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-on-primary: #381e72;
  /* ...todos los roles... */
}

@theme inline {
  --font-sans: var(--font-inter), system-ui, -apple-system, "Segoe UI", sans-serif;
  --color-primary: var(--md-sys-color-primary);
  --color-on-primary: var(--md-sys-color-on-primary);
  --text-display-large: 57px;
  --text-display-large--line-height: 64px;
  --text-display-large--font-weight: 400;
  --breakpoint-medium: 600px;
  --breakpoint-expanded: 840px;
}

body {
  font-family: var(--font-sans);
}
```

## Generation and Verification

```bash
node scripts/generate-shared.mjs
node scripts/generate-shared.mjs --check
```

- `--check` no escribe archivos; compara byte a byte y falla con un mensaje que indica el archivo y
  el token divergente.
- Los archivos generados incluyen una cabecera `AUTO-GENERATED` con la versión y el hash de la
  fuente.
- El generador valida el esquema antes de escribir.
- El contrato se verifica en `pnpm test` de ambos frontends y en el quickstart.

## Rules

1. Ningún componente puede declarar colores, tamaños tipográficos, espaciados, radios o sombras
   literales; debe consumir tokens, utilidades Tailwind generadas o `useTheme()`.
2. Las excepciones documentadas solo se permiten en archivos generados, pruebas y el motor de
   avatar (que recibe colores desde el catálogo de tokens).
3. Los tokens de color deben mantener pares `on-*` con contraste WCAG AA.
4. Cambiar un token es un cambio de contrato: exige regenerar, ejecutar pruebas visuales y revisar
   las capturas de las pantallas afectadas.
5. Victory Native y Recharts consumen los mismos tokens de color del tema resuelto.

## Validation Checklist

- [ ] `tokens.json` parsea y cumple el esquema.
- [ ] Todos los roles `on-*` existen en claro y oscuro.
- [ ] Los breakpoints son exactamente `0`, `600` y `840`.
- [ ] Los archivos generados están actualizados (`--check`).
- [ ] Web y móvil importan sus archivos generados, no la fuente de la raíz.
- [ ] No hay valores visuales literales fuera de las excepciones permitidas.
