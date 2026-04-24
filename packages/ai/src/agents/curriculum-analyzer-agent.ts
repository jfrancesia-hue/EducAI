import { z } from "zod";
import type { LlmClient } from "../llm/types.js";
import { DeterministicLlmClient } from "../llm/types.js";

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

    await this.llm.generate({
      model: "claude-3-5-sonnet-latest",
      responseFormat: "json",
      messages: [
        {
          role: "system",
          content:
            "Analiza curriculos con tono constructivo. Compara contra UNESCO 2030, OCDE Learning Compass y marcos modernos. Devolve JSON validable.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    return [
      curriculumGapSchema.parse({
        category: "competencia_ausente",
        severity: "medium",
        description: "Hay oportunidad de explicitar competencias de pensamiento critico y transferencia.",
        recommendation: "Agregar desempenos observables por unidad y evidencias de aprendizaje.",
        referenceFramework: "UNESCO 2030",
      }),
    ];
  }
}

