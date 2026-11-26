# Copy deck — B1 (Día 1)

**Fecha**: 2026-11-19
**Alcance**: las 5 pantallas de B1. Fuente única: `shared/i18n/{es,en}.json` (generado a
`frontend-web` y `frontend-mobile` con `scripts/generate-shared.mjs`).
**Fuera de alcance**: selector de rol al invitar (B2, `decision-day-one.md` D2).

## Regla que aplica

- D1: la promesa es **organizar a la familia**. Finanzas y presupuestos siempre como "en camino",
  nunca como función disponible.
- D0: sin sesión → login → perfil (si falta) → ciclo de familia. Con familia → Home.
- D2: quien se une **no elige rol**; llega con el código.
- D3: la moneda se explica **antes** de crear.
- D4: solo admin invita; el no-admin ve por qué.

## 1. Bienvenida / login

| Clave | Español | Inglés |
| --- | --- | --- |
| `auth.title` | Kitho | Kitho |
| `auth.subtitle` | El lugar de tu familia para organizarse. Finanzas y presupuestos, en camino. | Your family's place to get organized. Finances and budgets, on the way. |
| `welcome.pointFamily` | Crea tu familia o únete con un código | Create your family or join with a code |
| `welcome.pointRoles` | Cada persona entra con su rol y sus permisos | Everyone joins with their role and permissions |
| `welcome.pointFinance` | Finanzas y presupuestos, en camino | Finances and budgets, on the way |
| `auth.continueWithGoogle` | Continuar con Google | Continue with Google |
| `welcome.trust` | Entras con tu cuenta de Google. No publicamos nada en tu nombre. | You sign in with Google. We never post anything on your behalf. |

Orden en pantalla: promesa → 3 puntos de valor → acción → confianza. Un solo CTA.

## 2. Perfil mínimo

| Clave | Español | Inglés |
| --- | --- | --- |
| `profile.setupTitle` | Completa tu perfil | Complete your profile |
| `profile.setupSubtitle` | Solo necesitamos tu nombre para que tu familia te reconozca. Puedes cambiarlo cuando quieras. | We only need your name so your family can recognize you. You can change it anytime. |
| `profile.displayName` | Nombre de visualización | Display name |
| `profile.saveAndContinue` | Guardar y continuar | Save and continue |

No se promete foto obligatoria: la foto se edita después desde Perfil (`profile.editAvatar`).

## 3. Elegir familia

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.selectTitle` | Empecemos por tu familia | Start with your family |
| `family.selectSubtitle` | Kitho organiza a tu familia en un solo lugar. Las finanzas se activarán en una próxima entrega. | Kitho keeps your family organized in one place. Finances will be enabled in a future release. |
| `family.createHeading` | Crear una familia | Create a family |
| `family.createBody` | Creas la familia, eliges su moneda y quedas como administrador. | You create the family, choose its currency, and become the administrator. |
| `family.createCta` | Crear mi familia | Create my family |

Jerarquía **contextual** (FR-029, decisión 2026-11-19):

| Origen de la persona | Acción primaria | Secundaria |
| --- | --- | --- |
| Llega con código de invitación pendiente | "Unirme con un código" (con el código listo) | "Crear mi familia" |
| Llega sin código | "Crear mi familia" | "Me invitaron / Tengo un código" |

En ambos estados hay **una sola** acción primaria. Quien trae código normalmente no ve esta pantalla:
el login lo lleva directo a "unirme" (FR-030).

Copy adicional:

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.joinWithCodeTitle` | Ya tenemos tu código | We have your code |
| `family.joinWithCodeBody` | Confirma y entras a la familia que te invitó. | Confirm and you join the family that invited you. |
| `family.joinWithCodeCta` | Unirme con mi código | Join with my code |
| `family.invitedHeading` | Me invitaron | I was invited |
| `family.invitedBody` | Si tienes un código de invitación, úsalo aquí. | If you have an invitation code, use it here. |
| `family.invitedCta` | Tengo un código | I have a code |

