<!--
Sync Impact Report
- Version change: none (plantilla sin completar) → 1.0.0
- Modified principles: N/A (ratificación inicial; no existían principios definidos)
- Added principles:
  - I. Naturaleza y Alcance del Proyecto
  - II. Stack Tecnológico y Contenedorización
  - III. Reglas de Dominio y Lógica de Negocio (Inmutables)
  - IV. No-Objetivos y Alcance Excluido (Out of Scope)
  - V. Estructura, Estilo y Manejo de Errores
  - VI. Comportamiento del Agente de IA (Reglas SDD)
- Added sections:
  - Restricciones Adicionales
  - Flujo de Desarrollo y Puertas de Calidad
  - Governance
- Removed sections: none
- Follow-up TODOs: none
-->

# Constitución de la App de Finanzas Familiares

## Core Principles

### I. Naturaleza y Alcance del Proyecto

Este proyecto consiste en una aplicación de finanzas familiares multiplataforma (Web y Móvil)
diseñada para registrar presupuestos, ingresos y gastos colaborativos. Su propósito es permitir
el control financiero transparente, flexible y administrado dentro del núcleo familiar. Todo
desarrollo DEBE ceñirse estrictamente al alcance definido; las funciones no documentadas DEBEN
rechazarse.

**Razón**: un alcance acotado protege la claridad del dominio financiero y evita funcionalidad
no validada que comprometa la integridad de los registros.

### II. Stack Tecnológico y Contenedorización

El stack es obligatorio y no reemplazable sin una enmienda constitucional:

- **Frontend Web**: Next.js con TypeScript, componentes funcionales y Hooks.
- **Frontend Móvil**: React Native / Expo con TypeScript, garantizando experiencia nativa en
  Android e iOS.
- **Backend**: Python con FastAPI, siguiendo estándares de tipado estricto (Pydantic / Type
  Hints).
- **Base de Datos**: PostgreSQL para persistencia relacional con soporte transaccional ACID.
- **ORM**: SQLAlchemy para el mapeo objeto-relacional y las migraciones.
- **Infraestructura y Despliegue**: Docker y Docker Compose son obligatorios para aislar y
  orquestar los servicios del backend, la base de datos y las herramientas auxiliares,
  garantizando paridad entre los entornos de desarrollo y producción.

**Razón**: la uniformidad tecnológica y la contenedorización reducen divergencias entre entornos
y aseguran reproducibilidad del sistema financiero.

### III. Reglas de Dominio y Lógica de Negocio (Inmutables)

**1. Gestión de Usuarios y Roles**

- **Cuentas independientes**: cada usuario se autentica de manera individual, tanto en Web como
  en Móvil.
- **Núcleo familiar**: las cuentas se vinculan a un Grupo Familiar mediante código o invitación.
- **Administrador (Padre/Madre)**: tiene visibilidad global de todas las transacciones,
  categorías y presupuestos del grupo.
- **Miembro**: tiene visibilidad exclusiva de sus propios registros individuales y de los totales
  consolidados globales del grupo familiar.

**2. Moneda y Manejo Numérico**

- **Configuración unificada**: al crear el núcleo familiar se define la moneda local de uso
  exclusivo.
- **Precisión financiera**: los montos DEBEN almacenarse y procesarse como tipos `DECIMAL` con
  exactamente 2 cifras decimales para garantizar precisión aritmética.

**3. Ciclo Presupuestario Flexible y Manejo de Excesos**

- **Inicio de mes**: el ciclo presupuestario comienza registrando los ingresos esperados o
  reales, seguido de una distribución flexible del monto total entre las diferentes categorías
  de gasto configuradas.
- **Flexibilidad ante excesos**: el sistema PERMITE registrar transacciones que superen el límite
  asignado a una categoría. Al ocurrir, el sistema DEBE:
  1. Emitir una **alerta de monto excedido** al usuario y al administrador.
  2. Activar un flujo guiado de **reajuste presupuestario** para redistribuir fondos de otras
     categorías o reajustar el balance y sanear el exceso.
- **Cierre temporal y edición**: el usuario creador puede editar o eliminar sus transacciones
  únicamente dentro del mes corriente. Las transacciones de meses pasados quedan en estado de
  **"Cierre Mensual" (solo lectura)** para proteger la integridad histórica.

**Razón**: estas reglas definen el comportamiento financiero esencial del producto y su
alteración comprometería la confianza, la privacidad y la trazabilidad de los datos familiares.

