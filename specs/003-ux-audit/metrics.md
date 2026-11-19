# Métricas UX — Kitho

**Por qué**: hoy no existe ninguna métrica de embudo. Sin línea base, "mejorar el primer día" es
una opinión. Estas son las mínimas para decidir con datos, sin convertir Kitho en un producto de
vigilancia.

## Principios

1. **Sin PII**: nunca emails, nombres, códigos de invitación ni montos.
2. **Mínimo conjunto**: si un evento no cambia una decisión, no se recoge.
3. **Consentimiento y transparencia**: los eventos se declaran en la política de privacidad.
4. **Retención corta**: 90 días para eventos crudos; agregados anónimos después.

## Taxonomía de eventos

| Evento | Cuándo | Propiedades (sin PII) | Decisión que habilita |
| --- | --- | --- | --- |
| `app_open` | arranque | `platform`, `locale`, `theme` | ¿Vuelven? ¿En qué idioma? |
| `login_start` | clic Google | `platform` | Fricción del proveedor |
| `login_success` | token válido | `platform`, `is_returning` | Conversión de login |
| `profile_submit` | guardar perfil | `has_avatar`, `duration_ms` | Coste del paso |
| `family_choice` | crear/unirse | `choice` | Qué camino eligen |
| `family_created` | éxito | `member_count=1` | Activación |
| `family_joined` | éxito | `via_code=true` | Viralidad |
| `home_view` | Home renderizado | `platform`, `checklist_remaining` | **Activación** |
| `checklist_action` | clic en paso pendiente | `step` | Qué paso traba |
| `invite_generated` | código creado | `platform` | Intención de invitar |
| `invite_shared` | copiar/compartir | `channel` | Viralidad real |
| `error_shown` | banner visible | `error_key`, `screen` | Calidad de errores |
| `error_retry` | clic reintentar | `error_key`, `success` | Recuperación |
| `settings_change` | tema/idioma | `setting`, `value` | Uso de preferencias |

**Nunca**: `email`, `user_id` crudo, `family_id` crudo, `invitation_code`, montos, categorías.

## Embudo de activación

```
app_open
  → login_success          (≥ 90%)
  → profile_submit         (≥ 90% de quienes necesitan perfil)
  → family_created|joined  (≥ 85%)
  → home_view              (≥ 80% en <2 min)
  → invite_generated|shared(≥ 40% en la 1.ª sesión)
```

Objetivos acordados en `audit.md` §5. Se miden por plataforma y por cohorte semanal.

## Instrumentación (decisión pendiente)

| Opción | Pros | Contras |
| --- | --- | --- |
| **Umami self-hosted** (recomendada) | Sin cookies, simple, Docker junto al backend | Requiere un contenedor y dominio |
| PostHog Cloud | Embudos y sesiones listos | Más superficie de datos y coste |
| Endpoint propio `POST /events` | Control total, sin terceros | Hay que construirlo y mantenerlo |

Mientras se decide, la línea base sale de `usability-test.md` (5 sesiones). No bloquear UX-01 por
instrumentación: se puede implementar Home y medir después con el primer evento añadido.

## Revisión

- Semanal: embudo y errores.
- Mensual: comparar con objetivos; cerrar o reabrir hallazgos de `audit.md`.
- Cada release de UX-01..UX-03: repetir T1–T3 con 5 participantes.
