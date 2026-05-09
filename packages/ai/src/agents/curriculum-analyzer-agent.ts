import { z } from "zod";
import type { LlmClient } from "../llm/types.js";
import { DeterministicLlmClient } from "../llm/types.js";
import { buildEducAiSystemBlocks } from "../prompts/educai-institutional-system.js";

export const curriculumGapSchema = z.object({
  category: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
  recommendation: z.string(),
  referenceFramework: z.string(),
});

export type CurriculumGapOutput = z.infer<typeof curriculumGapSchema>;

export interface CurriculumAnalyzerInput {
  country: string;
  schoolType: string;
  subject: string;
  grade: number;
  content: string;
}

export class CurriculumAnalyzerAgent {
  constructor(private readonly llm: LlmClient = new DeterministicLlmClient()) {}

  async analyze(input: CurriculumAnalyzerInput): Promise<CurriculumGapOutput[]> {
    if (input.content.trim().length < 30) {
      throw new Error("Curriculum content is too short to analyze");
    }

    const result = await this.llm.generate({
      model: "claude-3-5-sonnet-latest",
      maxTokens: 1400,
      temperature: 0.1,
      responseFormat: "json",
      system: buildEducAiSystemBlocks(
        "Tarea: analizar brechas curriculares con tono constructivo y recomendaciones accionables.",
      ),
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            ...input,
            outputRules: [
              "devolver array JSON",
              "maximo 6 brechas",
              "sin markdown",
              "sin inventar normativa especifica",
              "cada recomendacion debe ser accionable",
            ],
          }),
        },
      ],
    });

    const generated = parseCurriculumGaps(result.content);
    if (generated) {
      return generated;
    }

    return [
      curriculumGapSchema.parse({
        category: "competencia_ausente",
        severity: "medium",
        description:
          "Hay oportunidad de explicitar competencias de pensamiento critico y transferencia.",
        recommendation: "Agregar desempenos observables por unidad y evidencias de aprendizaje.",
        referenceFramework: "UNESCO 2030",
      }),
    ];
  }
}

function parseCurriculumGaps(content: string): CurriculumGapOutput[] | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    const gaps = Array.isArray(parsed) ? parsed : [parsed];
    return z.array(curriculumGapSchema).parse(gaps);
  } catch {
    return null;
  }
}