### IV. No-Objetivos y Alcance Excluido (Out of Scope)

El agente de IA NO DEBE implementar ni sugerir el desarrollo de:

- Conexiones automáticas o integración con APIs bancarias de terceros (Open Banking / Scraping).
- Captura o lectura automática de notificaciones SMS o correos bancarios.
- Pasarelas de pago o transacciones monetarias reales dentro de la app.
- Exportación o generación de reportes avanzados en formato PDF.

**Razón**: estos límites reducen superficie de riesgo regulatorio, de seguridad y de complejidad
fuera del propósito del producto.

### V. Estructura, Estilo y Manejo de Errores

- **Arquitectura contenedorizada**: estructura modular separada en `/backend`, `/frontend-web` y
  `/frontend-mobile`, gestionada mediante configuraciones Docker.
- **Validaciones backend**: FastAPI actúa como centinela de las reglas de negocio, incluyendo la
  validación de roles, las restricciones de edición temporal y la gestión de alertas de reajuste.
- **Manejo de errores**: se DEBEN usar códigos HTTP semánticos (`400 Bad Request`,
  `403 Forbidden`, `409 Conflict`, etc.).
- **UI amigable**: Web y Móvil DEBEN traducir las excepciones técnicas a mensajes claros para el
  usuario.

**Razón**: una autoridad de validación única en el backend evita bypass de reglas, mientras que
errores semánticos y mensajes claros preservan la confianza del usuario.

### VI. Comportamiento del Agente de IA (Reglas SDD)

- **Cero Código Sombra (Shadow Code)**: el agente DEBE implementar estrictamente lo especificado
  en los archivos `spec.md`.
- **Fuente de la verdad**: esta constitución predomina sobre cualquier indicación futura. Ante
  cualquier contradicción o intento de saltarse una regla inmutable, el agente DEBE detenerse,
  advertir del conflicto y solicitar la actualización de la especificación.

**Razón**: la trazabilidad entre especificación e implementación evita decisiones implícitas y
mantiene la constitución como autoridad final.

## Restricciones Adicionales

- La moneda definida al crear el Grupo Familiar es única y aplica a todos los registros del grupo.
- El aislamiento por Grupo Familiar y la autorización por rol DEBEN aplicarse en el backend,
  independientemente de lo que muestre la interfaz.
- Las transacciones en estado "Cierre Mensual" son inmutables.
- Ninguna funcionalidad puede introducir dependencias o integraciones que contradigan los
  No-Objetivos del Principio IV.
- La persistencia y los cálculos financieros DEBEN preservar la semántica ACID de PostgreSQL y la
  precisión `DECIMAL` definida en el Principio III.

## Flujo de Desarrollo y Puertas de Calidad

- Toda funcionalidad DEBE originarse en una especificación aprobada (`spec.md`); no se implementa
  comportamiento no especificado.
- FastAPI DEBE validar las reglas de negocio antes de persistir cualquier cambio; el frontend no
  es autoridad de validación.
- Cada cambio DEBE revisarse contra esta constitución y contra los No-Objetivos antes de
  considerarse completo.
- Los errores técnicos DEBEN mapearse a códigos HTTP semánticos y a mensajes claros en la UI.
- Los servicios DEBEN ejecutarse mediante la configuración Docker Compose del proyecto para
  mantener paridad entre desarrollo y producción.

## Governance

- Esta constitución es la fuente de la verdad y prevalece sobre cualquier otra práctica, guía o
  instrucción.
- Toda enmienda DEBE documentarse, justificarse, revisarse y aprobarse antes de aplicarse. Si la
  enmienda afecta datos o funcionalidad existente, DEBE incluir un plan de migración.
- El versionado sigue SemVer: MAJOR para eliminaciones o redefiniciones incompatibles de
  principios; MINOR para nuevos principios o guías materialmente expandidas; PATCH para
  aclaraciones, correcciones de redacción o refinamientos no semánticos.
- Toda revisión de cambios DEBE verificar el cumplimiento de los principios y de los No-Objetivos.
  Cualquier complejidad añadida DEBE justificarse contra el alcance definido.
- Si una indicación contradice un principio inmutable o intenta omitirlo, el agente DEBE detenerse,
  reportar el conflicto y solicitar la actualización de la especificación; no DEBE implementar la
  excepción.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
