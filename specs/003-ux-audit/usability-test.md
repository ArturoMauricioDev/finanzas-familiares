# Pruebas de usabilidad — Día 1 de Kitho

**Objetivo**: saber qué entiende y qué consigue una persona nueva en sus primeros 10 minutos, sin
explicarle la app.
**Participantes**: 5. **Duración**: 25 min. **Formato**: remoto o presencial, con moderador.
**Cuándo**: antes de implementar UX-01/UX-02, para tener línea base; repetir después con 5 nuevos.

---

## 1. Reglas del moderador

- No expliques la app. Si preguntan "¿qué hago?", responde: "¿qué harías tú?".
- No defiendas el diseño ni pidas disculpas por él.
- Silencio productivo: deja 10 s antes de rescatar a alguien.
- Registra citas literales, no interpretaciones.
- Rescate solo si el participante lleva >2 min bloqueado o abandona: anótalo como **fracaso con rescate**.

## 2. Consentimiento y privacidad (leer antes de empezar)

> "Voy a observar cómo usas una app en pruebas. No es un examen: si algo no se entiende, el
> problema es del diseño. No grabo pantalla ni audio salvo que lo autorices. No uses datos reales:
> te doy una cuenta de prueba. Puedes parar en cualquier momento."

- Nunca pedir emails, nombres reales ni datos familiares reales.
- Usar cuentas y familias de prueba creadas para la sesión.
- Si se graba: consentimiento explícito y borrado a los 30 días.

## 3. Perfil de participante

| # | Perfil | Objetivo de cobertura |
| --- | --- | --- |
| P1 | 25–35, usa apps financieras | Fluidez esperada |
| P2 | 35–50, administra finanzas del hogar | Caso real de Kitho |
| P3 | 50+, baja familiaridad técnica | Legibilidad y carga cognitiva |
| P4 | 25–35, invitado por otra persona | Flujo "unirme a familia" |
| P5 | 30–45, usa lector de pantalla o teclado | Accesibilidad del recorrido |

## 4. Tareas

Se leen en voz alta, una a una. No se ayuda.

### T1 · Primera entrada (sin guion)
> "Abre la app y déjala lista para usar con tu familia. Ve contándome qué ves y qué esperas que
> pase."

**Observar**: ¿lee la propuesta de valor? ¿entiende por qué se pide el nombre? ¿crea o busca unirse?
**Éxito**: llega a una pantalla que considera "inicio" en <2 min.

### T2 · Comprensión del grupo
> "Sin tocar nada, dime quién está en tu familia y qué puede hacer cada uno."

**Observar**: ¿lee "Padre · Admin" o tropieza con "Parentesco / Permiso"? ¿Sabe quién es admin?
**Éxito**: identifica a los miembros y distingue al administrador en <30 s.

### T3 · Invitar
> "Quieres que tu hermana entre en la familia. Hazlo."

**Observar**: ¿dónde busca? ¿encuentra el código? ¿entiende que es de un solo uso y caduca?
**Éxito**: llega a un código y sabe qué debe hacer con él. **Fallos típicos**: busca en Perfil, no ve
la sección por no ser admin, no entiende el estado.

### T4 · Cambiar idioma y tema
> "Pon la app en inglés y en modo oscuro."

**Observar**: ¿encuentra Ajustes desde Perfil? ¿Escanear cinco cards le cuesta? ¿El cambio es inmediato?
**Éxito**: ambos cambios en <45 s sin ayuda.

### T5 · Expectativa de retorno
> "Cierra la app y ábrela otra vez. ¿Qué esperarías ver primero? ¿Qué te gustaría poder hacer ahí?"

No implementar nada todavía: **esta tarea valida el contenido de UX-01**. Registrar verbatim.

## 5. Métricas por tarea

| Campo | Escala |
| --- | --- |
| Éxito | `sí` / `sí con rescate` / `no` |
| Tiempo | segundos |
| Errores | nº de acciones equivocadas o retrocesos |
| SEQ (facilidad) | 1 (muy difícil) – 7 (muy fácil) |
| Confianza | 1 – 5 antes/después de T3 |
| Cita | literal |

## 6. Clasificación de hallazgos

| Severidad | Criterio |
| --- | --- |
| S1 | ≥3/5 no completan la tarea, o el fallo impide el primer día |
| S2 | 2/5 fallan, o todos tardan >2× el objetivo |
| S3 | molestia sin bloqueo |

Cada hallazgo se enlaza a un ID de `audit.md` o se añade como `UX-16+` con evidencia de la sesión.

## 7. Plantilla de informe

```md
## Sesión P<n> — <perfil> — <fecha>
- T1: éxito / tiempo / errores / SEQ / cita
- T2: ...
- T3: ...
- T4: ...
- T5: verbatim de expectativa de inicio
- Observaciones de accesibilidad: (teclado, foco, lector, zoom, texto grande)
- Hallazgo nuevo: UX-xx (severidad, evidencia)
```

## 8. Después de las 5 sesiones

1. Agrupar hallazgos por causa, no por pantalla.
2. Actualizar `audit.md`: estado de cada UX-xx y nuevos.
3. Repetir T1–T3 con 5 participantes nuevos tras implementar UX-01/02/03.
4. Congelar la versión del informe; no reescribir la línea base.
