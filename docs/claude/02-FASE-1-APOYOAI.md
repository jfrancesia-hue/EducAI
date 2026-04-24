# Fase 1 — ApoyoAI MVP (Tutor IA por WhatsApp + App)

**Duración:** 10-12 semanas
**Objetivo:** Lanzar un MVP funcional con 100 familias pagando, validando que chicos de primaria/secundaria pueden aprender con un tutor IA pedagógico por WhatsApp.

---

## Alcance del MVP

### Funcional
- Onboarding del padre (registro, pago, creación del perfil del hijo).
- Evaluación diagnóstica del alumno (10 min, adaptativa).
- Tutor IA conversacional por WhatsApp (texto, audio, imagen).
- Resolución pedagógica de ejercicios por foto (OCR + razonamiento socrático).
- Reportes semanales al padre por email y WhatsApp.
- Panel web para padres (progreso del hijo, gestión de suscripción).
- Materias MVP: matemática, lengua, ciencias naturales (4° a 12° grado).

### No funcional
- Idioma: español argentino como default, español neutro como fallback.
- Latencia objetivo: respuesta del tutor < 8 segundos.
- Disponibilidad: 99.5%.
- Cumplimiento: consentimiento parental explícito para menores.

---

## Arquitectura del módulo Tutor IA

```
WhatsApp del alumno
      │
      ▼
Twilio Webhook ──────────► apps/whatsapp-agent (NestJS)
                                    │
                                    ▼
                          ┌──────────────────────┐
                          │  Orchestrator Service│
                          │  - Identifica alumno │
                          │  - Carga contexto    │
                          │  - Clasifica intent  │
                          └──────┬───────────────┘
                                 │
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                    ▼
      ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
      │ Tutor Agent │    │ OCR Service  │    │ Exercise Gen │
      │ (Claude)    │    │ (Vision)     │    │ (OpenAI)     │
      └─────────────┘    └──────────────┘    └──────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Context Builder  │
                        │ - Perfil alumno  │
                        │ - Historial      │
                        │ - Currículo      │
                        │ - RAG pgvector   │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Response + Log   │
                        │ → Twilio         │
                        │ → DB (mensajes)  │
                        │ → Analytics      │
                        └──────────────────┘
```

---

## Modelo de datos específico de ApoyoAI

Agregar al schema Prisma de la Fase 0:

```prisma
model StudentProfile {
  id                    String   @id @default(cuid())
  studentId             String   @unique
  grade                 Int      // 1-12
  country               String   // AR, BO, PE, etc
  curriculum            String   // "AR-NOA", "UY-NACIONAL", etc.
  learningStyle         String?  // "visual", "auditivo", "kinestesico"
  strongSubjects        String[] // ["matematica", "lengua"]
  weakSubjects          String[]
  diagnosticCompleted   Boolean  @default(false)
  diagnosticScore       Json?    // scores por materia y competencia
  preferredChannel      String   @default("whatsapp")
  whatsappPhone         String?  @unique
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  student               Student  @relation(fields: [studentId], references: [id])
  conversations         Conversation[]
  sessions              LearningSession[]
  achievements          Achievement[]
}

model Conversation {
  id                String   @id @default(cuid())
  studentProfileId  String
  subject           String
  topic             String?
  status            String   @default("active") // active, closed, escalated
  startedAt         DateTime @default(now())
  endedAt           DateTime?
  summary           String?  @db.Text
  competencesUsed   String[]

  studentProfile    StudentProfile @relation(fields: [studentProfileId], references: [id])
  messages          Message[]
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  role            String   // student, tutor, system
  content         String   @db.Text
  mediaUrl        String?
  mediaType       String?  // image, audio, text
  tokensUsed      Int?
  modelUsed       String?  // claude-opus-4-7, gpt-4o, etc
  createdAt       DateTime @default(now())

  conversation    Conversation @relation(fields: [conversationId], references: [id])
}

model LearningSession {
  id                String   @id @default(cuid())
  studentProfileId  String
  subject           String
  topic             String
  durationMinutes   Int
  competencesScored Json     // { "comprension": 0.8, "aplicacion": 0.6 }
  completed         Boolean  @default(false)
  createdAt         DateTime @default(now())

  studentProfile    StudentProfile @relation(fields: [studentProfileId], references: [id])
}

model Achievement {
  id                String   @id @default(cuid())
  studentProfileId  String
  type              String   // streak, mastery, consistency
  name              String
  description       String
  earnedAt          DateTime @default(now())

  studentProfile    StudentProfile @relation(fields: [studentProfileId], references: [id])
}

model ParentReport {
  id            String   @id @default(cuid())
  familyId      String
  periodStart   DateTime
  periodEnd     DateTime
  summary       Json     // estructura con progreso, hallazgos, recomendaciones
  sentAt        DateTime?
  createdAt     DateTime @default(now())
}

model Subscription {
  id            String   @id @default(cuid())
  familyId      String   @unique
  plan          String   // free, basic, premium, family
  status        String   // active, canceled, past_due
  provider      String   // mercadopago, stripe
  providerSubId String?
  currentPeriodEnd DateTime
  canceledAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Prompt 1: Schema + Módulo Core del Estudiante

```
Basándote en el documento maestro del proyecto EducAI y en el archivo 02-FASE-1-APOYOAI.md, implementá lo siguiente:

## TAREA
Agregar al schema Prisma los modelos de ApoyoAI (StudentProfile, Conversation, Message, LearningSession, Achievement, ParentReport, Subscription) y crear el módulo completo de gestión del perfil del alumno en apps/api (NestJS).

## DETALLES

1. Actualizar packages/database/prisma/schema.prisma con los modelos indicados (ver sección "Modelo de datos específico de ApoyoAI" del archivo 02).

2. Crear migración y correrla.

3. En apps/api, crear el módulo StudentModule con:
   - StudentController con endpoints RESTful:
     - POST /students (crear perfil)
     - GET /students/:id
     - PATCH /students/:id
     - POST /students/:id/diagnostic (iniciar evaluación diagnóstica)
     - POST /students/:id/diagnostic/answer (responder pregunta)
     - GET /students/:id/progress (progreso agregado)
   - StudentService con lógica de negocio.
   - DTOs con class-validator para validación estricta.
   - Guards para autorización (padre solo accede a sus hijos).
   - Swagger docs en cada endpoint.

4. Crear tests unitarios del servicio y e2e del controller (Vitest + Supertest).

5. Seeds con 3 familias de ejemplo, cada una con 1-2 hijos con distintos perfiles.

## REGLAS
- Multi-tenancy estricto: usar familyId como tenant del estudiante.
- Todos los endpoints devuelven respuestas tipadas.
- Logging estructurado (pino) en cada operación importante.
- Errores de dominio usando exceptions custom (StudentNotFoundError, etc).
- No implementes el tutor IA todavía, solo el CRUD del perfil y el diagnóstico.

Devolveme:
- Árbol de archivos creados
- Comandos para correr migraciones y tests
- Ejemplo de request/response de cada endpoint
```

---

## Prompt 2: Motor del Tutor IA (Agente Pedagógico Claude)

```
Implementá el motor del Tutor IA de ApoyoAI en packages/ai y apps/whatsapp-agent.

## CONTEXTO PEDAGÓGICO CRÍTICO

El tutor IA NUNCA da la respuesta directa. Sigue el método socrático:
1. Valida la pregunta del alumno.
2. Identifica qué conceptos previos podrían faltar.
3. Hace preguntas guía que lleven al alumno a descubrir la respuesta.
4. Refuerza positivamente el esfuerzo, no el talento.
5. Adapta el vocabulario al grado del alumno.
6. Si detecta frustración, cambia de estrategia (ejemplo, analogía, juego).

## TAREA

### A) En packages/ai crear:

1. `src/prompts/tutor-system.ts` — prompt del sistema del tutor, parametrizable por:
   - grado del alumno
   - materia
   - nombre del alumno
   - perfil de aprendizaje (diagnóstico)
   - historial reciente
   - currículo de referencia (RAG)

2. `src/agents/tutor-agent.ts` — clase TutorAgent que:
   - Recibe contexto del alumno + mensaje entrante.
   - Llama a Claude API (usar claude-opus-4-7 como modelo por defecto, ver product-self-knowledge skill).
   - Devuelve respuesta + metadata (tokens, competencias ejercitadas, signals emocionales).
   - Detecta si el alumno está frustrado, confundido, o en crisis emocional (derivación a humano).
   - Detecta cuando el alumno "ya entendió" y propone ejercicio de consolidación.

3. `src/services/context-builder.ts` — servicio que:
   - Arma el contexto del alumno (perfil + últimas N conversaciones + currículo relevante via pgvector).
   - Normaliza y comprime si supera tokens.

4. `src/services/ocr.service.ts` — integra Claude Vision para leer ejercicios desde fotos.

5. `src/services/audio.service.ts` — integra Whisper para transcripción de audios.

