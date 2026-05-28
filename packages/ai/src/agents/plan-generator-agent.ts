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

export type LessonPlanGenerationSource = "llm" | "fallback";

export interface LessonPlanGenerationResult {
  plan: LessonPlanOutput;
  source: LessonPlanGenerationSource;
  fallbackReason?: string;
}

const PLAN_GENERATION_TIMEOUT_MS = readPositiveIntegerEnv(
  "LESSON_PLAN_GENERATION_TIMEOUT_MS",
  360_000,
);
const PLAN_GENERATION_MAX_TOKENS = 12_000;

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
    return (await this.generateWithMetadata(input)).plan;
  }

  async generateWithMetadata(input: PlanGeneratorInput): Promise<LessonPlanGenerationResult> {
    const result = await this.tryGenerateWithLlm(input);

    if (!result.output) {
      return {
        plan: this.buildFallbackPlan(input),
        source: "fallback",
        fallbackReason: result.reason,
      };
    }

    const parsed = this.tryParseLlmPlan(result.output.content, input);
    if (parsed) {
      return { plan: parsed, source: "llm" };
    }

    const toolPlan = this.tryParseGuide(result.output.toolUse?.input, input);
    if (toolPlan) {
      return { plan: toolPlan, source: "llm" };
    }

    return {
      plan: this.buildFallbackPlan(input),
      source: "fallback",
      fallbackReason:
        result.output.stopReason === "max_tokens" ? "max_tokens" : "invalid_llm_response",
    };
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

      const output = await this.withTimeout(
        this.llm.generate({
          model: getEducAIModelForPlan("pro"),
          responseFormat: "json",
          maxTokens: PLAN_GENERATION_MAX_TOKENS,
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
        PLAN_GENERATION_TIMEOUT_MS,
      );
      return { output };
    } catch (error) {
      const reason =
        error instanceof Error && error.message === "Plan generation timed out"
          ? "timeout"
          : "llm_unavailable";
      return { output: null, reason };
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

  private tryParseLlmPlan(content: string, input: PlanGeneratorInput): LessonPlanOutput | null {
    try {
      return this.toLegacyPlan(
        educaiLessonGuideSchema.parse(
          this.normalizeGuideCandidate(JSON.parse(this.extractJson(content)), input),
        ),
      );
    } catch {
      return null;
    }
  }

  private tryParseGuide(candidate: unknown, input: PlanGeneratorInput): LessonPlanOutput | null {
    try {
      return this.toLegacyPlan(
        educaiLessonGuideSchema.parse(this.normalizeGuideCandidate(candidate, input)),
      );
    } catch {
      return null;
    }
  }

  private normalizeGuideCandidate(candidate: unknown, input: PlanGeneratorInput): unknown {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return candidate;
    }

    const guide = { ...(candidate as Record<string, unknown>) };

    if (typeof guide.evaluacion === "string") {
      guide.evaluacion = {
        criterios: [guide.evaluacion],
        instrumento: "Lista de cotejo breve sobre la produccion de clase.",
        ticketSalida: `Escribi una decision clave sobre ${input.topic} y justificá cómo la aplicaste.`,
        retroalimentacionSugerida:
          "Devolver una fortaleza, una correccion puntual y un proximo paso para mejorar.",
      };
    }

    if (typeof guide.diferenciacion === "string") {
      guide.diferenciacion = {
        apoyoFuerte: guide.diferenciacion,
        grupoBase: `Resolver la actividad central sobre ${input.topic} con la consigna base.`,
        extension: `Agregar una variante o mejora justificada sobre ${input.topic}.`,
      };
    }

    if (typeof guide.materialesEditables === "string") {
      guide.materialesEditables = [
        {
          nombre: `Material editable sobre ${input.topic}`,
          contenido: guide.materialesEditables,
          comoUsarlo: "Entregar durante el desarrollo y revisar una respuesta en comun.",
        },
      ];
    }

    if (typeof guide.secuencia === "string") {
      const sessionDuration = Math.max(
        10,
        Math.round(input.totalDurationMinutes / input.sessionCount),
      );
      const openingDuration = Math.max(5, Math.round(sessionDuration * 0.2));
      const closingDuration = Math.max(5, Math.round(sessionDuration * 0.2));
      const developmentDuration = Math.max(10, sessionDuration - openingDuration - closingDuration);

      guide.secuencia = [
        {
          claseNumero: 1,
          duracion: sessionDuration,
          momentos: [
            {
              nombre: "Apertura",
              duracion: openingDuration,
              proposito: `Ubicar el sentido de ${input.topic} en ${input.subject}.`,
              consignaDocente: `Presenta el proposito de la clase y pedi un ejemplo inicial sobre ${input.topic}.`,
              actividadEstudiantes:
                "Comparten ideas previas y registran una duda concreta para revisar durante la clase.",
              ejemploConcreto: `Ejemplo inicial de ${input.topic} conectado con el contexto del curso.`,
              intervencionDocente:
                "Ordenar respuestas, recuperar vocabulario preciso y dejar visible el criterio de trabajo.",
              cierreParcial: "Nombrar que se va a producir y como se evaluara.",
            },
            {
              nombre: "Desarrollo",
              duracion: developmentDuration,
              proposito: `Trabajar ${input.topic} con una consigna concreta y evidencia observable.`,
              consignaDocente: guide.secuencia,
              actividadEstudiantes:
                "Resuelven la consigna, justifican decisiones y revisan una produccion con criterios comunes.",
              ejemploConcreto: `Produccion o resolucion modelada sobre ${input.topic}.`,
              intervencionDocente:
                "Circular, pedir evidencia de cada decision y comparar una respuesta lograda con un error frecuente.",
              cierreParcial: "Seleccionar una produccion para revisar criterios antes del cierre.",
            },
            {
              nombre: "Cierre",
              duracion: closingDuration,
              proposito: "Recoger evidencia breve y definir proximo paso.",
              consignaDocente: `Ticket de salida: escribi que aprendiste sobre ${input.topic}, aplica una regla o criterio y marca una duda.`,
              actividadEstudiantes:
                "Completan el ticket de salida individual y entregan la produccion de la clase.",
              ejemploConcreto: `Respuesta esperada que aplica ${input.topic} y justifica una decision.`,
              intervencionDocente:
                "Agrupar dudas recurrentes para decidir si conviene practicar, revisar o profundizar.",
              cierreParcial: "Guardar evidencias y registrar ajustes para la proxima clase.",
            },
          ],
        },
      ];
    }

    if (typeof guide.erroresFrecuentes === "string") {
      guide.erroresFrecuentes = [
        {
          error: guide.erroresFrecuentes,
          comoDetectarlo: "La produccion muestra el problema de forma observable.",
          comoIntervenir: "Pedir una revision puntual usando el ejemplo trabajado en clase.",
        },
      ];
    }

    if (typeof guide.recursosOpcionales === "string") {
      guide.recursosOpcionales = [guide.recursosOpcionales];
    }

    if (!isRecord(guide.recursosDidacticos)) {
      guide.recursosDidacticos = this.buildDefaultTeachingResources(input);
    } else {
      const resources = { ...guide.recursosDidacticos };
      if (typeof resources.adecuacionNivel !== "string") {
        resources.adecuacionNivel = this.buildLevelFitText(input);
      }
      if (!Array.isArray(resources.recomendacionesClase)) {
        resources.recomendacionesClase = [
          `Elegir ejemplos y vocabulario acordes a ${this.describeLevel(input)}.`,
          `Conectar ${input.topic} con situaciones reales de ${input.subject} y del curso.`,
        ];
      }
      if (!Array.isArray(resources.imagenesSugeridas)) {
        resources.imagenesSugeridas = this.buildDefaultTeachingResources(input).imagenesSugeridas;
      }
      if (!Array.isArray(resources.videosSugeridos)) {
        resources.videosSugeridos = this.buildDefaultTeachingResources(input).videosSugeridos;
      }
      guide.recursosDidacticos = resources;
    }

    return guide;
  }

  private buildDefaultTeachingResources(input: PlanGeneratorInput) {
    return {
      adecuacionNivel: this.buildLevelFitText(input),
      recomendacionesClase: [
        `Usar ejemplos cercanos a ${this.describeLevel(input)} y evitar materiales pensados para otro nivel educativo.`,
        `Antes de proyectar un recurso externo, verificar duracion, vocabulario y que el ejemplo coincida con ${input.topic}.`,
      ],
      imagenesSugeridas: [
        {
          titulo: `Imagen disparadora sobre ${input.topic}`,
          descripcion: `Una imagen clara que muestre una situacion reconocible de ${input.topic} en ${input.subject}.`,
          usoDidactico:
            "Usarla al inicio para pedir observaciones concretas antes de presentar la regla o procedimiento.",
          busquedaSugerida: `${input.topic} ${input.subject} secundaria ejemplo visual`,
        },
      ],
      videosSugeridos: [
        {
          titulo: `Video breve sobre ${input.topic}`,
          busquedaYoutube: `${input.topic} ${input.subject} ${input.educationLevel} explicacion`,
          criterioSeleccion:
            "Elegir videos de menos de 8 minutos, con ejemplos claros, sin exceso de publicidad y con lenguaje adecuado para el curso.",
          momentoUso:
            "Usarlo como apoyo despues de la primera explicacion docente o como repaso domiciliario.",
        },
      ],
    };
  }

  private buildLevelFitText(input: PlanGeneratorInput): string {
    return `La propuesta debe ajustarse a ${this.describeLevel(input)}: consignas concretas, vocabulario de ${input.subject}, ejemplos cercanos al curso y nivel de autonomia esperable para esa edad.`;
  }

  private describeLevel(input: PlanGeneratorInput): string {
    const course = input.courseLabel ? `${input.courseLabel}, ` : "";
    const context = input.levelContext ? ` (${input.levelContext})` : "";
    return `${course}${input.grade}° año de ${input.educationLevel}${context}`;
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
      "Usa la herramienta guardar_clase_docente y completa todos los campos requeridos del schema.",
      "Estructura esperada: vistaDocente, contextoClase, saberesClave, objetivosAprendizaje, secuencia, actividadCentral, materialesEditables, evaluacion, diferenciacion, recursosDidacticos, erroresFrecuentes y recursosOpcionales.",
      "Cada sesion debe tener momentos con nombre, duracion, proposito, consignaDocente, actividadEstudiantes, ejemploConcreto, intervencionDocente y cierreParcial.",
      "",
      "Reglas de calidad:",
      "- No uses 'pregunta disparadora' sin escribir la pregunta exacta.",
      "- No uses 'resolver un desafio' sin describir el desafio exacto.",
      "- No uses 'registrar una idea clave' sin indicar que idea o formato de ticket.",
      "- Cada momento debe incluir consigna docente, actividad estudiante, ejemplo concreto e intervencion docente.",
      "- En evaluacion, cada criterio debe nombrar el contenido del tema.",
      "- Si el tema es Normas APA, inclui citas, referencias, errores tipicos, mini textos para corregir y ticket de salida.",
      "- Reconoce el curso, edad aproximada, nivel educativo, orientacion/carrera y contexto informado; no recomiendes recursos infantiles para secundaria ni universitarios para primaria.",
      "- Inclui recomendaciones de clase, imagenes sugeridas y videos de YouTube como busquedas/criterios, no como URLs inventadas.",
      "- Mantene la guia completa pero acotada: maximo 3 saberes clave, 2 objetivos, 1 actividad central, 1 material editable, 4 criterios de evaluacion y 3 errores frecuentes.",
      "- En cada campo textual escribi contenido concreto de aula, pero no parrafos largos. Prioriza consignas listas para usar, ejemplos y evidencia.",
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
        "recursosDidacticos",
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
        recursosDidacticos: {
          type: "object",
          additionalProperties: false,
          required: [
            "adecuacionNivel",
            "recomendacionesClase",
            "imagenesSugeridas",
            "videosSugeridos",
          ],
          properties: {
            adecuacionNivel: { type: "string" },
            recomendacionesClase: { type: "array", items: { type: "string" } },
            imagenesSugeridas: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["titulo", "descripcion", "usoDidactico", "busquedaSugerida"],
                properties: {
                  titulo: { type: "string" },
                  descripcion: { type: "string" },
                  usoDidactico: { type: "string" },
                  busquedaSugerida: { type: "string" },
                },
              },
            },
            videosSugeridos: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["titulo", "busquedaYoutube", "criterioSeleccion", "momentoUso"],
                properties: {
                  titulo: { type: "string" },
                  busquedaYoutube: { type: "string" },
                  criterioSeleccion: { type: "string" },
                  momentoUso: { type: "string" },
                },
              },
            },
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
    const isApaTopic = /\bapa\b|normas apa|cita bibliografica|referencia bibliografica/i.test(
      input.topic,
    );
    const keyKnowledge = isApaTopic
      ? [
          {
            nombre: "Cita parentetica y cita narrativa",
            explicacionSimple:
              "La cita parentetica coloca autor y anio entre parentesis; la narrativa integra el autor en la frase y deja el anio entre parentesis.",
            ejemploDelTema:
              'Parentetica: "La lectura mejora cuando hay proposito" (Gomez, 2022). Narrativa: Gomez (2022) sostiene que la lectura mejora cuando hay proposito.',
            errorComun:
              "Poner solo el enlace, olvidar el anio o repetir una cita textual sin comillas.",
          },
          {
            nombre: "Referencia bibliografica",
            explicacionSimple:
              "La referencia permite ubicar la fuente completa al final del trabajo: autor, fecha, titulo y datos de publicacion o URL.",
            ejemploDelTema:
              "Gomez, L. (2022). Lectura academica en la escuela secundaria. Revista Aula, 18(2), 25-34.",
            errorComun:
              "Confundir cita dentro del texto con referencia final o dejar referencias que no fueron citadas.",
          },
          {
            nombre: "Parafrasis academica",
            explicacionSimple:
              "Parafrasear no es cambiar dos palabras: es explicar la idea con palabras propias y citar la fuente.",
            ejemploDelTema:
              "Si un texto dice que las TIC amplian el acceso a materiales, el estudiante escribe la idea con sus palabras y agrega (Perez, 2021).",
            errorComun: "Copiar una oracion completa sin comillas ni pagina.",
          },
        ]
      : [
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
        ];
    const centralActivity = isApaTopic
      ? {
          titulo: "Correccion de citas y referencias APA en un informe tecnico",
          consignaListaParaUsar:
            "Lean el fragmento de informe sobre seguridad informatica. Marquen donde falta citar, reescriban dos oraciones con cita parentetica o narrativa y armen la referencia final de la fuente indicada.",
          pasos: [
            "Identificar ideas que vienen de una fuente y no de una opinion propia.",
            "Elegir si conviene cita narrativa o parentetica.",
            "Reescribir el fragmento con autor y anio visibles.",
            "Armar la referencia final y comprobar que coincida con la cita usada.",
          ],
          produccionEsperada:
            "Fragmento corregido con dos citas APA y una referencia final completa.",
          variantes: [
            "Con apoyo: entregar plantilla Autor (anio), idea / idea (Autor, anio).",
            "Extension: agregar una segunda fuente y ordenar las referencias alfabeticamente.",
          ],
        }
      : {
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
        };
    const editableMaterials = isApaTopic
      ? [
          {
            nombre: "Ficha editable de practica APA",
            contenido:
              "Fuente A: Perez, M. (2021). Ciudadania digital en escuelas tecnicas. Revista Educacion y Tecnologia, 9(1), 12-20.\nFragmento a corregir: Las escuelas tecnicas necesitan ensenar ciudadania digital porque los estudiantes usan informacion de internet todo el tiempo. Esto ayuda a prevenir el plagio y mejora la escritura de informes.\nTareas: 1) Agrega una cita narrativa. 2) Agrega una cita parentetica. 3) Escribe la referencia final. 4) Explica que diferencia hay entre cita y referencia.",
            comoUsarlo:
              "Entregar durante el desarrollo, resolver el primer item en comun y usar los otros como evidencia individual.",
          },
        ]
      : [
          {
            nombre: `Guia de practica sobre ${input.topic}`,
            contenido: `Tres consignas graduadas sobre ${input.topic}: una guiada, una de practica autonoma y una de transferencia a ${input.subject}. Incluir espacio para justificar el procedimiento.`,
            comoUsarlo:
              "Entregar durante el desarrollo, revisar una respuesta en comun y usar el cierre como evidencia.",
          },
        ];
    const frequentErrors = isApaTopic
      ? [
          {
            error: "Usar una URL como si fuera una referencia APA completa.",
            comoDetectarlo:
              "La produccion solo pega un enlace y no incluye autor, fecha, titulo o fuente.",
            comoIntervenir:
              "Pedir que separen los datos de la fuente en cuatro columnas: autor, fecha, titulo y ubicacion.",
          },
          {
            error: "Copiar una frase textual sin comillas ni pagina.",
            comoDetectarlo:
              "La oracion mantiene la redaccion de la fuente pero aparece como si fuera propia.",
            comoIntervenir:
              "Pedir que elijan entre cita textual breve con comillas o parafrasis con palabras propias.",
          },
          {
            error: "Citar en el texto una fuente que no aparece en referencias.",
            comoDetectarlo:
              "La cita tiene autor y anio, pero no hay entrada final correspondiente.",
            comoIntervenir:
              "Hacer una verificacion cruzada: cada cita del texto debe tener una referencia final.",
          },
        ]
      : [
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
        ];

    const guide = educaiLessonGuideSchema.parse({
      version: "educai.lesson-guide.v1",
      generadaEn: new Date().toISOString(),
      vistaDocente: {
        titulo: `${input.subject} - ${input.topic}`,
        resumen: [
          `Secuencia de ${input.educationLevel} sobre ${input.topic} para ${input.subject}, pensada como borrador inicial editable para revisar antes de usar en clase.`,
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
      saberesClave: keyKnowledge,
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
            proposito: isApaTopic
              ? "Distinguir cita, referencia y opinion propia en un texto escolar."
              : `Activar ideas previas y ubicar el foco de ${input.topic}.`,
            consignaDocente: isApaTopic
              ? 'Mostra dos frases: "Segun Gomez (2022), la lectura mejora con un proposito" y "La lectura mejora con un proposito (Gomez, 2022)". Pregunta: cual nombra al autor dentro de la frase y cual lo deja entre parentesis?'
              : `Escribi en el pizarron: "Que sabemos de ${input.topic} y donde aparece en ${input.subject}?". Pedi dos ejemplos y anotalos sin corregir todavia.`,
            actividadEstudiantes: isApaTopic
              ? "Comparan las dos citas, nombran diferencias y anticipan para que sirve cada formato."
              : "Responden con ejemplos breves y escuchan diferencias entre respuestas.",
            ejemploConcreto: isApaTopic
              ? "Cita narrativa: Gomez (2022) afirma... Cita parentetica: ... (Gomez, 2022)."
              : `Usa un caso simple de ${input.topic} para mostrar que se espera observar en la clase.`,
            intervencionDocente: isApaTopic
              ? "Si confunden cita y referencia, escribir una cita breve en el texto y debajo la referencia completa para compararlas."
              : "Si aparecen respuestas vagas, pedir que agreguen un ejemplo o expliquen de donde sale.",
            cierreParcial: `Presenta el objetivo de la clase: ${goal}`,
          },
          {
            nombre: "Desarrollo",
            duracion: developmentDuration,
            proposito: isApaTopic
              ? "Aplicar normas APA en un fragmento de informe con fuente identificada."
              : `Practicar ${input.topic} con andamiaje y produccion observable.`,
            consignaDocente: isApaTopic
              ? "Corrijan el fragmento: agreguen una cita narrativa, una cita parentetica y la referencia final. Despues expliquen por que no alcanza con pegar la URL."
              : `Ahora resolvemos un caso de ${input.topic}. Primero observen mi ejemplo, despues prueban uno similar y finalmente justifican una decision por escrito.`,
            actividadEstudiantes: isApaTopic
              ? "Reescriben oraciones, completan la referencia y hacen control cruzado entre cita y bibliografia."
              : `Resuelven una consigna graduada sobre ${input.topic} y justifican el procedimiento.`,
            ejemploConcreto: isApaTopic
              ? "Perez (2021) senala que la ciudadania digital debe ensenarse en escuelas tecnicas. / La ciudadania digital debe ensenarse en escuelas tecnicas (Perez, 2021)."
              : `Caso guiado de ${input.topic} con pasos visibles y vocabulario de ${input.subject}.`,
            intervencionDocente: isApaTopic
              ? "Circular con tres preguntas: quien es el autor, de que anio es la fuente, aparece tambien en referencias?"
              : "Circular, pedir evidencia de cada paso y comparar una estrategia correcta con un error frecuente.",
            cierreParcial: isApaTopic
              ? "Revisar una produccion y marcar con color autor, anio, titulo y ubicacion de la fuente."
              : "Seleccionar dos producciones para revisar criterios de calidad antes del cierre.",
          },
          {
            nombre: "Cierre",
            duracion: closingDuration,
            proposito: "Recolectar evidencia breve para decidir el siguiente paso didactico.",
            consignaDocente: isApaTopic
              ? 'Ticket de salida: "Escribi una cita parentetica para una fuente de Perez de 2021 y anota que dato faltaria para armar la referencia completa".'
              : `Ticket de salida: "Explica en 3 pasos como trabajaste ${input.topic} y marca una decision que todavia te cuesta justificar".`,
            actividadEstudiantes:
              "Completan el ticket de salida individual y entregan su produccion.",
            ejemploConcreto: isApaTopic
              ? "Respuesta esperada: (Perez, 2021). Para la referencia falta titulo, fuente y URL o datos de publicacion."
              : `Una respuesta esperada nombra ${input.topic}, muestra un paso y justifica una decision.`,
            intervencionDocente: isApaTopic
              ? "Separar tickets con problemas de cita y tickets con problemas de referencia para planificar la proxima revision."
              : `Recoger dos respuestas para decidir si la proxima clase conviene practicar, profundizar o revisar ${input.topic}.`,
            cierreParcial: "Guardar evidencias y registrar dudas recurrentes.",
          },
        ],
      })),
      actividadCentral: {
        ...centralActivity,
      },
      materialesEditables: editableMaterials,
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
      recursosDidacticos: this.buildDefaultTeachingResources(input),
      erroresFrecuentes: frequentErrors,
      recursosOpcionales: resources,
    });

    return this.toLegacyPlan(guide);
  }
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? Math.max(value, fallback) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
