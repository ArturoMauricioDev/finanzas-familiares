# i18n and Error Contract

**Feature**: 002-ui-styles-and-views  
**Locales**: `es` (default), `en`

## Purpose

Definir catálogos, claves, persistencia, formato y mapeo de errores para que web y móvil muestren
los mismos textos y actualicen la interfaz sin cadenas residuales.

## Catalogs

| Platform | Files |
|----------|-------|
| Web | `frontend-web/messages/es.json`, `frontend-web/messages/en.json` |
| Móvil | `frontend-mobile/lib/i18n/messages/es.json`, `frontend-mobile/lib/i18n/messages/en.json` |

Los catálogos son equivalentes en claves. Los textos pueden diferir ligeramente por longitud de
plataforma, pero no en significado.

### Namespaces

| Namespace | Contents |
|-----------|----------|
| `common` | Acciones, estados, navegación, errores genéricos |
| `auth` | Login, Google, sesión |
| `profile` | Perfil, edición, datos del usuario |
| `family` | Selección, creación, moneda, límites |
| `invite` | Invitación, token, parentesco |
| `members` | Lista, roles, promoción, expulsión, invitación |
| `settings` | Tema, idioma, logout, acerca de, versión, legal |
| `avatar` | Editor, opciones, aviso de guardado |
| `errors` | Claves de error mapeadas y de estado |
| `a11y` | Nombres accesibles, skip link, anuncios |
| `legal` | Texto provisional de aviso legal |

### Key Naming

- `namespace.section.key` en `camelCase`: `members.actions.promote`,
  `settings.theme.options.system`.
- Las claves de error usan `errors.<slug>`: `errors.auth.invalidGoogleToken`,
  `errors.invite.expired`.
- Las claves de estado HTTP usan `errors.status.<code>`: `errors.status.401`.
- Las claves de accesibilidad usan `a11y.<context>.<purpose>`.
- No se usan claves dinámicas construidas con texto visible; las claves son estables.

## Error Mapping

`shared/errors/error-keys.json` es la fuente compartida. Ejemplo:

```json
{
  "details": {
    "Invalid Google token": "errors.auth.invalidGoogleToken",
    "Invalid refresh token": "errors.auth.expiredSession",
    "Missing authentication token": "errors.auth.missingToken",
    "Invalid or expired token": "errors.auth.expiredSession",
    "Invalid token type": "errors.auth.invalidSession",
    "Invalid token payload": "errors.auth.invalidSession",
    "User not found": "errors.auth.userNotFound",
    "User already belongs to a family": "errors.family.alreadyMember",
    "User does not belong to a family": "errors.family.noFamily",
    "Family not found": "errors.family.notFound",
    "Only admins can manage members": "errors.members.adminOnly",
    "Member not found": "errors.members.notFound",
    "Admins cannot remove themselves": "errors.members.cannotRemoveSelf",
    "A family must keep at least one admin": "errors.members.keepAdmin",
    "Only admins can create invitations": "errors.invite.adminOnly",
    "Invalid invitation token": "errors.invite.invalid",
    "Invitation already used": "errors.invite.used",
    "Invitation expired": "errors.invite.expired",
    "Invitation family not found": "errors.invite.familyNotFound",
    "Family has reached maximum member limit": "errors.family.memberLimit",
    "A user account with this email already exists": "errors.auth.emailExists",
    "Family could not be created due to a conflict": "errors.family.createConflict",
    "Invitation could not be completed due to a conflict": "errors.invite.joinConflict"
  },
  "statuses": {
    "0": "errors.network",
    "400": "errors.status.400",
    "401": "errors.status.401",
    "403": "errors.status.403",
    "404": "errors.status.404",
    "409": "errors.status.409",
    "422": "errors.status.422"
  }
}
```

El generador copia el mapa a `lib/error-keys.generated.ts` en ambos frontends.

### Resolution Order

1. Si el detalle del backend coincide con una entrada de `details`, usar esa clave.
2. Si el detalle es un objeto con `message` y coincide, usar esa clave.
3. Si no hay coincidencia, usar `errors.status.<status>` si existe.
4. Si no existe, usar el texto del backend como `fallback`.
5. Si no hay texto, usar `errors.unexpected`.

Los errores de configuración del cliente (`ConfigurationError`) no vienen del backend y también
usan claves i18n (`errors.config.missingApiUrl`, `errors.config.missingGoogleClientId`), sin
exponer nombres de variables ni detalles técnicos al usuario.

Si `detail` es un array (por ejemplo, errores de validación 422 de Pydantic) o un objeto sin
`message` string, no se serializa como texto visible: `fallbackDetail` queda vacío y se usa
`errors.status.<status>`.

### Error Descriptor

`ApiError` expone `status`, `messageKey` y `fallbackDetail`. La UI guarda
`{ key, fallback, status }` y traduce en render:

```ts
const text = descriptor.key ? t(descriptor.key) : descriptor.fallback;
```

Esto garantiza que un cambio de idioma actualice errores ya visibles.

## Persistence

| Preference | Web | Móvil | Default |
|------------|-----|-------|---------|
| Locale | `localStorage` + cookie `kitho_locale` | SecureStore `kitho_locale` | `es` |
| Theme | `localStorage` + cookie `kitho_theme` | SecureStore `kitho_theme` | `system` |

- Las cookies usan `Path=/`, `SameSite=Lax`, `Max-Age=31536000` y `Secure` cuando la app se sirve
  por HTTPS.
- El locale de la cookie se usa para el `lang` inicial de la página.
- El tema de la cookie se usa para el `data-theme` inicial.
- Cerrar sesión o recibir `401` no borra estas preferencias.

## Formatting

- Moneda: `Intl.NumberFormat(locale, { style: "currency", currency: family.moneda_local })`.
- Números: `Intl.NumberFormat(locale)`.
- Fechas: `Intl.DateTimeFormat(locale, options)`.
- El locale de formato es el idioma activo (`es`/`en`), no el locale del dispositivo.
- `expo-localization` aporta la región/configuración regional en móvil; no cambia el idioma
  inicial.
- Los montos futuros respetan `DECIMAL` con 2 decimales; esta feature solo formatea valores
  existentes.

## Brand Exception

El nombre **Kitho** no se traduce ni se adapta. Los títulos de tienda son constantes de marca:

- España/Latam: **Kitho: Tareas y Finanzas Familiares**
- EE.UU./Global: **Kitho Family**

"Finanzas Familiares" solo puede aparecer como descriptor de categoría en la ficha España/Latam,
nunca como nombre del producto.

## Validation Checklist

- [ ] `es` y `en` tienen exactamente las mismas claves.
- [ ] Web y móvil tienen exactamente las mismas claves.
- [ ] Todos los detalles conocidos del backend tienen clave.
- [ ] Los errores no mapeados usan el fallback sin romper la UI.
- [ ] Cambiar de idioma actualiza textos y errores visibles sin recargar.
- [ ] La preferencia persiste tras recarga, logout y `401`.
- [ ] No hay textos hardcodeados salvo "Kitho" y valores técnicos.
- [ ] Fechas, números y moneda usan `Intl` y la moneda del grupo.