6. `src/safety/content-filter.ts` — filtros de contenido:
   - Detecta lenguaje inapropiado del alumno (avisa al padre si es grave).
   - Detecta señales de crisis emocional, bullying, abuso (derivación inmediata a humano).
   - Bloquea temas no pedagógicos.

7. Tests unitarios de cada servicio con mocks del API.

### B) En apps/whatsapp-agent crear:

1. Webhook de Twilio: POST /webhooks/twilio/whatsapp
2. Service que:
   - Identifica al alumno por número de WhatsApp.
   - Valida suscripción activa (ApoyoAI tiene plan free limitado y planes pagos).
   - Rate limiting por plan.
   - Orquesta: OCR si viene imagen, Whisper si viene audio, TutorAgent siempre.
   - Guarda Message + Conversation en DB.
   - Responde vía Twilio.
3. Manejo de conversación multi-turno con estado.
4. Comandos especiales: /ayuda, /examen (modo repaso), /ejercicio, /pausar.

## RESTRICCIONES CRÍTICAS

- Seguridad pedagógica es no negociable: el prompt del tutor debe ser robusto contra jailbreaks (chicos intentando que el tutor les dé la respuesta directa).
- Logging detallado de cada interacción (auditable por padre).
- Si detectás señales de crisis, NO respondés con un mensaje genérico: avisás por email al padre en ese momento y derivás a recurso de ayuda.
- Todo el contenido que genera el tutor debe ser apropiado para menores: sin violencia, sin sexual, sin temas adultos.

## ENTREGABLE FINAL

1. Código completo de ambos paquetes.
2. Archivo de ejemplos de prompts (con ejemplos de few-shot dentro del system prompt).
3. Tests cubriendo al menos: pregunta simple de matemática, foto de ejercicio, audio, intento de jailbreak, señal de frustración, señal de crisis.
4. README en packages/ai con guía de uso.
5. Guión de prueba manual: 10 escenarios reales (alumno de 5° no entiende fracciones, alumno de 10° pide resolver una integral, alumno manda foto borrosa, alumno dice "no sé nada, soy un burro", etc.) y la respuesta esperada.
```

---

## Prompt 3: Evaluación Diagnóstica Inicial

```
Implementá el módulo de Evaluación Diagnóstica adaptativa para ApoyoAI.

## OBJETIVO PEDAGÓGICO
Al terminar la evaluación (10 min), saber:
- Nivel real del alumno por materia (puede estar 2 grados atrás del oficial).
- Fortalezas y debilidades por competencia (comprensión, aplicación, análisis).
- Estilo de aprendizaje preferido.
- Áreas de interés (para gamificar con temas que le gusten).

## TAREA

1. En packages/ai, crear `src/services/diagnostic.service.ts`:
   - Motor adaptativo: si el alumno responde bien, sube dificultad; si mal, baja.
   - Genera preguntas por IA on-the-fly basadas en el grado declarado.
   - Mezcla materias (no todo de una).
   - Máximo 15 preguntas, adaptativo.
   - Al final, genera un informe con Claude: puntos fuertes, débiles, recomendaciones.

2. En apps/api, StudentController ya tiene endpoints /diagnostic. Conectarlos al servicio.

3. En apps/whatsapp-agent, implementar flujo conversacional del diagnóstico:
   - Comando: /empezar o automático al primer contacto.
   - Presentación amigable: "Hola [nombre], soy tu tutor. Vamos a conocernos mejor con un jueguito rápido. ¿Listos?"
   - Presentación de cada pregunta con opciones (A, B, C, D) o respuesta abierta.
   - Feedback motivador después de cada respuesta, sin revelar si estuvo bien o mal (para no desmotivar).
   - Cierre con resumen positivo: "¡Genial! Ya sé cómo ayudarte mejor. Empezamos cuando quieras."

4. Guardar el resultado en StudentProfile.diagnosticScore.

5. Disparar envío de email al padre con el informe del diagnóstico.

## REGLAS
- Las preguntas NO son memorísticas: son comprensivas y aplicadas.
- Nada de trampas ni "pregunta capciosa". Solo medir de verdad.
- Si el alumno abandona a mitad, guardar estado y retomar después.
- Accesibilidad: audio de cada pregunta (text-to-speech) para alumnos con dificultades de lectura.

Tests:
- Simular 3 perfiles de alumno (bajo, medio, alto) y verificar que el diagnóstico converge correctamente.
- Abandono y retomar.
- Pregunta respondida con audio.
```

---

## Prompt 4: Pagos y Suscripciones (MercadoPago + Stripe)

```
Implementá el módulo de pagos y suscripciones de ApoyoAI.

