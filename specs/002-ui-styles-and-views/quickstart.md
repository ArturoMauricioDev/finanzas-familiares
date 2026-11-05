# Quickstart: UI, Estilos y Vistas Web y Móvil (Kitho)

**Feature**: 002-ui-styles-and-views  
**Date**: 2026-11-04

## Prerequisites

- Node.js 20+ y pnpm 12+.
- Docker y Docker Compose para el backend existente.
- Credenciales de Google OAuth de la spec 001 (web, Android e iOS).
- Variables de entorno de `frontend-web/.env.local` y `frontend-mobile/.env` ya configuradas.

No se requieren migraciones ni cambios de backend.

## Install Dependencies

### Web

```bash
cd frontend-web
pnpm add next-intl lucide-react recharts react-is
pnpm add -D tailwindcss @tailwindcss/postcss jest-axe @types/jest-axe eslint-plugin-jsx-a11y
pnpm add -D @types/react@^19 @types/react-dom@^19
pnpm install
```

### Móvil

```bash
cd frontend-mobile
pnpm add i18n-js @expo-google-fonts/inter lucide-react-native victory-native@41.16.1
npx expo install expo-localization expo-font expo-splash-screen expo-status-bar \
  expo-system-ui react-native-svg react-native-safe-area-context react-native-reanimated \
  react-native-gesture-handler @shopify/react-native-skia
pnpm install
```

**Notas**:

- `victory-native` se fija en `41.16.1`; la 43 exige React 19/RN 0.79+ y no es compatible con Expo
  52.
- `@testing-library/react-native` se mantiene en `12.7.2`; la 14.x exige RN 0.78+.
- Expo 52 incluye el plugin de Reanimated en `babel-preset-expo`; no se necesita `babel.config.js`.
- Si `expo-doctor` rechaza la combinación de Victory Native 41, usar
  `victory-native@36.9.2` como fallback y mantener el contrato `ChartContainer`.

## Generate Shared Artifacts

Desde la raíz del repositorio:

```bash
node scripts/generate-shared.mjs
node scripts/generate-shared.mjs --check
```

Genera:

- `frontend-web/lib/design-tokens.generated.ts`
- `frontend-web/styles/tokens.generated.css`
- `frontend-mobile/lib/design-tokens.generated.ts`
- copias del motor de avatar y del mapa de errores en ambos frontends.

`--check` debe terminar con código 0 y sin diferencias.

## Run

### Backend existente

```bash
docker compose up -d
docker compose exec backend alembic upgrade head
curl http://localhost:8000/health
```

### Web

```bash
cd frontend-web
pnpm run dev
```

Abrir `http://localhost:3000`.

### Móvil

```bash
cd frontend-mobile
pnpm start
```

Abrir en Expo Go o en un development build. Para el avatar y los iconos se usa
`react-native-svg`; Victory Native no se carga en ninguna ruta actual.

## Automated Validation

```bash
# Raíz
node scripts/generate-shared.mjs --check
node scripts/check-shared.mjs
node scripts/check-ui.mjs

# Web
cd frontend-web
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build

# Móvil
cd frontend-mobile
pnpm run typecheck
pnpm run lint
pnpm test
npx expo-doctor

# Regresión backend (sin cambios esperados)
docker compose exec backend pytest
```

**Resultado esperado**: todos los comandos terminan con éxito; `check-shared` no detecta deriva y
`check-ui` no detecta imports de gráficos ni literales visuales fuera de las excepciones.

## Manual Acceptance Scenarios

### 1. Tema inicial y sin parpadeo

1. Configurar el sistema operativo en modo oscuro.
2. Abrir la app web en una ventana nueva y recargar.
3. Abrir la app móvil con `userInterfaceStyle` automático.

**Esperado**: la interfaz aparece directamente en oscuro, sin flash claro. El tema por defecto es
"Sistema".

### 2. Cambio y persistencia de tema

1. Ir a Ajustes → Tema.
2. Seleccionar Claro, luego Oscuro y luego Sistema.
3. Recargar la web y cerrar/abrir la app móvil.

**Esperado**: el tema cambia de inmediato; la elección persiste. Con "Sistema", cambiar el tema del
SO actualiza la app en caliente sin recargar.

### 3. Cambio de idioma y errores

1. Ir a Ajustes → Idioma y seleccionar English.
2. Verificar navegación, formularios, estados vacíos, botones y textos de error visibles.
3. Provocar un error de backend conocido (por ejemplo, invitación expirada) y cambiar de idioma con
   el error en pantalla.
4. Recargar la app.

