# Fase 2 — EducAI MVP (Plataforma Institucional para Colegios)

**Duración:** 10-12 semanas (en paralelo con Fase 1)
**Objetivo:** 3-5 colegios piloto usando diagnóstico curricular, generador de planificaciones y DocenteAI.

---

## Alcance del MVP

### Funcional
1. **Diagnóstico curricular institucional:** director carga currículo, IA lo compara contra marcos modernos (OCDE, Finlandia, Singapur, UNESCO 2030) y devuelve informe de brechas.
2. **Generador de planificaciones docentes:** el docente describe materia/grado/tema, la IA genera planificación completa con actividades, recursos y rúbricas.
3. **Biblioteca viva de contenidos:** materiales actualizados por IA en áreas clave (IA, programación, finanzas, ciudadanía digital, pensamiento crítico).
4. **DocenteAI:** academia de microcursos + copiloto de aula + comunidad docente.
5. **Portal básico del colegio:** gestión de docentes, alumnos, cursos.

### No funcional
- Multi-tenant estricto por colegio.
- Roles: admin del colegio, coordinador, docente, alumno (solo lectura en esta fase).
- Export a PDF de planificaciones y rúbricas.

---

## Modelo de datos específico de EducAI

Agregar a Prisma schema:

```prisma
model Curriculum {
  id          String   @id @default(cuid())
  schoolId    String
  name        String
  grade       Int
  subject     String
  version     Int      @default(1)
  content     Json     // estructura de unidades, competencias, contenidos
  source      String   // "nacional", "provincial", "institucional"
  language    String   @default("es-AR")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  school      School  @relation(fields: [schoolId], references: [id])
  gaps        CurriculumGap[]
  plans       LessonPlan[]
}

model CurriculumGap {
  id              String   @id @default(cuid())
  curriculumId    String
  category        String   // "competencia_ausente", "contenido_desactualizado", "metodología"
  severity        String   // low, medium, high
  description     String   @db.Text
  recommendation  String   @db.Text
  referenceFramework String // "OCDE", "UNESCO", "Finlandia", etc.
  createdAt       DateTime @default(now())

  curriculum      Curriculum @relation(fields: [curriculumId], references: [id])
}

model LessonPlan {
  id              String   @id @default(cuid())
  teacherId       String
  curriculumId    String?
  grade           Int
  subject         String
  topic           String
  durationMinutes Int
  competences     String[] // competencias trabajadas
  objectives      Json     // objetivos de aprendizaje
  activities      Json     // estructura de actividades
  resources       Json     // links, materiales
  assessment      Json     // rúbrica de evaluación
  adaptations     Json?    // adaptaciones para diversidad
  status          String   @default("draft") // draft, published, archived
  generatedByAI   Boolean  @default(false)
  rating          Int?     // rating del docente 1-5
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  teacher         Teacher    @relation(fields: [teacherId], references: [id])
  curriculum      Curriculum? @relation(fields: [curriculumId], references: [id])
}

model ContentLibraryItem {
  id            String   @id @default(cuid())
  title         String
  description   String   @db.Text
  type          String   // article, video, activity, simulation
  subjectArea   String   // "IA", "finanzas", "programación", etc.
  grade         Int[]    // grados recomendados
  content       Json
  mediaUrl      String?
  language      String
  tags          String[]
  generatedAt   DateTime @default(now())
  verified      Boolean  @default(false)
  verifiedBy    String?  // id de pedagogo revisor

  @@index([subjectArea, grade])
}

model TeacherCourse {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  topics      Json
  duration    Int      // minutos totales
  level       String   // introductorio, intermedio, avanzado
  modules     Json     // estructura de módulos
  accreditedBy String? // "Ministerio de Educación Catamarca" (si aplica)
  certificatePoints Int @default(0)

  enrollments TeacherEnrollment[]
}

model TeacherEnrollment {
  id          String   @id @default(cuid())
  teacherId   String
  courseId    String
  progress    Float    @default(0) // 0-100
  completed   Boolean  @default(false)
  certificateUrl String?
  startedAt   DateTime @default(now())
  completedAt DateTime?

  teacher     Teacher       @relation(fields: [teacherId], references: [id])
  course      TeacherCourse @relation(fields: [courseId], references: [id])

  @@unique([teacherId, courseId])
}

model CommunityPost {
  id          String   @id @default(cuid())
  authorId    String
  schoolId    String?
  title       String
  content     String   @db.Text
  tags        String[]
  upvotes     Int      @default(0)
  createdAt   DateTime @default(now())

  comments    CommunityComment[]
}

model CommunityComment {
  id          String   @id @default(cuid())
  postId      String
  authorId    String
  content     String   @db.Text
  createdAt   DateTime @default(now())

  post        CommunityPost @relation(fields: [postId], references: [id])
}
```

