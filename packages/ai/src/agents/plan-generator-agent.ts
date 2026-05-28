import { z } from "zod";
import type { LlmClient } from "../llm/types.js";
import { DeterministicLlmClient } from "../llm/types.js";
import { getEducAIModelForPlan } from "../plans.js";
import { educaiLessonGuideSchema, type EducaiLessonGuide } from "./lesson-guide-schema.js";

export const lessonPlanSchema = z.object({
  overview: z.string(),
  objectives: z.array(z.string()),
  competences: z.array(z.string()),
  sessions: z.array(
    z.object({
      number: z.number(),
      duration: z.number(),
      phases: z.array(
        z.object({
          name: z.string(),
          duration: z.number(),
          activities: z.array(z.string()),
        }),
      ),
      resources: z.array(z.string()),
      differentiation: z.object({
        low: z.string(),
        medium: z.string(),
        high: z.string(),
      }),
    }),
  ),
  assessment: z.object({
    rubric: z.array(z.string()),
    instruments: z.array(z.string()),
  }),
  printables: z.array(z.object({ name: z.string(), prompt: z.string() })),
  guide: educaiLessonGuideSchema,
});

export type LessonPlanOutput = z.infer<typeof lessonPlanSchema>;

export interface PlanGeneratorInput {
  educationLevel: "primaria" | "secundaria" | "terciario" | "universitario";
  grade: number;
  subject: string;
  courseLabel?: string;
  institutionName?: string;
  lessonIntent?: string;
  levelContext?: string;
  plannedDate?: string;
  careerName?: string;
  topic: string;
  totalDurationMinutes: number;
  sessionCount: number;
  learningGoal?: string;
  groupProfile?: string;
  priorKnowledge?: string;
  curriculumContext?: string;
  availableResources?: string;
  assessmentFocus?: string;
  inclusionNeeds?: string;
  outputFormat?: string;
}

export class PlanGeneratorAgent {
  constructor(private readonly llm: LlmClient = new DeterministicLlmClient()) {}

  async generate(input: PlanGeneratorInput): Promise<LessonPlanOutput> {
    const result = await this.tryGenerateWithLlm(input);

    if (!result) {
      return this.buildFallbackPlan(input);
    }

    const parsed = this.tryParseLlmPlan(result.content);
    if (parsed) {
      return parsed;
    }

    const toolPlan = this.tryParseGuide(result.toolUse?.input);
    if (toolPlan) {
      return toolPlan;
    }

    return this.buildFallbackPlan(input);
  }