**Esperado**: el 100% de los textos visibles cambia al inglés sin recargar; el error ya visible
también se traduce; la preferencia persiste. Al volver a Español ocurre lo mismo.

### 4. Navegación web responsive

1. Iniciar sesión con un usuario con perfil y grupo.
2. Probar anchos `1440px`, `840px`, `839px`, `600px`, `599px` y `320px`.
3. Comprobar Inicio, Miembros, Perfil y Ajustes.

**Esperado**:

- `>=840px`: topbar + sidebar con los cuatro destinos.
- `600–839px`: topbar + rail con los cuatro destinos.
- `<600px`: topbar + tabs inferiores Inicio, Miembros, Perfil; Ajustes desde Perfil.
- Sin scroll horizontal; el destino activo se marca y expone `aria-current`.

### 5. Navegación móvil

1. Iniciar sesión con un usuario con grupo.
2. Recorrer las tabs Inicio, Miembros y Perfil.
3. Abrir Ajustes, edición de perfil y editor de avatar desde Perfil.
4. Usar el botón de vuelta de cada pantalla.

**Esperado**: tabs inferiores con tres destinos; Ajustes no aparece como tab; las pantallas del
stack tienen vuelta accesible y vuelven a Perfil si no hay historial.

### 6. Inicio redirige a Miembros

1. Con sesión completa, abrir `/` en web o la tab Inicio en móvil.

**Esperado**: redirección a `/family/members` sin pantalla en blanco.

### 7. Flujos de la spec 001

1. Login con Google.
2. Completar perfil con nombre y avatar por defecto.
3. Crear un grupo o unirse por invitación.
4. Consultar miembros, generar invitación, promover y expulsar (con confirmación).

**Esperado**: los flujos siguen funcionando; los errores conocidos se traducen; las acciones
destructivas usan diálogo MD3 accesible, no `window.confirm`/`Alert.alert`. El onboarding completo
desde login hasta grupo creado/unido se completa en menos de 3 minutos en condiciones normales.

### 8. Avatar por defecto y editor

1. En el onboarding, comprobar que el avatar por defecto aparece y que el perfil se guarda con un
   `foto_avatar` válido.
2. Abrir el editor desde Perfil o Ajustes.
3. Cambiar base, fondo, cabello, ropa, ojos y accesorios.
4. Pulsar Guardar.

**Esperado**: la vista previa se actualiza en menos de 100 ms por interacción; Guardar muestra un
aviso de que la persistencia llega en la spec 003; el avatar guardado no cambia; el data URI por
defecto no supera 2048 caracteres.

### 9. Estados de carga, error y vacío

1. Simular una respuesta lenta y un fallo de red.
2. Abrir una lista sin miembros o sin invitación activa.

**Esperado**: spinner con texto y control deshabilitado; banner inline traducido con `role="alert"`
o `accessibilityLiveRegion`; estado vacío con explicación y acción sugerida. Sin toasts ni
skeletons.

### 10. Accesibilidad

1. Recorrer la web solo con teclado (Tab/Shift+Tab/Enter/Escape/flechas).
2. Ejecutar `pnpm test` (incluye `jest-axe`).
3. Ejecutar Lighthouse (solo accesibilidad) en Login, Miembros y Ajustes y comprobar puntuación
   `>=95` sin violaciones críticas.
4. Usar zoom de texto al 200% y ancho de 320 px.
5. Activar movimiento reducido en el SO.
6. Revisar la app móvil con VoiceOver/TalkBack y Accessibility Scanner.

**Esperado**: foco visible y en orden lógico; diálogos atrapan y devuelven el foco; Escape cierra;
controles con nombre/rol/estado; sin scroll horizontal; animaciones desactivadas o acortadas;
objetivos táctiles de 48 dp; Lighthouse >=95.

### 11. Gráficos fuera del bundle inicial

1. Abrir las rutas actuales con DevTools/Network o el inspector de bundle.
2. Ejecutar `node scripts/check-ui.mjs`.

**Esperado**: Recharts y Victory Native no se cargan en ninguna ruta actual; solo existen en
`components/charts/ChartContainer.*`; el script no detecta imports fuera de esa carpeta.

### 12. Consistencia visual web/móvil

1. Comparar Login, Miembros, Perfil y Ajustes en web y móvil.
2. Revisar jerarquía, colores semánticos, tipografía, espaciado y estados de componentes.

**Esperado**: la misma pantalla mantiene identidad y jerarquía, con adaptaciones nativas de
plataforma y sin divergencias de tokens.

### 13. Marca y metadatos

1. Revisar el wordmark, el título de la pestaña web, el nombre bajo el icono móvil y las pantallas
   Acerca de/Ajustes.
