# UX Gate — [FEATURE]

Copia esta checklist dentro de la spec de la feature y complétala antes de pasar a `plan`/`tasks`.
No es opcional si la feature toca UI. Referencia: `docs/ux-playbook.md`.

## 1. Objetivo y jerarquía

- [ ] Objetivo del usuario en una frase: ___
- [ ] Se cumple en <10 s desde que abre la pantalla: sí / no / con ayuda
- [ ] Acción primaria (una sola): ___
- [ ] Acciones secundarias: ___
- [ ] Acciones destructivas (nombre del objeto en la confirmación): ___

## 2. Estados (marcar implementado o justificar omisión)

| Estado | Cubierto | Nota |
| --- | --- | --- |
| Carga inicial | ☐ | |
| Carga de acción (control, no pantalla) | ☐ | |
| Vacío (con CTA) | ☐ | |
| Error de carga + reintentar | ☐ | |
| Error de acción local | ☐ | |
| Sin permiso (explicado) | ☐ | |
| Éxito local | ☐ | |
| Offline / timeout | ☐ | |

## 3. Copy e i18n

- [ ] Español e inglés completos; ninguna clave nueva sin traducir
- [ ] Sin jerga de modelo (`rol_permiso`, `parentesco`, `needs_*`, `estado: activo`)
- [ ] Las consecuencias se explican antes de la acción
- [ ] Fechas/números con el locale activo
- [ ] Términos consistentes con `specs/002-ui-styles-and-views/spec.md`

## 4. Accesibilidad (AA)

- [ ] Foco visible en todos los interactivos
- [ ] Recorrido completo por teclado; `Esc` cierra diálogos
- [ ] Etiqueta accesible en controles sin texto visible
- [ ] Live region en carga/éxito/error
- [ ] Estado seleccionado expuesto, no solo por color
- [ ] Contraste 4.5:1 texto / 3:1 UI y foco, usando pares `on*`/`*Container`
- [ ] Touch ≥ 44 y targets no solapados
- [ ] Reduced motion respetado

## 5. Sistema visual

- [ ] Cero colores, spacing o tipografía fuera de tokens
- [ ] Componentes reutilizados de `components/ui` (sin duplicados)
- [ ] Sin temas, paletas ni fuentes paralelas
- [ ] Responsive verificado: 375 / 768 / 1024 / 1440 (web) e iOS/Android (móvil)
- [ ] Sin cards dentro de cards ni más de 2 líneas por fila en listas

## 6. Métricas

- [ ] Evento(s) de entrada, éxito y abandono definidos (sin PII)
- [ ] Métrica de éxito de la feature: ___
- [ ] Prueba con 5 personas si cambia el Día 1

## 7. Veredicto

- [ ] Aprobado para implementar
- [ ] Aprobado con observaciones (listar)
- [ ] Rechazado: falta ___ (no pasar a `tasks`)