## PLANES

| Plan | Precio ARS | USD equiv | Features |
|------|-----------|-----------|----------|
| Free | 0 | 0 | 10 mensajes/día, 1 materia |
| Basic | 6.000/mes | 6 | Ilimitado, 2 materias |
| Premium | 12.000/mes | 12 | Todas las materias, reportes, modo examen |
| Familiar | 20.000/mes | 20 | Hasta 3 hijos |

## TAREA

1. En apps/api, crear SubscriptionModule:
   - Integración con MercadoPago para Argentina/LATAM.
   - Integración con Stripe para internacional.
   - Detectar país por IP en el checkout y ofrecer provider correcto.
   - Endpoints: crear suscripción, cambiar plan, cancelar, listar facturas.
   - Webhooks de ambos providers con validación de firma.
   - Manejo de estados: active, past_due, canceled, in_grace_period.
   - Cron job diario que chequea vencimientos y downgradea automáticamente.

2. En apps/web, crear flujo de checkout:
   - Página de planes.
   - Checkout con redirect a provider.
   - Página de éxito/error.
   - Panel de gestión de suscripción.

3. En apps/whatsapp-agent, implementar rate limiting por plan:
   - Free: 10 msgs/día (contador diario, reseteo a medianoche AR).
   - Basic+: ilimitado.
   - Al llegar al límite, mensaje amigable con upgrade CTA.

4. Sistema de trial: 7 días Premium gratis al registrarse.

5. Invoicing básico: PDF de cada factura guardado en Supabase Storage.

## REGLAS
- Cumplir con AFIP: guardar datos fiscales para facturación electrónica futura.
- Webhooks idempotentes (un mismo evento puede llegar varias veces).
- Logs auditables de cada cambio de suscripción.
- Tests de todos los flujos: alta, baja, cambio de plan, webhook duplicado, webhook con firma inválida.
```

---

## Prompt 5: Reportes Semanales al Padre

```
Implementá el sistema de reportes semanales al padre.

## QUÉ DEBE INCLUIR UN REPORTE

1. Resumen ejecutivo (3 líneas).
2. Tiempo total de uso esta semana vs promedio.
3. Materias estudiadas y tiempo en cada una.
4. Progreso por competencia (visualización).
5. Logros alcanzados.
6. Áreas de dificultad detectadas (con recomendaciones para el padre).
7. Próximos objetivos sugeridos.
8. Señales de alerta (si hubo bajón emocional, frustración persistente, baja actividad).
9. Tip de la semana para acompañar al hijo.

## TAREA

1. En apps/worker, crear un job semanal (domingos 20:00 AR) que:
   - Corre para cada familia con suscripción Premium o Familiar.
   - Agrega datos de LearningSession, Message, Achievement de la semana.
   - Genera resumen narrativo con Claude (prompt parametrizado).
   - Guarda en ParentReport.
   - Envía por email (plantilla HTML bonita) y WhatsApp (resumen + link al reporte completo).

2. En apps/web, crear página /reports/:id con visualización rica del reporte (gráficos con Recharts).

3. Plantilla de email con React Email.

4. Plan Basic: reporte mensual simplificado, no semanal.

## REGLAS
- Tono del reporte: constructivo, nunca negativo, enfocado en cómo acompañar.
- Nunca revelar contenido sensible de las conversaciones (respeta intimidad del hijo adolescente).
- Si hay señal de crisis, el reporte NO es el canal: debe haberse notificado ya por el sistema de alertas.
- Cumplimiento: el padre tiene derecho a ver resúmenes, no transcripciones completas (excepto menores de X edad configurable).

Tests:
- Generación con datos simulados.
- Caso con semana sin actividad (mensaje empático, no reproche).
- Caso con señales de alerta.
```

---

## Checklist de cierre de Fase 1

- [ ] 100 familias piloto onboardeadas
- [ ] Tutor IA responde correctamente en >95% de los casos de prueba
- [ ] Sin jailbreaks exitosos en pruebas de red team
- [ ] Tiempo promedio de respuesta < 8s
- [ ] Diagnóstico con tasa de completado >80%
- [ ] Reportes semanales generándose automáticamente
- [ ] Sistema de pagos funcionando en AR (MercadoPago) y US (Stripe)
- [ ] NPS de padres > 50
- [ ] Retención semana 4 > 60%
- [ ] 0 incidentes de seguridad con datos de menores
