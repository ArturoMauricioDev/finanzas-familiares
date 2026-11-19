# Playbook de UX y UI — Kitho

**Autoridad**: este documento operacionaliza la Constitución (`.specify/memory/constitution.md`)
para decisiones de interfaz. No la sustituye. Si hay conflicto, gana la Constitución.
**Ámbito**: web (`frontend-web`) y móvil (`frontend-mobile`).
**Última revisión**: 2026-11-19 · **Versión**: 1.0.0

---

## 1. Cinco principios

1. **El producto se explica en 10 segundos.** Cada pantalla de entrada responde: qué es, para
   quién y qué hago ahora. Si hace falta un tutorial, la pantalla está mal.
2. **Una pantalla, un trabajo.** Si una pantalla tiene dos CTA primarias o tres secciones con el
   mismo peso, está sin diseñar.
3. **El estado del sistema siempre es visible.** Carga, vacío, error, sin permiso y éxito son
   parte del diseño, no casos raros.
4. **El progreso se ve.** Un checklist vale más que una lista de entidades: el usuario sabe qué
   falta y por qué importa.
5. **Todo error tiene salida.** Un mensaje sin acción deja al usuario atrapado. Siempre:
   reintentar, volver o corregir.

---

## 2. Contrato del Día 1

Secuencia canónica, en web y móvil:

```
Entrada (valor + confianza)
  → Google
  → Perfil mínimo (solo lo imprescindible)
  → Elegir: crear familia | unirse con código (con consecuencias)
  → Home (estado + checklist)
  → Invitar (CTA primaria para admin)
```

Contrato de entrada (decidido en `specs/003-ux-audit/decision-day-one.md`, D0):

```
Sin sesión                      → Bienvenida/Login → perfil (si falta) → ciclo de familia
Con sesión y sin familia        → ciclo de familia (select | create | invite). Nunca Home.
Con sesión y con familia        → Home
```

**Alcance**: esta etapa construye el **ciclo de vida de la familia**. Las finanzas se desarrollan
después (spec 004); hasta entonces se anuncian como "en camino" y viven, cuando existan, en Home.
No se simulan datos financieros ni se prometen como disponibles.

Roles y permisos (decidido en D2):

```
Crear familia   → quedas como administrador y eliges padre | madre
Invitar         → quien invita declara el rol de la persona invitada: padre | madre | hijo | hija
Unirse          → no se elige rol: llega con el código
Admin           → solo padre y madre
```

- El rol viaja **con la invitación**, no con quien se une. Ninguna pantalla de unirse pide rol ni
  parentesco.
- El parentesco libre no forma parte del Día 1. La relación visible es el rol familiar.
- Quien no puede invitar ve por qué y quién sí puede; la función no desaparece sin explicación.

Reglas:

- **R1**: ninguna pantalla de entrada pide datos antes de explicar el valor.
- **R2**: solo se piden datos que se usan en la siguiente pantalla. Parentesco, avatar avanzado y
  preferencias van después del primer valor.
- **R3**: "crear" y "unirse" declaran su consecuencia (quién administra, moneda, caducidad).
- **R4**: Home nunca es un redirect.
- **R5**: el checklist de Home tiene como máximo 3 pasos y cada uno enlaza a su acción.
- **R6**: quien ya tiene familia nunca vuelve a ver el ciclo de familia al entrar; quien no la tiene
  nunca llega a Home. La regla vive en `useAuthGuard` (web y móvil), no en cada pantalla.

---

## 3. Jerarquía

- **Una** acción primaria por pantalla. Las secundarias son `tonal`/`secondary`; las destructivas,
  `danger` y nunca adyacentes a la primaria.
- Orden vertical: contexto → estado → acción → detalle → acciones secundarias.
- Encabezados de sección distintos de los encabezados de pantalla: no repetir el mismo texto.
- En listas: máximo 2 líneas por fila. Si necesitas etiquetas de campo (`Parentesco:`, `Permiso:`),
  el copy está mal.
- En ajustes: lista de preferencias (label + control + divisor), no cards apiladas.
- Acciones destructivas: fuera de la pantalla operativa, con confirmación que **nombre** el objeto.

## 4. Copy

- Español por defecto, inglés completo. Nunca una clave sin traducir.
- Verbos en la CTA: "Crear familia", "Unirme con código", "Copiar código".
- Sin jerga del modelo: no `rol_permiso`, no `parentesco`, no `estado: activo`.
- Las consecuencias se dicen antes, no en el diálogo de error.
- Estados vacíos: qué es, por qué está vacío y qué hacer. Con acción.
- Errores: qué pasó, qué puede hacer el usuario, y el detalle técnico solo si ayuda.
- Fechas y números con el locale activo (`lib/format.ts`), nunca concatenados a mano.

