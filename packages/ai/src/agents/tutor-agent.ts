import type { TutorResponse } from "@educai/types";
import { buildTutorSystemPrompt } from "../prompts/tutor-system";
import { filterStudentContent } from "../safety/content-filter";
import type { LlmClient } from "../llm/types";
import { DeterministicLlmClient } from "../llm/types";

export interface TutorAgentInput {
  studentName: string;
  grade: number;
  subject: string;
  message: string;
  learningStyle?: string;
  recentHistory?: string;
  curriculumContext?: string;
}

export class TutorAgent {
  constructor(
    private readonly llm: LlmClient = new DeterministicLlmClient(),
    private readonly model = "claude-3-5-sonnet-latest",
  ) {}

  async respond(input: TutorAgentInput): Promise<TutorResponse> {
    const safety = filterStudentContent(input.message);

    if (safety.status === "escalate") {
      return {
        content:
          "Gracias por contarmelo. Esto es importante y no tenes que atravesarlo en soledad. Busquemos ahora a un adulto de confianza para que pueda ayudarte en persona.",
        tokensUsed: 0,
        modelUsed: "safety-filter",
        competences: [],
        safety,
      };
    }

    const result = await this.llm.generate({
      model: this.model,
      temperature: 0.3,
      maxTokens: 700,
      messages: [
        {
          role: "system",
          content: buildTutorSystemPrompt(input),
        },
        {
          role: "user",
          content: input.message,
        },
      ],
    });

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      modelUsed: result.modelUsed,
      competences: inferCompetences(input.message),
      safety,
    };
  }
}

function inferCompetences(message: string): string[] {
  if (/por que|porque|explica/i.test(message)) {
    return ["comprension", "argumentacion"];
  }

  if (/resolver|cuenta|problema|ejercicio/i.test(message)) {
    return ["aplicacion", "razonamiento"];
  }

  return ["comprension"];
}