---

## Prompt 1: Diagnóstico Curricular Institucional

```
Implementá el módulo de Diagnóstico Curricular Institucional de EducAI.

## OBJETIVO
Un director del colegio sube el currículo vigente (PDF, DOCX, o ingreso manual estructurado). La IA lo analiza, lo compara contra marcos de referencia modernos (UNESCO 2030, OCDE Learning Compass, currículos de Finlandia, Singapur, Estonia, Canadá) y devuelve un informe detallado de brechas con recomendaciones.

## TAREA

### 1. Backend (apps/api)
Crear CurriculumModule con:
- POST /curricula/upload → recibe PDF/DOCX, extrae texto, estructura con IA.
- POST /curricula → crear manual.
- POST /curricula/:id/analyze → dispara análisis en background (BullMQ).
- GET /curricula/:id/gaps → devuelve informe de brechas.
- GET /curricula/:id/export-pdf → PDF presentable para bajar.

### 2. Worker (apps/worker)
Crear job `curriculum-analysis` que:
- Recibe curriculumId.
- Extrae competencias y contenidos del currículo cargado.
- Llama a Claude con un prompt de análisis comparativo contra los marcos de referencia.
- Genera objetos CurriculumGap con severidad y recomendaciones.
- Al final, crea un resumen ejecutivo para el director.

### 3. Marcos de referencia
Crear en packages/ai/src/knowledge/frameworks/ un conjunto de archivos JSON curados con las competencias clave de cada marco:
- unesco-2030.json
- ocde-learning-compass.json
- finlandia-national-curriculum.json
- singapur-21cc.json
- estonia-curriculum.json

Cada uno con: competencias, contenidos clave por área, orientaciones pedagógicas.

Usar RAG (pgvector) para que el análisis pueda citar fragmentos específicos.

### 4. Frontend (apps/web)
Crear sección /curriculum:
- Upload del currículo con drag & drop.
- Visualización del análisis con tabs: "Resumen", "Brechas por área", "Recomendaciones priorizadas", "Marcos comparados".
- Gráfico de radar comparando currículo actual vs marcos modernos.
- Export a PDF del informe.

### 5. Prompt del analizador
El prompt de Claude debe:
- Ser parametrizable por país y tipo de institución.
- Devolver JSON estructurado validable con Zod.
- Priorizar brechas accionables en 1 año, no utopías.
- Citar el marco de referencia específico en cada brecha.
- Tono constructivo, nunca "esto está mal": "acá hay oportunidad de modernizar".

## REGLAS
- El informe debe ser útil políticamente: el director debe poder mostrárselo al consejo y decir "hay que actualizar esto".
- Multi-idioma: soportar currículos en español, portugués, inglés.
- Idempotencia: reanalizar un currículo no duplica brechas.
- Audit log de cada análisis.

Tests:
- Análisis de un currículo argentino de matemática 3er ciclo real.
- Currículo vacío (error controlado).
- Currículo en portugués.
```

---

## Prompt 2: Generador de Planificaciones Docentes