## 5. Matriz de estados obligatoria

Toda pantalla nueva o modificada declara estos estados en su spec:

| Estado | Requisito |
| --- | --- |
| Carga inicial | Indicador con `role="status"`/live region; sin saltos de layout |
| Carga de acción | El control muestra progreso y se deshabilita; no se bloquea la pantalla entera |
| Vacío | Título propio + explicación + acción |
| Error de carga | Mensaje + **reintentar**, conservando lo último bueno |
| Error de acción | Mensaje local al control que lo originó |
| Sin permiso | Explica quién puede y por qué; no oculta la función sin más |
| Éxito | Feedback local e inmediato, no un banner lejos del control |
| Offline / timeout | Mensaje distinto de "error del servidor" y opción de reintentar |

## 6. Accesibilidad (WCAG 2.1 AA mínimo)

- Contraste 4.5:1 en texto, 3:1 en componentes y foco. Los pares `on*`/`*Container` de
  `tokens.json` están pensados para esto; no inventar combinaciones.
- Foco visible siempre (`focus-visible` en web; en móvil, estado de foco del control).
- Navegación completa por teclado en web: orden lógico, sin trampas, `Esc` cierra diálogos.
- Etiqueta accesible en todo control sin texto visible; iconos decorativos `aria-hidden`.
- Regiones vivas: `role="status"`/`aria-live="polite"` para carga y éxito;
  `role="alert"`/`assertive` para error.
- Estado seleccionado expuesto (`aria-selected`, `aria-current`, `accessibilityState`), no solo color.
- Touch target ≥ 44 (`tokens.touchTarget.min`).
- Respetar `prefers-reduced-motion` / `useReducedMotion`.
- Soporte de texto grande y zoom 200% sin recorte ni solapamiento.

## 7. Tokens y sistema visual

- `design-tokens/tokens.json` es la **única** fuente de verdad de color, tipografía, spacing,
  radios, elevación, motion y breakpoints.
- Prohibido hex, rgb, px de spacing o tamaños tipográficos crudos en componentes de app.
- Prohibido introducir una paleta, fuente o tema paralelo. Si falta un rol semántico, se añade al
  token y se regeneran los artefactos.
- MD3 + Inter + Lucide es la identidad. No se re-tematiza por moda ni por una skill externa.
- Un componente nuevo se añade al inventario de `components/ui` y se reutiliza; no se duplica con
  otro nombre.

## 8. Densidad y movimiento

- Móvil: una columna, scroll natural, sin cards dentro de cards.
- Web: `compact` <600, `medium` 600–839, `expanded` ≥840; no introducir breakpoints ad hoc.
- Movimiento con propósito (transición de estado, no decoración); duración y easing desde tokens.
- Nada de animaciones que bloqueen interacción; toda animación es cancelable.

## 9. Medición

- Todo flujo nuevo define al menos: entrada, éxito y abandono.
- Sin PII. Ver `specs/003-ux-audit/metrics.md`.
- Un cambio de UX sin métrica o sin prueba con 5 personas es una hipótesis, no una mejora.

## 10. Definición de Hecho (UI)

Una tarea de UI no está hecha hasta que:

- [ ] Los 8 estados de §5 están implementados o justificados por escrito.
- [ ] Copy en es y en, sin claves nuevas sin traducir.
- [ ] Cero valores visuales fuera de tokens.
- [ ] Teclado + foco verificados en web; lector de pantalla verificado en el flujo principal.
- [ ] `typecheck`, `lint` y tests en verde; `jest-axe` sin violaciones.
- [ ] Probado en 375 px, 768 px, 1024 px y 1440 px (web) y en iOS/Android (móvil).
- [ ] Sin regresiones en los flujos de `audit.md` §4.

## 11. Anti-patrones prohibidos

- Pantalla "Inicio" que redirige.
- Tres secciones con el mismo peso en una pantalla operativa.
- `ActivityIndicator` a pantalla completa para una lista que ya tenía datos.
- Mensaje de éxito lejos del control que lo produjo.
- Texto de campo del backend en la UI (`rol_permiso`, `needs_family_setup`).
- Ocultar una función sin explicar el permiso.
- Introducir una skill o generador que proponga otra paleta o tipografía.
- "Ya lo arreglamos en el próximo rediseño" sin ID de hallazgo y criterio de aceptación.
