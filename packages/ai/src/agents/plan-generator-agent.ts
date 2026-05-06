import { z } from "zod";
import type { LlmClient } from "../llm/types.js";
import { DeterministicLlmClient } from "../llm/types.js";
import { buildEducAiSystemBlocks } from "../prompts/educai-institutional-system.js";

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
  grade: number;
  subject: string;
  topic: string;
  totalDurationMinutes: number;
  sessionCount: number;
  groupProfile?: string;
  curriculumContext?: string;
}

export class PlanGeneratorAgent {
  constructor(private readonly llm: LlmClient = new DeterministicLlmClient()) {}

  async generate(input: PlanGeneratorInput): Promise<LessonPlanOutput> {
    const result = await this.llm.generate({
      model: "claude-3-5-sonnet-latest",
      maxTokens: 1800,
      temperature: 0.2,
      responseFormat: "json",
      system: buildEducAiSystemBlocks(
        "Tarea: generar una planificacion docente concreta, breve, realista y editable.",
      ),
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            ...input,
            outputRules: [
              "JSON estricto sin markdown",
              "actividades de aula reales",
              "criterios observables",
              "sin relleno",
              "material listo para revision docente",
            ],
          }),
        },
      ],
    });

    const generated = parseLessonPlan(result.content);
    if (generated) {
      return generated;
    }

    return lessonPlanSchema.parse({
      overview: `Secuencia sobre ${input.topic} para ${input.subject}.`,
      objectives: [`Comprender y aplicar ${input.topic} en situaciones cercanas.`],
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
        resources: ["Pizarron", "Tarjetas imprimibles", "Cuaderno"],
        differentiation: {
          low: "Usar material concreto y consignas paso a paso.",
          medium: "Resolver problemas con una variable nueva.",
          high: "Crear un problema propio y justificarlo.",
        },
      })),
      assessment: {
        rubric: ["Identifica el concepto", "Explica el procedimiento", "Aplica en contexto"],
        instruments: ["Lista de cotejo", "Produccion grupal"],
      },
      printables: [
        { name: "Guia de practica", prompt: `Ejercicios graduados sobre ${input.topic}` },
      ],
    });
  }
}

function parseLessonPlan(content: string): LessonPlanOutput | null {
  try {
    return lessonPlanSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}