## 4. Crear familia

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.createTitle` | Crear familia | Create family |
| `family.createSubtitle` | La moneda se elige ahora y se aplica a todos los registros de la familia. No se puede cambiar después. | The currency is chosen now and applies to every record in the family. It cannot be changed later. |
| `family.nameLabel` | Nombre de la familia | Family name |
| `family.currencyLabel` | Moneda local (ISO 4217) | Local currency (ISO 4217) |
| `family.creatorRoleLabel` | Tu rol en la familia | Your role in the family |
| `family.createFamily` | Crear familia | Create family |

La consecuencia de la moneda va en el subtítulo, antes del formulario, no en el error (D3). El botón
usa el término canónico **familia**, nunca "grupo".

## 4b. Home

| Clave | Español | Inglés |
| --- | --- | --- |
| `dashboard.checkInvite` | Agregar integrantes a tu familia | Add members to your family |
| `dashboard.checkInviteDone` | Ya son {count} en la familia | You are already {count} in the family |

## 4c. Crear familia (wizard)

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.wizardProgress` | Paso {current} de {total} | Step {current} of {total} |
| `family.wizardStepAnnounce` | Paso {current} de {total}: {title} | Step {current} of {total}: {title} |
| `family.wizardStepNameTitle` | ¿Cómo se llama tu familia? | What is your family called? |
| `family.wizardStepNameHint` | Entre 1 y 120 caracteres. | Between 1 and 120 characters. |
| `family.wizardStepCurrencyTitle` | Elige la moneda de la familia | Choose the family currency |
| `family.wizardStepRoleTitle` | Tu rol en la familia | Your role in the family |
| `family.wizardRoleHint` | Padre y madre administran con los mismos permisos. | Father and mother administer with the same permissions. |
| `family.wizardSummaryTitle` | Revisa antes de crear | Review before creating |
| `family.wizardSummaryName` | Familia: {name} | Family: {name} |
| `family.wizardSummaryCurrency` | Moneda: {currency} | Currency: {currency} |
| `family.wizardContinue` | Continuar | Continue |
| `family.wizardBack` | Atrás | Back |
| `family.wizardExit` | Salir | Exit |
| `family.wizardExitConfirmTitle` | Descartar la creación | Discard creation |
| `family.wizardExitConfirmBody` | Se perderán los datos que has introducido. | The information you entered will be lost. |
| `family.wizardExitConfirm` | Descartar | Discard |

El paso 2 reutiliza `family.createSubtitle` (consecuencia de la moneda) y las claves `family.currency*`;
el botón final sigue siendo `family.createFamily` ("Crear familia").

## 5. Unirme con un código

| Clave | Español | Inglés |
| --- | --- | --- |
| `invite.title` | Unirme con un código | Join with a code |
| `invite.subtitle` | El código define tu rol en la familia. Pídelo a quien te invitó. | The code sets your role in the family. Ask whoever invited you. |
| `invite.codeLabel` | Código de invitación | Invitation code |
| `invite.codeNotice` | El código es de un solo uso y caduca a los 7 días. | The code is single-use and expires in 7 days. |
| `invite.join` | Unirme a la familia | Join the family |
| `invite.backToSelect` | Volver a selección de grupo | Back to family options |

Eliminado en B1: `invite.familyRoleLabel`, `invite.relationshipLabel`,
`invite.relationshipPlaceholder`. El formulario queda en **un solo campo**.

## 6. Invitar a un integrante (B2)