```
Implementá el módulo Generador de Planificaciones de EducAI.

## CASO DE USO
Una docente de 5° grado tiene que planificar una secuencia de clases sobre fracciones. Entra al sistema, completa un formulario con parámetros, y en 30 segundos tiene:
- Planificación de 4 clases de 60 min cada una.
- Objetivos de aprendizaje alineados a competencias.
- Actividades diferenciadas para 3 niveles de alumnos.
- Recursos (videos, juegos, láminas) curados.
- Rúbrica de evaluación por competencias.
- Adaptaciones para alumnos con dificultades (respetando que el módulo de inclusión es un producto aparte, solo referencias generales).
- Material imprimible adjunto (PDF).

## TAREA

### Backend
LessonPlanModule con:
- POST /lesson-plans/generate → dispara generación con IA.
- GET /lesson-plans/:id
- PATCH /lesson-plans/:id (editar post-generación)
- POST /lesson-plans/:id/rate (docente rankea 1-5)
- POST /lesson-plans/:id/duplicate (duplicar para reusar)
- GET /lesson-plans/:id/export (PDF + DOCX)

### IA
En packages/ai, crear PlanGeneratorAgent con:
- Input: grado, materia, tema, duración total, cantidad de clases, perfil del grupo (si disponible), currículo de referencia (si el colegio ya lo cargó).
- Output: JSON validado con Zod con estructura:
  ```json
  {
    "overview": "...",
    "objectives": [...],
    "competences": [...],
    "sessions": [
      {
        "number": 1,
        "duration": 60,
        "phases": [
          { "name": "Apertura", "duration": 10, "activities": [...] },
          { "name": "Desarrollo", "duration": 40, "activities": [...] },
          { "name": "Cierre", "duration": 10, "activities": [...] }
        ],
        "resources": [...],
        "differentiation": {
          "low": "...",
          "medium": "...",
          "high": "..."
        }
      }
    ],
    "assessment": {
      "rubric": [...],
      "instruments": [...]
    },
    "printables": [{ "name": "...", "prompt": "..." }]
  }
  ```

### Copiloto de edición
En la página de detalle, el docente puede chatear con el plan: "hacé la clase 2 más lúdica", "agregá un problema con pesos argentinos", "simplificá la rúbrica para mis alumnos". El sistema re-genera solo la parte pedida.

### Biblioteca compartida
Otros docentes del mismo colegio pueden ver planes publicados por sus colegas (con permiso del autor). Ranking por uso y rating.

## REGLAS
- Planificación respetando contexto argentino (no citar "fall semester", sí "primer cuatrimestre"; usar ejemplos con pesos; evitar dólares salvo que aplique).
- Actividades concretas y realistas (no "hacer un proyecto colaborativo" suelto, sino "armar en grupos de 4 un afiche con las cinco fracciones del pan lactal en el recreo").
- Recursos: curar videos de canales serios (Paka Paka, Encuentro, Khan Academy español, no aleatorios de YouTube).
- Generar el plan en < 45 segundos.

Tests:
- Plan de matemática 3° grado 4 clases.
- Plan de filosofía secundario 2 clases.
- Edición conversacional: pedir cambio específico.
- Export PDF legible.
```

---

## Prompt 3: DocenteAI (Formación Continua + Copiloto)

