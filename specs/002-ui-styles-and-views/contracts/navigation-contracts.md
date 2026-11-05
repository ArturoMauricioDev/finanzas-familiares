# Navigation Contracts

**Feature**: 002-ui-styles-and-views  
**Scope**: Web (Next.js App Router) y Móvil (Expo Router)

## Purpose

Definir rutas, guards, visibilidad de navegación, comportamiento responsive y redirecciones para
conservar la funcionalidad de la spec 001 y añadir las vistas de la spec 002.

## Route Map

| Route | Web file | Mobile file | Guard | Nav visibility |
|-------|----------|-------------|-------|----------------|
| `/` | `app/(app)/page.tsx` | `app/(app)/(tabs)/index.tsx` | Autenticado + perfil + grupo | Inicio |
| `/auth/login` | `app/(auth)/auth/login/page.tsx` | `app/(auth)/auth/login.tsx` | Público | No |
| `/profile/setup` | `app/(onboarding)/profile/setup/page.tsx` | `app/(onboarding)/profile/setup.tsx` | Autenticado sin perfil | No |
| `/family/select` | `app/(onboarding)/family/select/page.tsx` | `app/(onboarding)/family/select.tsx` | Autenticado con perfil sin grupo | No |
| `/family/create` | `app/(onboarding)/family/create/page.tsx` | `app/(onboarding)/family/create.tsx` | Autenticado con perfil sin grupo | No |
| `/invite` | `app/(onboarding)/invite/page.tsx` | `app/(onboarding)/invite/index.tsx` | Autenticado con perfil sin grupo | No |
| `/family/members` | `app/(app)/family/members/page.tsx` | `app/(app)/(tabs)/family/members.tsx` | Autenticado + grupo | Miembros |
| `/profile` | `app/(app)/profile/page.tsx` | `app/(app)/(tabs)/profile.tsx` | Autenticado + grupo | Perfil |
| `/profile/edit` | `app/(app)/profile/edit/page.tsx` | `app/(app)/profile/edit.tsx` | Autenticado + grupo | No (desde Perfil/Ajustes) |
| `/profile/avatar` | `app/(app)/profile/avatar/page.tsx` | `app/(app)/profile/avatar.tsx` | Autenticado + grupo | No (desde Perfil/Ajustes) |
| `/settings` | `app/(app)/settings/page.tsx` | `app/(app)/settings.tsx` | Autenticado + grupo | Web: Sí; móvil: desde Perfil |

**Nota**: los route groups de Next.js y Expo Router no añaden segmentos a la URL, por lo que las
rutas existentes de la spec 001 se conservan. En `(tabs)/_layout.tsx`, los nombres de ruta son
`index`, `family/members` y `profile` (sin el grupo `(tabs)`).

## Redirect Matrix

| Situation | Destination |
|-----------|-------------|
| No hay sesión | `/auth/login` |
| Sesión sin perfil | `/profile/setup` |
| Sesión con perfil y sin grupo, sin invitación pendiente | `/family/select` |
| Sesión con perfil y sin grupo, con invitación pendiente | `/invite` |
| Sesión con perfil y grupo, ruta `/` | `/family/members` |
| Sesión con perfil y grupo en `/family/select`, `/family/create` o `/invite` | `/family/members` |
| Sesión sin perfil en cualquier ruta protegida | `/profile/setup` |
| Sesión sin grupo en una ruta que requiere grupo | `/invite` o `/family/select` |
| `401` en una petición autenticada | Limpiar sesión y `/auth/login` |
| `403` por inconsistencia de grupo | Refrescar sesión; si sigue sin grupo, `/family/select`; si no, mostrar error |
| Logout confirmado | Limpiar sesión y `/auth/login`; conservar tema e idioma |
| Invitación inválida/expirada | Mostrar error, limpiar token pendiente y quedarse en `/invite` |
| Guardar avatar en 002 | Aviso inline; no navegar ni persistir |

## Navigation Visibility

### Web `>=840px` (expanded)

- Topbar con wordmark, título de sección y menú de usuario.
- Sidebar persistente con Inicio, Miembros, Perfil y Ajustes.
- El destino activo se marca visualmente y con `aria-current="page"`.

### Web `600–839px` (medium)

- Topbar con wordmark y menú de usuario.
- Rail con iconos y etiquetas cortas para Inicio, Miembros, Perfil y Ajustes.
- El rail no se superpone al contenido; el layout reserva su ancho.

### Web `<600px` (compact)

- Topbar con wordmark y menú de usuario.
- Tabs inferiores con Inicio, Miembros y Perfil.
- Ajustes se alcanza desde Perfil; no se muestra como tab.
- El contenido reserva espacio inferior para las tabs y el área segura.

### Móvil

- Tabs inferiores con Inicio, Miembros y Perfil.
- Ajustes, edición de perfil y editor de avatar se abren como pantallas del stack con botón de
  vuelta.
- El header de pantalla es propio (no se usa el header nativo) para mantener MD3.

## Active State Rules

- `/family/members` activa Miembros.
- `/profile`, `/profile/edit` y `/profile/avatar` activan Perfil.
- `/settings` activa Ajustes en web; en móvil no hay tab activo de Ajustes.
- `/` se considera Inicio mientras redirige; después se activa Miembros.
- El estado activo se expone con `aria-current="page"` (web) y `accessibilityState={{ selected }}`
  o `accessibilityRole="tab"` (móvil).

## Back Navigation

- Web: el menú de usuario y las acciones de Perfil/Ajustes usan navegación directa; el botón de
  vuelta del navegador debe funcionar.
- Móvil: el header de Ajustes, edición de perfil y avatar muestra un botón de vuelta; si no hay
  historial, navega a Perfil.
- En `/invite`, volver cuando se descarta el token pendiente pide confirmación; si el token se
  conserva, no.
- El diálogo de confirmación de logout no navega hasta confirmar.
- El editor de avatar no persiste; si hay cambios locales, volver muestra confirmación antes de
  descartarlos. Sin cambios, vuelve directamente.

## Session and Preference Persistence

- La sesión se conserva con las claves existentes de la spec 001.
- Tema e idioma se conservan en `kitho_theme` y `kitho_locale`.
- Cerrar sesión o recibir `401` no borra las preferencias.
- El token de invitación pendiente se conserva con la clave existente y se limpia al unirse o al
  detectar que la invitación ya no aplica.

## Accessibility Contract

- El shell incluye un skip link "Saltar al contenido" en web.
- La navegación usa `<nav aria-label>` con etiquetas traducidas.
- Los tabs inferiores móviles exponen `accessibilityRole="tab"` y estado seleccionado.
- El foco se mueve al título de la pantalla al navegar en móvil cuando sea necesario para lectores
  de pantalla.
- Los diálogos atrapan el foco y lo devuelven al elemento de origen.
- Escape cierra diálogos y menús en web.

## Validation Checklist

- [ ] Las URLs de la spec 001 no cambian.
- [ ] `/` redirige a `/family/members` con sesión completa.
- [ ] Los guards respetan el orden login → perfil → grupo → miembros.
- [ ] La navegación web cambia a sidebar/rail/tabs en 840/600 px.
- [ ] En web compacta y móvil, Ajustes solo se alcanza desde Perfil.
- [ ] El tema y el idioma persisten tras logout y `401`.
- [ ] El foco y `aria-current`/estado seleccionado son correctos.
