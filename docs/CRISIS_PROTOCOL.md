# Protocolo de Crisis del Tutor IA

> **Estado: BORRADOR técnico.** Debe ser revisado y aprobado por un **abogado** y por
> **2 profesionales de salud mental** antes de cualquier release público (regla no
> negociable del proyecto). Este documento describe lo que hace el sistema y lo que
> debe hacer el equipo humano; NO reemplaza la validación profesional/legal.

## Por qué existe

ApoyoAI es un tutor por WhatsApp usado por **menores de edad**. Un alumno puede
expresar una situación de riesgo (autolesión, ideación suicida, abuso, violencia).
Frente a eso el sistema no puede seguir "dando clase": tiene que **contener al
alumno** y **avisar a un adulto entrenado**. Marco aplicable: Ley 26.061 (AR), LGPD
(BR), COPPA y deber de cuidado.

## Cómo se detecta (y sus límites)

- La detección la hace un **filtro determinístico de frases** (`packages/ai/src/safety/content-filter.ts`)
  sobre el mensaje del alumno, en español rioplatense. Señales: `crisis_suicide`,
  `crisis_self_harm`, `crisis_abuse`, `crisis_violence`.
- Severidad: `critical` (suicidio) / `high` (resto).
- **Limitación conocida:** al ser por patrones, puede evadirse (leet-speak, otros
  idiomas, frases muy indirectas) y puede dar **falsos positivos**. Es una red de
  seguridad valiosa, **no infalible**. Mejora pendiente: capa semántica de respaldo.

## Qué hace el sistema automáticamente

1. **Contiene al alumno**: en vez de responder como tutor, le envía un mensaje de
   contención con **líneas de ayuda** (102 niñez, 144 violencia, 135 suicidio).
2. **Alerta en tiempo real al equipo de crisis** por WhatsApp
   (`CrisisAlertService` → `CRISIS_ALERT_WHATSAPP_TO`, con override por colegio en
   `tenant.metadata.crisisAlertWhatsappTo`). La alerta incluye severidad, señales,
   nombre y grado del alumno, tenant, conversación y el texto del alumno.
3. **Registra el caso** (handoff) accesible para el equipo, ordenado con las crisis
   primero, con la severidad y si la alerta se entregó.

**El sistema NUNCA, de forma automática:**

- avisa a la familia/padres (en abuso intrafamiliar el agresor puede ser el padre);
- denuncia a una autoridad.
  Esas decisiones son **humanas**.

## Protocolo humano (lo que hace el equipo)

1. **Recibir** la alerta de WhatsApp.
2. **Abrir el caso** en el panel de handoffs y leer el contexto (texto del alumno,
   señales, severidad, familia/colegio).
3. **Evaluar** la situación (idealmente con un profesional de salud mental). Descartar
   falso positivo.
4. **Decidir y actuar** según el caso:
   - Si NO involucra a la familia y corresponde → contactar a la familia (el equipo
     tiene el contacto).
   - Si hay riesgo o sospecha de abuso/negligencia → **derivar a la autoridad**
     (Línea 102 / organismo local de protección de derechos) siguiendo la guía legal.
   - Coordinar seguimiento.
5. **Cerrar el handoff** con una nota de resolución (queda auditado).

## Responsables y tiempos

- Definir **quién** es el equipo de crisis (guardia, horario, backup).
- Definir **SLA** de respuesta para `critical` vs `high`.
- (A completar por el equipo / validación profesional.)

## Pendientes antes del release público

- [ ] Revisión **legal** (denuncia, datos de menores, base legal de la actuación).
- [ ] Revisión de **2 profesionales de salud mental** (mensajes de contención y protocolo).
- [ ] Definir equipo de crisis, SLA y guía de derivación a autoridad por jurisdicción.
- [ ] Localizar líneas de ayuda por país (hoy solo AR).
- [ ] Evaluar capa de detección semántica de respaldo.