| Clave | Español | Inglés |
| --- | --- | --- |
| `family.inviteRoleLabel` | Rol de la persona que invitas | Role of the person you invite |
| `family.inviteRoleHint` | Padre y madre administran la familia; el resto entra como miembro. | Father and mother administer the family; everyone else joins as a member. |
| `family.inviteKinshipLabel` | Vínculo familiar | Family relationship |
| `family.inviteKinshipHint` | Cuéntanos cómo se relaciona con la familia. | Tell us how they are related to the family. |
| `family.inviteKinshipRequired` | Indica el vínculo familiar para continuar. | Enter the family relationship to continue. |
| `family.invitationFor` | Invitación para: {role} | Invitation for: {role} |
| `family.invitationExpires` | Caduca el {date} · {days} días restantes | Expires on {date} · {days} days remaining |
| `family.invitationExpiresOne` | Caduca el {date} · 1 día restante | Expires on {date} · 1 day remaining |
| `family.familyRolePadre` | Padre | Father |
| `family.familyRoleMadre` | Madre | Mother |
| `family.familyRoleHijo` | Hijo | Son |
| `family.familyRoleHija` | Hija | Daughter |
| `family.familyRoleTio` | Tío | Uncle |
| `family.familyRoleAbuelo` | Abuelo | Grandfather |
| `family.familyRoleOtro` | Otro | Other |
| `family.memberRole` | Miembro | Member |
| `family.inviteAdminOnly` | Solo quien administra puede invitar. Pídeselo a un administrador de tu familia. | Only an administrator can invite. Ask an administrator in your family. |
| `family.removeConfirmBody` | ¿Dar de baja a {name} del grupo? | Remove {name} from the group? |
| `family.deleteFamilyConfirmBody` | Se eliminará «{family}». Esta acción no se puede deshacer. | «{family}» will be deleted. This action cannot be undone. |
| `family.leaveFamilyConfirmBody` | Dejarás de formar parte de «{family}». Si eres el último administrador, otra persona asumirá el rol automáticamente. | You will leave «{family}». If you are the last administrator, someone else will take over the role automatically. |

El selector inicia en **Hijo** (menor privilegio, R3) y nunca está vacío. `{role}` usa
`family.familyRolePadre|Madre|Hijo|Hija|Tio|Abuelo|Otro`. El campo **Vínculo familiar** solo se
muestra (y se exige) con el rol **Otro**; con cualquier otro rol no se renderiza ni se envía. Las
confirmaciones destructivas nombran siempre el objeto concreto: el nombre de la familia al
eliminarla o abandonarla y el de la persona al darla de baja.
Un código heredado sin rol familiar se muestra como `family.memberRole`, nunca con el parentesco.

## Matriz de estados (B1)

| Estado | Login | Perfil | Elegir | Crear | Unirme |
| --- | --- | --- | --- | --- | --- |
| Carga inicial | `common.validating` | `Loading` | `Loading` | `Loading` | `Loading` |
| Carga de acción | botón deshabilitado | "Guardando..." | — | "Creando..." | "Uniéndome..." |
| Vacío | n/a | nombre precargado si existe | n/a | n/a | n/a |
| Error de acción | `auth.signInFailed` | `profile.saveFailed` | — | `family.createFailed` | `invite.joinFailed` |
| Error de código | — | — | — | — | `errors.details.invalidInvitationCode` / `invitationCodeUsed` / `invitationCodeExpired` |
| Sin permiso | n/a | n/a | n/a | n/a | n/a |
| Éxito | navegación según `useAuthGuard` | → ciclo de familia | → crear/unirse | → Home | → Home |
| Offline | `errors.status.0` + reintentar | idem | idem | idem | idem |

## Verificación

- `node scripts/check-shared.mjs` → artefactos sincronizados.
- `node scripts/check-contrast.mjs` → pares de `tokens.json` con 4.5:1 (texto) y 3:1 (UI).
- `pnpm run typecheck && pnpm run lint && pnpm test` en web y móvil.
- Pruebas de flujo actualizadas: crear familia envía nombre + moneda + rol del creador; unirse envía
  **solo** `codigo`; las confirmaciones destructivas nombran la familia o la persona; la caducidad
  usa singular cuando queda un día.