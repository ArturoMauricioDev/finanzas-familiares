# Quickstart: UI, Estilos y Vistas Web y Móvil (Kitho)

**Feature**: 002-ui-styles-and-views  
**Date**: 2026-11-06

## Prerequisites

- Node.js 20+ y pnpm 12+.
- Docker y Docker Compose para el backend existente.
- Credenciales de Google OAuth de la spec 001 (web, Android e iOS).
- Variables de entorno de `frontend-web/.env.local` y `frontend-mobile/.env` ya configuradas.
- Extensiones de backend de la spec 001 aplicadas: código de invitación de un solo uso con
  caducidad de 7 días, soft delete/abandono de familia y reasignación de administrador.

La spec 002 no añade migraciones propias; sin las extensiones de la spec 001, la unión por código y
las acciones de familia no pueden validarse de extremo a extremo.

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
pnpm add i18n-js @expo-google-fonts/inter lucide-react-native victory-native@42.0.1 \
  react-native-nitro-google-signin
npx expo install expo-localization expo-location expo-font expo-splash-screen expo-status-bar \
  expo-system-ui react-native-svg react-native-safe-area-context react-native-reanimated \
  react-native-gesture-handler react-native-worklets react-native-nitro-modules \
  @shopify/react-native-skia
pnpm install
```

**Notas**:

- El proyecto usa **Expo SDK 58** (`expo 58.0.23`, RN `0.88.1`, React `19.3.0`, TypeScript 6).
  Ejecuta `npx expo install --fix` tras actualizar para alinear todos los módulos nativos.
- `victory-native` se fija en `42.0.1`, compatible con Skia `2.14.0` y Reanimated `4.7.1` que
  incluye Expo 58. La 43 exige Skia `>=2.15.1`, fuera de la versión que fija SDK 58.
- `react-native-worklets` es peer obligatorio de Reanimated 4; instálalo con `npx expo install`.
- `@testing-library/react-native` usa la línea `14.1.0`; `render`, `fireEvent` y `rerender` son
  asíncronos y deben esperarse con `await`.
- Expo 58 incluye el plugin de Reanimated/Worklets en `babel-preset-expo`; no se necesita
  `babel.config.js`.
- Si `expo-doctor` rechaza la combinación de Victory Native, mantener la línea 42.x y el contrato
  `ChartContainer`; ninguna ruta actual importa la librería.

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
- copias del motor de avatar, las sugerencias regionales de moneda y el mapa de errores en ambos
  frontends.

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

# Regresión backend (incluye extensiones de spec 001)
docker compose exec backend pytest
```

**Resultado esperado**: todos los comandos terminan con éxito; `check-shared` no detecta deriva y
`check-ui` no detecta imports de gráficos ni literales visuales fuera de las excepciones.

### Autenticación nativa de Google (Nitro)

El login móvil usa `react-native-nitro-google-signin` sobre `react-native-nitro-modules`. En Expo
SDK 58 la New Architecture está activa por defecto, por lo que `app.json` ya no declara
`newArchEnabled` (el esquema de Expo lo rechaza). Para validar en un development build:

```bash
cd frontend-mobile
# Coloca google-services.json (Android) y GoogleService-Info.plist (iOS), ambos en .gitignore
npx expo prebuild --clean
npx expo run:android   # o npx expo run:ios
```

El config plugin aplica Google Services en Android y añade el `REVERSED_CLIENT_ID` como URL scheme
en iOS. El login real no se prueba en Expo Go porque el módulo Nitro exige código nativo.

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
3. Provocar un error de backend conocido (por ejemplo, código de invitación usado o expirado) y
   cambiar de idioma con el error en pantalla.
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
3. Crear un grupo o unirse introduciendo el **código** de invitación.
4. Consultar miembros, generar invitación, copiar el código, promover y expulsar (con confirmación).

**Esperado**: los flujos siguen funcionando; la invitación muestra solo el código y no hay enlace;
los errores conocidos se traducen; las acciones destructivas usan diálogo MD3 accesible, no
`window.confirm`/`Alert.alert`. El onboarding completo desde login hasta grupo creado/unido se
completa en menos de 3 minutos en condiciones normales.

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

### 15. Botón oficial de Google

1. Abrir Login en web y móvil.
2. Comparar el botón con las guías de marca de Google.
3. Provocar carga y estado sin configuración de OAuth.

**Esperado**: fondo blanco/outline, logo G oficial multicolor sin recolorear ni recortar, texto
"Continuar con Google" traducido; nombre accesible y estados disabled/loading; sin imágenes
externas rotas.