```
Implementá el módulo DocenteAI de EducAI.

## 3 COMPONENTES

### A) Academia de microcursos
- Catálogo de cursos cortos (30 min a 4 hs) sobre:
  - IA en el aula
  - Evaluación por competencias
  - Neurociencia aplicada al aprendizaje
  - Gestión emocional del aula
  - Aprendizaje basado en proyectos
  - Cómo detectar y manejar bullying
  - Pensamiento crítico y alfabetización mediática
- Formato: video + lectura + actividad práctica + quiz.
- Al completar: certificado descargable con puntaje docente (si hay acuerdo ministerial).

### B) Copiloto de aula (chat asistente del docente)
Chat conversacional donde el docente pregunta cosas como:
- "Tengo un alumno de 4° que no para de molestar, ¿qué hago?"
- "Dame 3 ideas para arrancar la clase de historia el lunes."
- "Armame un quiz rápido de 5 preguntas sobre Revolución de Mayo."
- "¿Cómo le explico a un padre que su hijo necesita apoyo sin que se ofenda?"

### C) Comunidad docente
Foro tipo Discourse/Reddit interno:
- Posts, comentarios, upvotes, tags.
- Moderación con IA + humanos.
- "Preguntas frecuentes" destacadas.
- Grupos por materia/nivel.

## TAREA TÉCNICA

1. TeacherCourseModule con CRUD de cursos y enrollment.
2. CommunityModule con posts y comentarios + moderación.
3. TeacherAssistantService: chat IA con contexto del docente (grado, materia, historial de consultas).
4. Frontend en apps/web: /academy, /copilot, /community.
5. Sistema de gamificación: puntos por completar cursos, responder en comunidad, aportar planes a biblioteca.
6. Emails semanales: "mira qué pasó en la comunidad esta semana".

## REGLAS
- Contenido de cursos generado por IA + revisado por pedagogos humanos (flag `verified: true`).
- Copiloto nunca da consejos que vayan contra protocolos escolares (ej: "pegale a un alumno"). Filtros estrictos.
- Moderación de comunidad: detección de discurso de odio, doxing, información personal de alumnos.
- Privacidad: si un docente consulta sobre un alumno por nombre, anonimizar en logs.

Tests:
- Flow completo: docente se inscribe en curso, lo completa, descarga certificado.
- Copiloto responde consulta pedagógica.
- Post con contenido inapropiado es moderado.
```

---

## Prompt 4: Portal del Colegio + Admin

```
Implementá el Portal Administrativo del Colegio en apps/web.

## FUNCIONALIDAD

### Para el admin del colegio:
- Dashboard: KPIs del colegio (cantidad de docentes, cursos, planes generados, engagement).
- Gestión de docentes: invitar, suspender, asignar roles.
- Gestión de cursos (aulas) y asignación docente-curso.
- Configuración institucional: logo, colores, datos fiscales, currículo oficial.
- Billing: ver plan actual, upgrade, facturación.

### Para el coordinador:
- Ver todas las planificaciones publicadas.
- Dar feedback a docentes.
- Reportes de uso por docente.

### Para el docente:
- Dashboard personal: sus cursos, planes, progreso en Academia, notificaciones de la comunidad.
- Acceso rápido a: generar plan, copiloto, biblioteca.

## TAREA
- Next.js 14 App Router.
- Layout con sidebar navegable por rol.
- shadcn/ui como base + Tailwind.
- Autorización con RBAC (usar Permission model de la fase 0).
- Tablas con filtros, sort y paginación.
- Forms validados con react-hook-form + Zod.
- Estado global con Zustand.
- Data fetching con TanStack Query.
- Multi-idioma con next-intl (es-AR default).

## REGLAS
- Todo multi-tenant: el admin de Colegio A no puede ver nada de Colegio B.
- Audit log de acciones administrativas.
- Accesibilidad WCAG 2.1 AA.
- Responsive (tablet mínimo, mobile como secundario).
- Dark mode opcional.

Tests e2e con Playwright:
- Login como admin, invitar docente, docente acepta, se loguea.
- Docente genera plan y lo publica.
- Admin ve métricas actualizadas.
- Usuario sin permiso intenta acceder a ruta protegida → redirect.
```

---

## Checklist de cierre de Fase 2

- [ ] 3-5 colegios piloto activos
- [ ] 30+ docentes generando planificaciones
- [ ] Tiempo de planificación reducido 60% vs método tradicional (medido)
- [ ] 20+ currículos analizados con informes de brechas
- [ ] Academia con 10 cursos publicados y 50+ inscripciones
- [ ] Comunidad con 100+ posts y moderación sin incidentes
- [ ] NPS de docentes > 60
- [ ] NPS de directivos > 70
- [ ] 0 fugas de datos entre colegios (validado con auditoría)