2. Verificar las constantes de títulos de tienda.

**Esperado**: **Kitho** en toda la UI; **Kitho: Tareas y Finanzas Familiares** y **Kitho Family**
como títulos de ficha; sin variantes traducidas ni "Finanzas Familiares" como nombre del producto;
sin imágenes rotas por assets ausentes.

### 14. Sesión expirada

1. Invalidar el token o esperar a que expire.
2. Provocar una petición autenticada.
3. Volver a iniciar sesión.

**Esperado**: redirección a login; tema e idioma se conservan; no se muestran errores técnicos.

## Troubleshooting

| Síntoma | Revisión |
|---------|----------|
| Tailwind no aplica estilos | Verificar `postcss.config.mjs`, `@import "tailwindcss"` y que `tokens.generated.css` exista |
| Tema claro parpadea | Verificar cookie `kitho_theme`, script inline y `data-theme` en `<html>` |
| Textos sin traducir | Verificar paridad de claves y que el componente use `t()` |
| Error no traducido | Revisar `shared/errors/error-keys.json` y regenerar |
| Avatar demasiado largo | Simplificar opciones o validar `<=2048`; el editor no persiste en 002 |
| `expo-doctor` falla por Victory/Skia | Usar el fallback `victory-native@36.9.2` o dejar el contenedor sin importar en rutas actuales |
| Web build incluye Recharts | Revisar que solo `components/charts/ChartContainer` importe `recharts` y que use `next/dynamic` |
| Pruebas móviles fallan por RNTL | Mantener `@testing-library/react-native@12.7.2` con Expo 52 |

## Definition of Done

- [ ] Tokens generados y sin deriva.
- [ ] Tema claro/oscuro/sistema y locale es/en persistentes.
- [ ] Navegación responsive web y tabs móvil.
- [ ] Pantallas existentes refactorizadas y nuevas vistas implementadas.
- [ ] Avatar por defecto generado y editor con vista previa sin persistencia.
- [ ] Errores mapeados a i18n con fallback.
- [ ] WCAG 2.1 AA verificado y `jest-axe` sin violaciones críticas.
- [ ] Sin scroll horizontal en 320/600/840/1440 px.
- [ ] Gráficos fuera del bundle inicial.
- [ ] `typecheck`, `lint`, `test` y `build` en verde.
- [ ] Marca Kitho y títulos de tienda consistentes.

## Resultado de validación (2026-11-05)

| Comando | Resultado |
|---------|-----------|
| `node scripts/generate-shared.mjs --check` | 11 archivos generados sin deriva. |
| `node scripts/check-shared.mjs` | Catálogos i18n y artefactos sincronizados. |
| `node scripts/check-ui.mjs` | 96 archivos; sin imports de gráficos fuera de `components/charts/` ni colores literales fuera de excepciones documentadas. |
| Web `pnpm run typecheck` | Sin errores. |
| Web `pnpm run lint` | Sin avisos ni errores. |
| Web `pnpm test` | 16 suites, 92 pruebas correctas (incluye `jest-axe`, tema, idioma, navegación, avatar, feedback, gráficos, tokens, i18n y preferencias). |
| Web `pnpm run build` | Compilación de producción correcta; Recharts queda fuera de las rutas actuales. |
| Móvil `pnpm run typecheck` | Sin errores. |
| Móvil `pnpm run lint` | Sin avisos ni errores. |
| Móvil `pnpm test` | 17 suites, 81 pruebas correctas (incluye tema, idioma, navegación, avatar, feedback, gráficos, tokens, i18n y preferencias). |
| Móvil `npx expo-doctor` | 18/18 comprobaciones correctas. |

**Cierre de convergencia**: el editor de avatar incluye ropa y ojos; Guardar solo muestra el aviso
de la spec 003 sin persistir; web respeta `prefers-reduced-motion` y móvil desactiva las
animaciones de diálogos/selectores cuando el sistema lo indica; los fondos de diálogos usan el
token `scrim`; Ajustes muestra el aviso legal; las cadenas de `Spinner`, `Loading`, `Dialog` y
`Breadcrumbs` provienen de i18n.

**Pendiente de validación manual**: auditoría Lighthouse de accesibilidad en Login, Miembros y
Ajustes; recorrido con teclado, zoom de texto al 200 % y movimiento reducido; revisión con
VoiceOver/TalkBack y Accessibility Scanner; comprobación visual de breakpoints
320/600/840/1440 px y paridad web/móvil. Los escenarios manuales de este documento siguen siendo
la referencia para cerrar esas comprobaciones.