  private async tryGenerateWithLlm(input: PlanGeneratorInput) {
    try {
      const systemPrompt = [
        "Sos EducAI, un agente pedagogico para docentes argentinos.",
        "Tu trabajo no es dar ideas generales: tenes que producir una planificacion de aula lista para revisar, editar y usar.",
        "La clase debe quedar especifica para el nivel, anio, materia, tema, intencion didactica, duracion y contexto recibidos.",
        "Si el tema es disciplinar, explicitalo en consignas, ejemplos, errores frecuentes, evaluacion y cierre. No escribas frases comodin.",
        "Cada fase debe tener acciones concretas del docente y de los estudiantes, con consignas textuales que puedan leerse en clase.",
        "Respeta la duracion total: la suma de sesiones debe aproximarse al total y la suma de fases debe coincidir con cada sesion.",
        "Usa solo recursos plausibles. Si el docente informo recursos disponibles, priorizalos.",
        "Inclui diferenciacion real por nivel de acompanamiento, no etiquetas vacias.",
        "La evaluacion debe mirar evidencias observables del tema trabajado.",
        "No uses frases comodin como 'pregunta disparadora', 'resolver un desafio' o 'registrar una idea clave' sin escribir el contenido exacto.",
        "Usa obligatoriamente la herramienta guardar_clase_docente. No respondas con texto libre.",
      ].join(" ");

      return await this.withTimeout(
        this.llm.generate({
          model: getEducAIModelForPlan("pro"),
          responseFormat: "json",
          maxTokens: 5200,
          system: [{ type: "text", text: systemPrompt, cacheable: true }],
          tools: [
            {
              name: "guardar_clase_docente",
              description:
                "Guarda una clase docente completa, editable y lista para usar en EducAI.",
              inputSchema: this.buildToolSchema(),
            },
          ],
          toolChoice: "guardar_clase_docente",
          messages: [
            {
              role: "user",
              content: this.buildUserPrompt(input),
            },
          ],
        }),
        35_000,
      );
    } catch {
      return null;
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Plan generation timed out")), timeoutMs);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error("Plan generation failed"));
        },
      );
    });
  }

  private tryParseLlmPlan(content: string): LessonPlanOutput | null {
    try {
      return this.toLegacyPlan(
        educaiLessonGuideSchema.parse(JSON.parse(this.extractJson(content))),
      );
    } catch {
      return null;
    }
  }

  private tryParseGuide(input: unknown): LessonPlanOutput | null {
    try {
      return this.toLegacyPlan(educaiLessonGuideSchema.parse(input));
    } catch {
      return null;
    }
  }

  private extractJson(content: string): string {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed;
    }

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return fenced[1].trim();
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }

    return trimmed;
  }

  private buildUserPrompt(input: PlanGeneratorInput): string {
    return [
      "Genera una planificacion docente completa con este input:",
      JSON.stringify(input, null, 2),
      "",
      "Schema obligatorio de la herramienta guardar_clase_docente:",
      JSON.stringify(
        {
          version: "educai.lesson-guide.v1",
          generadaEn: "ISO date",
          vistaDocente: {
            titulo: "Materia - tema",
            resumen: "Resumen concreto de la clase.",
            focoPedagogico: "Decision didactica central.",
            productoEsperado: "Produccion observable que queda al final.",
          },
          contextoClase: {
            nivel: input.educationLevel,
            anio: input.grade,
            materia: input.subject,
            tema: input.topic,
            intencion: input.lessonIntent || "introducir/practicar/profundizar/evaluar",
            duracionTotal: input.totalDurationMinutes,
            cantidadClases: input.sessionCount,
            supuestos: ["Supuestos reales sobre grupo, saberes previos y recursos."],
          },
          saberesClave: [
            {
              nombre: "Concepto clave del tema",
              explicacionSimple: "Explicacion breve y correcta.",
              ejemploDelTema: "Ejemplo concreto del contenido.",
              errorComun: "Error frecuente esperable.",
            },
          ],
          objetivosAprendizaje: [
            {
              objetivo: "Objetivo observable y especifico.",
              evidenciaObservable: "Como se vera que lo logro.",
            },
          ],
          secuencia: [
            {
              claseNumero: 1,
              duracion: input.sessionCount
                ? Math.round(input.totalDurationMinutes / input.sessionCount)
                : input.totalDurationMinutes,
              momentos: [
                {
                  nombre: "Apertura",
                  duracion: 10,
                  proposito: "Para que sirve este momento.",
                  consignaDocente: "Texto que el docente puede leer en clase.",
                  actividadEstudiantes: "Que hacen los estudiantes.",
                  ejemploConcreto: "Ejemplo del tema trabajado.",
                  intervencionDocente: "Que hace el docente si aparece una dificultad.",
                  cierreParcial: "Mini cierre o decision para pasar al siguiente momento.",
                },
              ],
            },
          ],
          actividadCentral: {
            titulo: "Actividad principal",
            consignaListaParaUsar: "Consigna textual completa.",
            pasos: ["Paso 1", "Paso 2"],
            produccionEsperada: "Producto observable.",
            variantes: ["Apoyo o extension concreta."],
          },
          materialesEditables: [
            {
              nombre: "Material listo para editar/imprimir",
              contenido: "Contenido exacto del material.",
              comoUsarlo: "Indicacion docente para usarlo.",
            },
          ],
          evaluacion: {
            criterios: ["Criterio observable y especifico del tema."],
            instrumento: "Lista de cotejo, rubrica breve o guia de observacion.",
            ticketSalida: "Ticket de salida textual.",
            retroalimentacionSugerida: "Como devolver feedback.",
          },
          diferenciacion: {
            apoyoFuerte: "Andamiaje concreto.",
            grupoBase: "Tarea esperada.",
            extension: "Desafio para profundizar.",
          },
          erroresFrecuentes: [
            {
              error: "Error del estudiante.",
              comoDetectarlo: "Senal observable.",
              comoIntervenir: "Intervencion docente concreta.",
            },
          ],
          recursosOpcionales: ["Recurso realista"],
        },
        null,
        2,
      ),
      "",
      "Reglas de calidad:",
      "- No uses 'pregunta disparadora' sin escribir la pregunta exacta.",
      "- No uses 'resolver un desafio' sin describir el desafio exacto.",
      "- No uses 'registrar una idea clave' sin indicar que idea o formato de ticket.",
      "- Cada momento debe incluir consigna docente, actividad estudiante, ejemplo concreto e intervencion docente.",
      "- En evaluacion, cada criterio debe nombrar el contenido del tema.",
      "- Si el tema es Normas APA, inclui citas, referencias, errores tipicos, mini textos para corregir y ticket de salida.",
    ].join("\n");
  }

  private toLegacyPlan(guide: EducaiLessonGuide): LessonPlanOutput {
    const sessions = guide.secuencia.map((session) => ({
      number: session.claseNumero,
      duration: session.duracion,
      phases: session.momentos.map((moment) => ({
        name: moment.nombre,
        duration: moment.duracion,
        activities: [
          `Proposito: ${moment.proposito}`,
          `Consigna docente: ${moment.consignaDocente}`,
          `Actividad estudiantes: ${moment.actividadEstudiantes}`,
          `Ejemplo concreto: ${moment.ejemploConcreto}`,
          `Intervencion docente: ${moment.intervencionDocente}`,
          `Cierre parcial: ${moment.cierreParcial}`,
        ],
      })),
      resources: guide.recursosOpcionales,
      differentiation: {
        low: guide.diferenciacion.apoyoFuerte,
        medium: guide.diferenciacion.grupoBase,
        high: guide.diferenciacion.extension,
      },
    }));

    return lessonPlanSchema.parse({
      overview: guide.vistaDocente.resumen,
      objectives: guide.objetivosAprendizaje.map(
        (objective) => `${objective.objetivo} Evidencia: ${objective.evidenciaObservable}`,
      ),
      competences: guide.saberesClave.map((knowledge) => knowledge.nombre),
      sessions,
      assessment: {
        rubric: guide.evaluacion.criterios,
        instruments: [
          guide.evaluacion.instrumento,
          `Ticket de salida: ${guide.evaluacion.ticketSalida}`,
          `Retroalimentacion: ${guide.evaluacion.retroalimentacionSugerida}`,
        ],
      },
      printables: guide.materialesEditables.map((material) => ({
        name: material.nombre,
        prompt: `${material.contenido}\n\nComo usarlo: ${material.comoUsarlo}`,
      })),
      guide,
    });
  }

  private buildToolSchema(): Record<string, unknown> {
    return {
      type: "object",
      additionalProperties: false,
      required: [
        "version",
        "generadaEn",
        "vistaDocente",
        "contextoClase",
        "saberesClave",
        "objetivosAprendizaje",
        "secuencia",
        "actividadCentral",
        "materialesEditables",
        "evaluacion",
        "diferenciacion",
        "erroresFrecuentes",
        "recursosOpcionales",
      ],
      properties: {
        version: { type: "string" },
        generadaEn: { type: "string" },
        vistaDocente: {
          type: "object",
          additionalProperties: false,
          required: ["titulo", "resumen", "focoPedagogico", "productoEsperado"],
          properties: {
            titulo: { type: "string" },
            resumen: { type: "string" },
            focoPedagogico: { type: "string" },
            productoEsperado: { type: "string" },
          },
        },
        contextoClase: {
          type: "object",
          additionalProperties: false,
          required: [
            "nivel",
            "anio",
            "materia",
            "tema",
            "intencion",
            "duracionTotal",
            "cantidadClases",
            "supuestos",
          ],
          properties: {
            nivel: {
              type: "string",
              enum: ["primaria", "secundaria", "terciario", "universitario"],
            },
            anio: { type: "number" },
            materia: { type: "string" },
            tema: { type: "string" },
            intencion: { type: "string" },
            duracionTotal: { type: "number" },
            cantidadClases: { type: "number" },
            supuestos: { type: "array", items: { type: "string" } },
          },
        },
        saberesClave: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["nombre", "explicacionSimple", "ejemploDelTema", "errorComun"],
            properties: {
              nombre: { type: "string" },
              explicacionSimple: { type: "string" },
              ejemploDelTema: { type: "string" },
              errorComun: { type: "string" },
            },
          },
        },
        objetivosAprendizaje: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["objetivo", "evidenciaObservable"],
            properties: {
              objetivo: { type: "string" },
              evidenciaObservable: { type: "string" },
            },
          },
        },
        secuencia: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["claseNumero", "duracion", "momentos"],
            properties: {
              claseNumero: { type: "number" },
              duracion: { type: "number" },
              momentos: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "nombre",
                    "duracion",
                    "proposito",
                    "consignaDocente",
                    "actividadEstudiantes",
                    "ejemploConcreto",
                    "intervencionDocente",
                    "cierreParcial",
                  ],
                  properties: {
                    nombre: { type: "string" },
                    duracion: { type: "number" },
                    proposito: { type: "string" },
                    consignaDocente: { type: "string" },
                    actividadEstudiantes: { type: "string" },
                    ejemploConcreto: { type: "string" },
                    intervencionDocente: { type: "string" },
                    cierreParcial: { type: "string" },
                  },
                },
              },
            },
          },
        },
        actividadCentral: {
          type: "object",
          additionalProperties: false,
          required: ["titulo", "consignaListaParaUsar", "pasos", "produccionEsperada", "variantes"],
          properties: {
            titulo: { type: "string" },
            consignaListaParaUsar: { type: "string" },
            pasos: { type: "array", items: { type: "string" } },
            produccionEsperada: { type: "string" },
            variantes: { type: "array", items: { type: "string" } },
          },
        },
        materialesEditables: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["nombre", "contenido", "comoUsarlo"],
            properties: {
              nombre: { type: "string" },
              contenido: { type: "string" },
              comoUsarlo: { type: "string" },
            },
          },
        },
        evaluacion: {
          type: "object",
          additionalProperties: false,
          required: ["criterios", "instrumento", "ticketSalida", "retroalimentacionSugerida"],
          properties: {
            criterios: { type: "array", items: { type: "string" } },
            instrumento: { type: "string" },
            ticketSalida: { type: "string" },
            retroalimentacionSugerida: { type: "string" },
          },
        },
        diferenciacion: {
          type: "object",
          additionalProperties: false,
          required: ["apoyoFuerte", "grupoBase", "extension"],
          properties: {
            apoyoFuerte: { type: "string" },
            grupoBase: { type: "string" },
            extension: { type: "string" },
          },
        },
        erroresFrecuentes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["error", "comoDetectarlo", "comoIntervenir"],
            properties: {
              error: { type: "string" },
              comoDetectarlo: { type: "string" },
              comoIntervenir: { type: "string" },
            },
          },
        },
        recursosOpcionales: { type: "array", items: { type: "string" } },
      },
    };
  }

  private buildFallbackPlan(input: PlanGeneratorInput): LessonPlanOutput {
    const sessionDuration = Math.max(
      10,
      Math.round(input.totalDurationMinutes / input.sessionCount),
    );
    const openingDuration = Math.max(5, Math.round(sessionDuration * 0.2));
    const closingDuration = Math.max(5, Math.round(sessionDuration * 0.2));
    const developmentDuration = Math.max(10, sessionDuration - openingDuration - closingDuration);
    const resources = input.availableResources
      ? input.availableResources
          .split(",")
          .map((resource) => resource.trim())
          .filter(Boolean)
      : ["Pizarron", "Cuaderno o carpeta", "Tarjetas o consignas impresas"];
    const goal =
      input.learningGoal ||
      `Que los estudiantes puedan explicar ${input.topic} y aplicarlo en una situacion de ${input.subject}.`;
    const assessmentFocus = input.assessmentFocus || `comprension y aplicacion de ${input.topic}`;

    const guide = educaiLessonGuideSchema.parse({
      version: "educai.lesson-guide.v1",
      generadaEn: new Date().toISOString(),
      vistaDocente: {
        titulo: `${input.subject} - ${input.topic}`,
        resumen: [
          `Secuencia de ${input.educationLevel} sobre ${input.topic} para ${input.subject}, pensada como borrador editable cuando la IA principal no esta disponible.`,
          input.courseLabel ? `Curso: ${input.courseLabel}.` : null,
          input.lessonIntent ? `Intencion: ${input.lessonIntent}.` : null,
          input.levelContext ? `Contexto del nivel: ${input.levelContext}.` : null,
          input.plannedDate ? `Fecha tentativa: ${input.plannedDate}.` : null,
          input.careerName ? `Carrera u orientacion: ${input.careerName}.` : null,
          input.institutionName ? `Institucion: ${input.institutionName}.` : null,
          input.groupProfile ? `Grupo: ${input.groupProfile}.` : null,
          input.curriculumContext ? `Marco curricular: ${input.curriculumContext}.` : null,
        ]
          .filter(Boolean)
          .join(" "),
        focoPedagogico: `Construir una explicacion aplicable de ${input.topic} con ejemplos, practica guiada y cierre formativo.`,
        productoEsperado: `Produccion breve donde cada estudiante resuelve o explica una situacion de ${input.topic}.`,
      },
      contextoClase: {
        nivel: input.educationLevel,
        anio: input.grade,
        materia: input.subject,
        tema: input.topic,
        intencion: input.lessonIntent || "trabajar el tema con practica guiada",
        duracionTotal: input.totalDurationMinutes,
        cantidadClases: input.sessionCount,
        supuestos: [
          input.priorKnowledge ||
            `El grupo tiene saberes iniciales heterogeneos sobre ${input.topic}.`,
        ],
      },
      saberesClave: [
        {
          nombre: input.topic,
          explicacionSimple: `${input.topic} es el contenido central de la clase y se trabaja con explicacion, ejemplo y practica.`,
          ejemploDelTema: `Ejemplo modelado por el docente sobre ${input.topic} aplicado a ${input.subject}.`,
          errorComun: `Confundir pasos, condiciones o vocabulario propio de ${input.topic}.`,
        },
        {
          nombre: `Vocabulario de ${input.subject}`,
          explicacionSimple: `Nombrar correctamente las decisiones ayuda a justificar el procedimiento.`,
          ejemploDelTema: `El estudiante explica que hizo, por que lo hizo y como verifica el resultado.`,
          errorComun: "Resolver sin poder explicar el criterio usado.",
        },
      ],
      objetivosAprendizaje: [
        {
          objetivo: goal,
          evidenciaObservable: `Explica o resuelve una situacion de ${input.topic}.`,
        },
        {
          objetivo: `Usar vocabulario propio de ${input.subject} para justificar decisiones.`,
          evidenciaObservable: "Comunica pasos, criterios y dudas de manera comprensible.",
        },
      ],
      secuencia: Array.from({ length: input.sessionCount }, (_, index) => ({
        claseNumero: index + 1,
        duracion: sessionDuration,
        momentos: [
          {
            nombre: "Apertura",
            duracion: openingDuration,
            proposito: `Activar ideas previas y ubicar el foco de ${input.topic}.`,
            consignaDocente: `Escribi en el pizarron: "Que sabemos de ${input.topic} y donde aparece en ${input.subject}?". Pedi dos ejemplos y anotalos sin corregir todavia.`,
            actividadEstudiantes:
              "Responden con ejemplos breves y escuchan diferencias entre respuestas.",
            ejemploConcreto: `Usa un caso simple de ${input.topic} para mostrar que se espera observar en la clase.`,
            intervencionDocente:
              "Si aparecen respuestas vagas, pedir que agreguen un ejemplo o expliquen de donde sale.",
            cierreParcial: `Presenta el objetivo de la clase: ${goal}`,
          },
          {
            nombre: "Desarrollo",
            duracion: developmentDuration,
            proposito: `Practicar ${input.topic} con andamiaje y produccion observable.`,
            consignaDocente: `Ahora resolvemos un caso de ${input.topic}. Primero observen mi ejemplo, despues prueban uno similar y finalmente justifican una decision por escrito.`,
            actividadEstudiantes: `Resuelven una consigna graduada sobre ${input.topic} y justifican el procedimiento.`,
            ejemploConcreto: `Caso guiado de ${input.topic} con pasos visibles y vocabulario de ${input.subject}.`,
            intervencionDocente:
              "Circular, pedir evidencia de cada paso y comparar una estrategia correcta con un error frecuente.",
            cierreParcial:
              "Seleccionar dos producciones para revisar criterios de calidad antes del cierre.",
          },
          {
            nombre: "Cierre",
            duracion: closingDuration,
            proposito: "Recolectar evidencia breve para decidir el siguiente paso didactico.",
            consignaDocente: `Ticket de salida: "Explica en 3 pasos como trabajaste ${input.topic} y marca una decision que todavia te cuesta justificar".`,
            actividadEstudiantes:
              "Completan el ticket de salida individual y entregan su produccion.",
            ejemploConcreto: `Una respuesta esperada nombra ${input.topic}, muestra un paso y justifica una decision.`,
            intervencionDocente: `Recoger dos respuestas para decidir si la proxima clase conviene practicar, profundizar o revisar ${input.topic}.`,
            cierreParcial: "Guardar evidencias y registrar dudas recurrentes.",
          },
        ],
      })),
      actividadCentral: {
        titulo: `Practica guiada sobre ${input.topic}`,
        consignaListaParaUsar: `Resolver una situacion de ${input.topic}, explicar el procedimiento usado y marcar una duda o decision dificil.`,
        pasos: [
          "Leer la consigna y subrayar los datos o ideas clave.",
          "Resolver el caso guiado con apoyo del docente.",
          "Resolver un caso similar en pareja o individual.",
          "Justificar una decision con vocabulario de la materia.",
        ],
        produccionEsperada: `Resolucion o explicacion breve sobre ${input.topic} con evidencia de procedimiento.`,
        variantes: [
          `Con apoyo: plantilla de pasos y ejemplo resuelto de ${input.topic}.`,
          `Extension: crear una variante del caso y justificarla.`,
        ],
      },
      materialesEditables: [
        {
          nombre: `Guia de practica sobre ${input.topic}`,
          contenido: `Tres consignas graduadas sobre ${input.topic}: una guiada, una de practica autonoma y una de transferencia a ${input.subject}. Incluir espacio para justificar el procedimiento.`,
          comoUsarlo:
            "Entregar durante el desarrollo, revisar una respuesta en comun y usar el cierre como evidencia.",
        },
      ],
      evaluacion: {
        criterios: [
          `Reconoce los elementos centrales de ${input.topic}.`,
          `Explica el procedimiento usado para trabajar ${input.topic}.`,
          `Aplica ${input.topic} en una situacion contextualizada.`,
          `Comunica dudas o decisiones usando vocabulario de ${input.subject}.`,
          `Foco docente: ${assessmentFocus}.`,
        ],
        instrumento: "Lista de cotejo sobre produccion individual o grupal.",
        ticketSalida: `Explica en 3 pasos como trabajaste ${input.topic} y marca una decision que todavia te cuesta justificar.`,
        retroalimentacionSugerida: `Devolver una fortaleza, una correccion puntual y un proximo paso sobre ${input.topic}.`,
      },
      diferenciacion: {
        apoyoFuerte:
          input.inclusionNeeds ||
          `Dar una plantilla de pasos para trabajar ${input.topic}, ejemplo resuelto visible y chequeos breves.`,
        grupoBase: `Resolver una situacion nueva sobre ${input.topic} y explicar el procedimiento usado.`,
        extension: `Crear una variante del problema sobre ${input.topic}, resolverla y justificar por que funciona.`,
      },
      erroresFrecuentes: [
        {
          error: `Responder sobre ${input.topic} con una frase general sin ejemplo.`,
          comoDetectarlo: "La respuesta no nombra datos, pasos ni evidencia del contenido.",
          comoIntervenir:
            "Pedir que agregue un ejemplo concreto y senale en que parte de la consigna aparece.",
        },
        {
          error: `Aplicar un procedimiento de ${input.topic} sin justificarlo.`,
          comoDetectarlo: "El resultado aparece sin explicacion o con vocabulario impreciso.",
          comoIntervenir:
            "Pedir que reconstruya el procedimiento en dos pasos y nombre la decision clave.",
        },
      ],
      recursosOpcionales: resources,
    });

    return this.toLegacyPlan(guide);
  }
}
