# UX Gate — Ciclo de vida de la familia (B2)

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
**Referencia**: `.opencode/skills/kitho-ux/SKILL.md`, `docs/ux-playbook.md`
**Pantallas alcanzadas**: Miembros (generar invitación, mostrar código), Unirse con código, Home
como destino. Login, perfil y selección de familia vienen de B1 y se revisan como regresión.

## 1. Objetivo y jerarquía

- [x] Objetivo del usuario en una frase: invitar a alguien declarando su rol, o entrar con un
      código y quedar con el rol que te dieron.
- [x] Se cumple en <10 s desde que abre la pantalla: **sí** (invitar: un selector + un botón;
      unirse: un campo + un botón).
- [x] Acción primaria (una sola): "Generar invitación" (Miembros) · "Unirme a la familia" (unirse).
- [x] Acciones secundarias: "Volver a selección de grupo", "Reintentar", copiar/compartir código.
- [x] Acciones destructivas: ninguna en este corte. Expulsar/abandonar/eliminar familia
      permanecen en D y ya tienen confirmación que nombra el objeto.

## 2. Estados (marcar implementado o justificar omisión)

| Estado | Cubierto | Nota |
| --- | --- | --- |
| Carga inicial | ☑ | `Loading` con `role="status"` / `accessibilityLiveRegion` |
| Carga de acción (control, no pantalla) | ☑ | Botón con `loading` y deshabilitado |
| Vacío (con CTA) | ☑ | Sin código activo: explica y ofrece generar (FR-027) |
| Error de carga + reintentar | ☑ | `ErrorMessage` con acción; conserva lo último bueno |
| Error de acción local | ☑ | Error de código junto al campo, no en banner lejano |
| Sin permiso (explicado) | ☑ | No admin: línea que dice quién puede invitar y por qué (FR-015) |
| Éxito local | ☑ | Código generado junto al control; estado "Activo" visible |
| Offline / timeout | ☑ | Mensaje distinto del error de servidor + reintentar |

## 3. Copy e i18n

- [x] Español e inglés completos; claves nuevas en `shared/i18n/{es,en}.json`
      (`family.inviteRoleLabel`, `inviteRoleHint`, `invitationFor`, `invitationExpires`,
      `invitationExpiresOne`).
- [x] Sin jerga de modelo: se usa "Rol de la persona que invitas" y los valores Padre/Madre/Hijo/
      Hija; nunca `rol_familiar`, `rol_permiso` ni `parentesco` como etiqueta visible.
- [x] Consecuencias antes de la acción: el selector explica que padre/madre administran.
- [x] Fechas y números con el locale activo: caducidad del código formateada (FR-025).
- [x] Términos consistentes con `specs/002-ui-styles-and-views/spec.md` y `copy-deck-b.md`.

## 4. Accesibilidad (AA)

- [x] Foco visible en todos los interactivos.
- [x] Recorrido completo por teclado; `Esc` cierra diálogos.
- [x] Etiqueta accesible en controles sin texto visible; iconos `aria-hidden`.
- [x] Live region en carga/éxito/error (`role="status"`/`alert`, `accessibilityLiveRegion`).
- [x] Estado seleccionado expuesto en el selector de rol (FR-023).
- [x] Contraste 4.5:1 texto / 3:1 UI y foco con pares `on*`/`*Container` (FR-022).
- [x] Touch ≥ 44 y objetivos no solapados.
- [x] Reduced motion respetado.
- [ ] Zoom 200% y texto grande sin recorte (FR-024). **Pendiente T029**: no hay navegador en este
      entorno. La estructura no fija anchos y `jest-axe` no reporta violaciones, pero falta la
      comprobación visual.

## 5. Sistema visual

- [x] Cero colores, spacing o tipografía fuera de tokens (FR-019).
- [x] Componentes reutilizados de `components/ui` (`Select`, `Field`, `Button`, `Card`,
      `InlineBanner`); sin duplicados.
- [x] Sin temas, paletas ni fuentes paralelas.
- [ ] Responsive verificado: 375 / 768 / 1024 / 1440 (web) e iOS/Android (móvil) (FR-028).
      **Pendiente T029**: requiere navegador y dispositivo/emulador. Base automatizada: clases de
      tokens sin anchos fijos + `check-ui` en 105 archivos.
- [x] Sin cards dentro de cards ni más de 2 líneas por fila en la lista de integrantes (revisión de
      estructura; la confirmación visual va con T029).

## 6. Métricas

- [x] Eventos sin PII: `invite_generated`, `invite_shared`, `family_joined`,
      `error_shown`, `error_retry` (`specs/003-ux-audit/metrics.md`).
- [x] Métrica de éxito: 100% de uniones con el rol declarado (SC-003/SC-004).
- [x] Prueba con 5 personas si cambia el Día 1: sí, ronda 1 de `usability-test.md`.

## 7. Veredicto

- [x] Aprobado para implementar
- [ ] Aprobado con observaciones
- [ ] Rechazado

**Automatizado y en verde (2026-11-19)**: backend 55 passed / 2 skipped; web 127 tests; móvil 128
tests; typecheck y lint sin errores (5 warnings previos de `set-state-in-effect` en móvil);
`check-ui` 105 archivos; `check-shared` sincronizado; migración `005` aplicada y revertida;
`jest-axe` sin violaciones en selección de familia, unirse y Miembros (admin).

**Abierto, no bloquea el código**: T029 (responsive 375/768/1024/1440, zoom 200%, iOS/Android) y T030
(recorrido manual de los escenarios 1–6 con cuentas reales) quedan pendientes porque este entorno no
tiene navegador ni dispositivos. Registro en `audit.md` §8.

**Observaciones abiertas**: enlace visible a privacidad/términos (UX-02.2). La jerarquía de la
pantalla de elegir familia ya está decidida (contextual, FR-029/FR-030) y se verifica en la ronda 1.