### 16. Invitación y unión por código

1. Como administrador, generar una invitación en Miembros.
2. Verificar que se muestra **solo el código**, la vigencia de 7 días y las acciones copiar/compartir
   como texto.
3. Unirse desde otra cuenta introduciendo el código, incluso con minúsculas o espacios.
4. Reintentar el mismo código y probar un código expirado.

**Esperado**: no se muestra ningún enlace ni QR; el código se normaliza; la unión funciona una sola
vez; usado/expirado/inválido muestran errores traducidos y no permiten reintentar con el mismo
código; el código pendiente se limpia al unirse.

### 17. Selector de moneda regional

1. Crear una familia con geolocalización permitida y simular LatAm, Europa y EE.UU.
2. Verificar las 5 sugerencias y que la moneda local aparece primero.
3. Denegar la geolocalización y repetir el alta.
4. Buscar una moneda en **Otros** (por ejemplo, `JPY`) y guardar.
5. Revisar el formato de moneda en la UI.

**Esperado**: exactamente 5 sugerencias por región (`MXN, BRL, ARS, COP, CLP`;
`EUR, GBP, CHF, SEK, PLN`; `USD, CAD, MXN, EUR, GBP`); con permiso denegado se usa el locale y
luego `USD`; **Otros** busca sobre ISO 4217 y no acepta códigos inválidos; la selección es única y
el formato usa la moneda guardada.

### 18. Eliminar y abandonar familia

1. Con una familia de **1 integrante**, comprobar que aparece **Eliminar familia**; confirmar.
2. Verificar la redirección al inicio del flujo principal y que el perfil individual se conserva.
3. Con una familia de **2+ integrantes**, comprobar que solo aparece **Abandonar familia**, también
   para el administrador.
4. Hacer que Padre y Madre abandonen para dejar la familia sin administradores.
5. Cancelar una confirmación y comprobar que no cambia nada.

**Esperado**: Eliminar solo existe con 1 integrante y usa soft delete; con más de 1 solo se puede
abandonar; la reasignación de administrador recae en la membresía con `created_at` más antiguo; la
UI muestra carga/error, no duplica envíos y no ejecuta reglas de dominio por su cuenta.

## Troubleshooting

| Síntoma | Revisión |
|---------|----------|
| Tailwind no aplica estilos | Verificar `postcss.config.mjs`, `@import "tailwindcss"` y que `tokens.generated.css` exista |
| Tema claro parpadea | Verificar cookie `kitho_theme`, script inline y `data-theme` en `<html>` |
| Textos sin traducir | Verificar paridad de claves y que el componente use `t()` |
| Error no traducido | Revisar `shared/errors/error-keys.json` y regenerar |
| Avatar demasiado largo | Simplificar opciones o validar `<=2048`; el editor no persiste en 002 |
| Moneda no preseleccionada | Revisar permiso de geolocalización; el fallback debe usar locale y luego `USD` |
| Faltan sugerencias de moneda | Regenerar `shared/currencies/regions.json` y ejecutar `generate-shared.mjs --check` |
| Código de invitación rechazado | Verificar single-use, caducidad de 7 días y normalización; la validez la decide el backend de spec 001 |
| Error al eliminar/abandonar | Revisar número de integrantes y autorización en backend de spec 001; la UI no decide soft delete |
| `expo-doctor` falla por Victory/Skia | Ejecutar `npx expo install --fix`; mantener `victory-native@42.0.1` compatible con Skia 2.14.0 |
| Web build incluye Recharts | Revisar que solo `components/charts/ChartContainer` importe `recharts` y que use `next/dynamic` |
| Pruebas móviles fallan por RNTL | Usar `@testing-library/react-native@14.1.0` y `await render(...)` / `await fireEvent...(...)` |
| Lint móvil marca `react-hooks/set-state-in-effect` | La regla se dejó como `warn` para los efectos de carga/sincronización de sesión |
| Android: `Error 400: invalid_request` con `redirect_uri=finanzasfamiliares://...` | Usar Google Sign-In nativo (`react-native-nitro-google-signin`) con `google-services.json`; no enviar un esquema personalizado a Google |
| Login Google móvil no resuelve el módulo Nitro | Instalar `react-native-nitro-modules`, habilitar New Architecture y usar un development build (no Expo Go); ejecutar `npx expo install --fix` |

## Definition of Done

