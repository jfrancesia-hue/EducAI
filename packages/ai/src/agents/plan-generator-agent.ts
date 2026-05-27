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
    const result = await this.tryGenerateWithLlm(input);

    if (!result) {
      return this.buildFallbackPlan(input);
    }

    const parsed = this.tryParseLlmPlan(result.content);
    if (parsed) {
      return parsed;
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
        "Devolve solo JSON valido, sin markdown, sin comentarios y sin texto alrededor.",
      ].join(" ");

      return await this.llm.generate({
        model: getEducAIModelForPlan("pro"),
        responseFormat: "json",
        maxTokens: 5200,
        system: [{ type: "text", text: systemPrompt, cacheable: true }],
        messages: [
          {
            role: "user",
            content: this.buildUserPrompt(input),
          },
        ],
      });
    } catch {
      return null;
    }
  }

  private tryParseLlmPlan(content: string): LessonPlanOutput | null {
    try {
      return lessonPlanSchema.parse(JSON.parse(this.extractJson(content)));
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
      "Shape obligatorio:",
      JSON.stringify(
        {
          overview:
            "Resumen concreto con supuestos pedagogicos, enfoque de la clase y producto esperado.",
          objectives: ["2 a 4 objetivos observables, especificos del tema."],
          competences: ["3 a 6 competencias o capacidades trabajadas."],
          sessions: [
            {
              number: 1,
              duration: input.sessionCount
                ? Math.round(input.totalDurationMinutes / input.sessionCount)
                : input.totalDurationMinutes,
              phases: [
                {
                  name: "Apertura",
                  duration: 10,
                  activities: [
                    "Consigna textual y accion docente concreta vinculada al tema.",
                    "Respuesta, produccion o intercambio esperado de estudiantes.",
                  ],
                },
              ],
              resources: ["Recursos concretos para esta sesion."],
              differentiation: {
                low: "Apoyo para estudiantes que necesitan guia fuerte.",
                medium: "Trabajo esperado para el grupo base.",
                high: "Extension desafiante para quienes avanzan rapido.",
              },
            },
          ],
          assessment: {
            rubric: [
              "Criterio observable + evidencia + nivel esperado. No uses criterios genericos.",
            ],
            instruments: ["Instrumentos concretos: ticket de salida, lista de cotejo, rubrica."],
          },
          printables: [
            {
              name: "Nombre del material listo para imprimir",
              prompt:
                "Contenido exacto o instruccion precisa para armar el material, con consignas y ejemplos.",
            },
          ],
        },
        null,
        2,
      ),
      "",
      "Reglas de calidad:",
      "- No uses 'pregunta disparadora' sin escribir la pregunta exacta.",
      "- No uses 'resolver un desafio' sin describir el desafio exacto.",
      "- No uses 'registrar una idea clave' sin indicar que idea o formato de ticket.",
      "- Para cada fase incluye al menos 2 actividades concretas.",
      "- En evaluacion, cada criterio debe nombrar el contenido del tema.",
    ].join("\n");
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

    return lessonPlanSchema.parse({
      overview: [
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
      objectives: [goal, `Usar vocabulario propio de ${input.subject} para justificar decisiones.`],
      competences: ["comprension conceptual", "aplicacion", "argumentacion", "comunicacion"],
      sessions: Array.from({ length: input.sessionCount }, (_, index) => ({
        number: index + 1,
        duration: sessionDuration,
        phases: [
          {
            name: "Apertura",
            duration: openingDuration,
            activities: [
              `Escribi en el pizarron: "Que sabemos de ${input.topic} y donde aparece en ${input.subject}?". Pedi dos ejemplos y anotalos sin corregir todavia.`,
              `Presenta el objetivo de la clase: ${goal}`,
            ],
          },
          {
            name: "Desarrollo",
            duration: developmentDuration,
            activities: [
              `Modela un ejemplo breve de ${input.topic} mostrando el procedimiento y nombrando cada decision.`,
              `Entrega una consigna graduada: primero un caso guiado, luego un caso similar y finalmente una situacion nueva vinculada a ${input.subject}.`,
              "Hace una puesta en comun comparando dos estrategias correctas y un error frecuente.",
            ],
          },
          {
            name: "Cierre",
            duration: closingDuration,
            activities: [
              `Ticket de salida: "Explica en 3 pasos como trabajaste ${input.topic} y marca una decision que todavia te cuesta justificar".`,
              `Recoge dos respuestas para decidir si la proxima clase conviene practicar, profundizar o revisar ${input.topic}.`,
            ],
          },
        ],
        resources,
        differentiation: {
          low:
            input.inclusionNeeds ||
            `Dar una plantilla de pasos para trabajar ${input.topic}, ejemplo resuelto visible y chequeos breves.`,
          medium: `Resolver una situacion nueva sobre ${input.topic} y explicar el procedimiento usado.`,
          high: `Crear una variante del problema sobre ${input.topic}, resolverla y justificar por que funciona.`,
        },
      })),
      assessment: {
        rubric: [
          `Reconoce los elementos centrales de ${input.topic}.`,
          `Explica el procedimiento usado para trabajar ${input.topic}.`,
          `Aplica ${input.topic} en una situacion contextualizada.`,
          `Comunica dudas o decisiones usando vocabulario de ${input.subject}.`,
          `Foco docente: ${assessmentFocus}.`,
        ],
        instruments: ["Ticket de salida", "Lista de cotejo", "Produccion individual o grupal"],
      },
      printables: [
        {
          name: `Guia de practica sobre ${input.topic}`,
          prompt: `Armar 3 consignas graduadas sobre ${input.topic}: una guiada, una de practica autonoma y una de transferencia a ${input.subject}. Incluir espacio para justificar el procedimiento.`,
        },
      ],
    });
  }
}
