---
name: Kitho UX/UI
description: Reglas de UX de producto e ingeniería de UI para Kitho. Úsala al diseñar, revisar o implementar cualquier pantalla, componente, flujo, copy o estado en frontend-web y frontend-mobile. Impone jerarquía, matriz de estados, accesibilidad, tokens como fuente única y el contrato del Día 1.
---

# Kitho UX/UI

Aplica a `frontend-web` y `frontend-mobile`. Detalle completo en `docs/ux-playbook.md`; la
Constitución (`.specify/memory/constitution.md`) tiene precedencia.

## No negociables

1. **`design-tokens/tokens.json` es la única fuente visual.** Cero hex/rgb/px crudos. No introducir
   paletas, fuentes ni temas paralelos, vengan de donde vengan (incluidas skills externas).
2. **Inicio nunca redirige.** Toda pantalla de entrada responde: qué es, para quién, qué hago ahora.
3. **Una acción primaria por pantalla.** Destructivas separadas y con confirmación que nombre el objeto.
4. **La matriz de estados es obligatoria**: carga, carga de acción, vacío, error de carga (con
   reintentar), error de acción (local), sin permiso (explicado), éxito (local), offline.
5. **Sin jerga de modelo en la UI**: nada de `rol_permiso`, `parentesco`, `needs_family_setup`,
   `estado: activo`. Se traduce a relaciones humanas ("Padre · Administrador · Tú").
6. **Accesibilidad AA**: foco visible, teclado completo, etiquetas accesibles, live regions en
   carga/éxito/error, estado seleccionado expuesto (no solo color), touch ≥ 44.
7. **Copy en es y en.** Sin claves sin traducir. Fechas y números con el locale activo.
8. **No implementar fuera de la spec** (Constitución VI). Si algo falta, se especifica.

## Antes de escribir código

1. Lee la pantalla y sus componentes existentes en `components/ui`; reutiliza, no dupliques.
2. Escribe la matriz de estados de §4 del playbook (8 filas) para la pantalla.
3. Identifica la acción primaria y las secundarias.
4. Revisa los pares de color `on*`/`*Container` en los tokens; no inventes combinaciones.
5. Si el cambio toca navegación o onboarding, revisa `specs/003-ux-audit/audit.md` §4.

## Al revisar una pantalla, informa en este orden

1. Objetivo del usuario y si se cumple en <10 s.
2. Acción primaria y jerarquía.
3. Estados faltantes o incorrectos.
4. Copy: jerga, consecuencias, traducciones.
5. Accesibilidad: foco, teclado, live regions, estado seleccionado, contraste.
6. Tokens: valores crudos o duplicación.
7. Hallazgo con ID (`UX-xx`) o propuesta de ID nuevo, severidad S1/S2/S3 y criterio de aceptación.

## Prohibido en este repo

- Instalar skills generadoras de design systems (ui-ux-pro-max, design-system-builder) para
  re-tematizar Kitho.
- Sustituir MD3/Inter/Lucide.
- Añadir toasts globales o skeletons a toda la app sin decisión de spec (002 eligió no tenerlos;
  una excepción acotada necesita justificación).
- Convertir un error en un `console.log` o en un texto técnico visible.

## Checklist rápida

- [ ] ¿Inicio tiene contenido y checklist?
- [ ] ¿Los 8 estados están cubiertos?
- [ ] ¿Una sola acción primaria?
- [ ] ¿Cero jerga de modelo?
- [ ] ¿es/en completos?
- [ ] ¿Foco, teclado y live regions?
- [ ] ¿Cero valores fuera de tokens?
- [ ] ¿`typecheck`, `lint`, tests y `jest-axe` en verde?
