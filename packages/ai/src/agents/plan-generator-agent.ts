import { z } from "zod";
import type { LlmClient } from "../llm/types.js";
import { DeterministicLlmClient } from "../llm/types.js";
import { getEducAIModelForPlan } from "../plans.js";

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
    const result = await this.llm.generate({
      model: getEducAIModelForPlan("pro"),
      responseFormat: "json",
      maxTokens: 2200,
      messages: [
        {
          role: "system",
          content:
            "Sos un asistente pedagogico para docentes argentinos. Genera planificaciones realistas, concretas y editables. Adapta vocabulario, complejidad, evaluacion y autonomia al nivel educativo indicado: primaria, secundaria, terciario o universitario. Ajusta la clase a la intencion didactica si viene informada: introducir, practicar, profundizar, integrar, evaluar, repasar o proyecto. Si hay fecha tentativa, usala solo para contextualizar tiempos, efemerides o calendario escolar cuando aporte. Si hay carrera, orientacion, eje, trayecto, plan de estudios, curso, comision o institucion, usalos para dar precision sin inventar datos. Usa el contexto del grupo, objetivo, saberes previos, recursos disponibles, criterios de evaluacion y necesidades de inclusion si vienen en el input. No prometas actividades imposibles con recursos no disponibles. Si falta contexto, hace supuestos conservadores y dejalos claros en overview. Devolve solo JSON valido que respete este shape: overview string, objectives string[], competences string[], sessions con number, duration, phases, resources, differentiation low/medium/high, assessment rubric/instruments y printables name/prompt.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const parsed = this.tryParseLlmPlan(result.content);
    if (parsed) {
      return parsed;
    }

    return this.buildFallbackPlan(input);
  }

  private tryParseLlmPlan(content: string): LessonPlanOutput | null {
    try {
      return lessonPlanSchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  private buildFallbackPlan(input: PlanGeneratorInput): LessonPlanOutput {
    return lessonPlanSchema.parse({
      overview: [
        `Secuencia de ${input.educationLevel} sobre ${input.topic} para ${input.subject}.`,
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
      objectives: [
        input.learningGoal || `Comprender y aplicar ${input.topic} en situaciones cercanas.`,
      ],
      competences: ["comprension", "aplicacion", "comunicacion"],
      sessions: Array.from({ length: input.sessionCount }, (_, index) => ({
        number: index + 1,
        duration: Math.round(input.totalDurationMinutes / input.sessionCount),
        phases: [
          {
            name: "Apertura",
            duration: 10,
            activities: ["Recuperar saberes previos con una pregunta disparadora."],
          },
          {
            name: "Desarrollo",
            duration: 40,
            activities: ["Resolver un desafio en grupos y comparar estrategias."],
          },
          {
            name: "Cierre",
            duration: 10,
            activities: ["Registrar una idea clave y una duda para la proxima clase."],
          },
        ],
        resources: input.availableResources
          ? input.availableResources
              .split(",")
              .map((resource) => resource.trim())
              .filter(Boolean)
          : ["Pizarron", "Tarjetas imprimibles", "Cuaderno"],
        differentiation: {
          low:
            input.inclusionNeeds ||
            "Usar material concreto, consignas paso a paso y chequeos breves de comprension.",
          medium: "Resolver problemas con una variable nueva y explicar el procedimiento.",
          high: "Crear un problema propio, justificarlo y proponer una variante.",
        },
      })),
      assessment: {
        rubric: input.assessmentFocus
          ? [input.assessmentFocus, "Explica el procedimiento", "Aplica en contexto"]
          : ["Identifica el concepto", "Explica el procedimiento", "Aplica en contexto"],
        instruments: ["Lista de cotejo", "Produccion grupal"],
      },
      printables: [
        { name: "Guia de practica", prompt: `Ejercicios graduados sobre ${input.topic}` },
      ],
    });
  }
}