- [ ] Tokens generados y sin deriva.
- [ ] Tema claro/oscuro/sistema y locale es/en persistentes.
- [ ] Navegación responsive web y tabs móvil.
- [ ] Pantallas existentes refactorizadas y nuevas vistas implementadas.
- [ ] Avatar por defecto generado y editor con vista previa sin persistencia.
- [ ] Errores mapeados a i18n con fallback.
- [ ] Botón de Google con estilo oficial y logo sin recolorear.
- [ ] Invitación solo por código, de un solo uso y con caducidad de 7 días; sin enlaces.
- [ ] Selector de moneda con 5 sugerencias, geolocalización opcional, fallback locale/USD y **Otros**.
- [ ] Eliminar/Abandonar familia según integrantes, con confirmación y redirección.
- [ ] WCAG 2.1 AA verificado y `jest-axe` sin violaciones críticas.
- [ ] Sin scroll horizontal en 320/600/840/1440 px.
- [ ] Gráficos fuera del bundle inicial.
- [ ] `typecheck`, `lint`, `test` y `build` en verde.
- [ ] Marca Kitho y títulos de tienda consistentes.

## Resultado de validación (2026-11-09)

| Comando | Resultado |
|---------|-----------|
| `node scripts/generate-shared.mjs --check` | 13 archivos generados sin deriva (incluye `currencies.generated.ts`). |
| `node scripts/check-shared.mjs` | Catálogos i18n y artefactos sincronizados. |
| `node scripts/check-ui.mjs` | 105 archivos; sin imports de gráficos fuera de `components/charts/` ni colores literales fuera de excepciones documentadas (incluye `components/charts/` en ambos frontends). |
| Web `pnpm run typecheck` | Sin errores. |
| Web `pnpm run lint` | Sin avisos ni errores. |
| Web `pnpm test` | 19 suites, 104 pruebas correctas (incluye moneda, código de invitación, error inline de código, acciones de familia, `jest-axe`, tema, idioma, navegación, avatar, feedback, gráficos, tokens, i18n y preferencias). |
| Web `pnpm run build` | Compilación de producción correcta; Recharts queda fuera de las rutas actuales. |
| Móvil `pnpm run typecheck` | Sin errores. |
| Móvil `pnpm run lint` | Sin errores (4 avisos de `react-hooks/set-state-in-effect`). |
| Móvil `pnpm test` | 20 suites, 92 pruebas correctas (incluye moneda, código de invitación, error inline de código, acciones de familia, tema, idioma, navegación, avatar, feedback, gráficos, tokens, i18n y preferencias). |
| Móvil `npx expo-doctor` | 20/20 comprobaciones correctas con Expo SDK 58; `expo-location` y `expo-clipboard` instalados. |
| Móvil login Google | `react-native-nitro-google-signin@2.3.1` con `react-native-nitro-modules@0.37.2`; `GoogleOneTapSignIn` (`configure`/`checkPlayServices`/`signIn`/`createAccount`/`presentExplicitSignIn`) y mock de Jest actualizados. |
| Backend `pytest` | 43 pruebas correctas, 2 omitidas (PostgreSQL opcional). |
| Backend `ruff` / `black --check` | Sin errores; formato aplicado. |
| Migración `alembic upgrade/downgrade` | 003 aplicada y revertida correctamente en PostgreSQL. |

**Cierre de convergencia**: el editor de avatar incluye ropa, ojos y color de fondo, y es accesible
desde Perfil y Ajustes; las pantallas móviles respetan las áreas seguras; Guardar solo muestra el aviso
de la spec 003 sin persistir; web respeta `prefers-reduced-motion` y móvil desactiva las
animaciones de diálogos/selectores cuando el sistema lo indica; los fondos de diálogos usan el
token `scrim`; Ajustes muestra el aviso legal; las cadenas de `Spinner`, `Loading`, `Dialog` y
`Breadcrumbs` provienen de i18n.

**Pendiente de validación manual**: auditoría Lighthouse de accesibilidad en Login, Miembros y
Ajustes; recorrido con teclado, zoom de texto al 200 % y movimiento reducido; revisión con
VoiceOver/TalkBack y Accessibility Scanner; comprobación visual de breakpoints
320/600/840/1440 px y paridad web/móvil. Los escenarios manuales de este documento siguen siendo
la referencia para cerrar esas comprobaciones.

**Nota**: la tabla incluye los cambios de botón de Google, invitación por código, selector de moneda
con geolocalización y acciones de familia, además de las extensiones de backend de la spec 001
(código de un solo uso/7 días, soft delete, abandono y reasignación de administrador). Las pruebas
automatizadas cubren los escenarios 15–18 a nivel de componentes/utilidades y API. La validación
manual de accesibilidad y breakpoints (T137/T138) sigue pendiente de ejecución humana.
