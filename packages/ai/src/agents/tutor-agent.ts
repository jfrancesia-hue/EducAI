import { buildTutorSystemBlocks } from "../prompts/tutor-system.js";
import {
  filterStudentContent,
  inferRecommendedAction,
  type ContentSafetyResult,
  type RecommendedAction,
} from "../safety/content-filter.js";
import { DeterministicLlmClient } from "../llm/types.js";
import type { LlmClient, LlmGenerateOutput } from "../llm/types.js";
import { getApoyoAIModelForPlan } from "../plans.js";

export interface TutorAgentInput {
  studentName: string;
  grade: number;
  subject: string;
  message: string;
  learningStyle?: string;
  recentHistory?: string;
  curriculumContext?: string;
}

export interface TutorAgentResponse {
  content: string;
  tokensUsed: number;
  modelUsed: string;
  competences: string[];
  safety: ContentSafetyResult;
  recommendedAction: RecommendedAction;
  cache?: {
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  /**
   * Marcado true cuando la respuesta no proviene del LLM porque el filtro
   * de seguridad la cortó (crisis, contenido bloqueado, etc.).
   */
  bypassedLlm?: boolean;
}

const CRISIS_RESPONSE_TEMPLATE = (studentName: string): string =>
  `${studentName}, lo que me contás es muy importante y no podés atravesarlo en soledad. ` +
  `Por favor buscá AHORA a un adulto de confianza: tu mamá, tu papá, una abuela, una tía, ` +
  `tu tutor/a del cole o algún adulto que sientas seguro. ` +
  `También podés llamar gratis al 102, una línea solo para chicos y chicas en Argentina ` +
  `que te van a escuchar en serio. ¿Hay alguien cerca tuyo a quien puedas avisarle ahora mismo?`;

export interface TutorAgentOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class TutorAgent {
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(
    private readonly llm: LlmClient = new DeterministicLlmClient(),
    options: TutorAgentOptions = {},
  ) {
    this.model = options.model ?? getApoyoAIModelForPlan("free");
    this.maxTokens = options.maxTokens ?? 700;
  }

  async respond(input: TutorAgentInput): Promise<TutorAgentResponse> {
    const safety = filterStudentContent(input.message);
    const recommendedAction = inferRecommendedAction(safety);

    if (safety.status === "escalate") {
      return {
        content: CRISIS_RESPONSE_TEMPLATE(input.studentName),
        tokensUsed: 0,
        modelUsed: "safety-filter",
        competences: [],
        safety,
        recommendedAction,
        bypassedLlm: true,
      };
    }

    const systemBlocks = buildTutorSystemBlocks(input);
    const userMessage = this.composeUserMessage(input, recommendedAction);

    const result = await this.llm.generate({
      model: this.model,
      maxTokens: this.maxTokens,
      system: systemBlocks,
      messages: [{ role: "user", content: userMessage }],
    });

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      modelUsed: result.modelUsed,
      competences: inferCompetences(input.message),
      safety,
      recommendedAction,
      cache: result.cache,
    };
  }

  private composeUserMessage(input: TutorAgentInput, action: RecommendedAction): string {
    const hint = this.actionHint(action);
    const messageBlock = `Mensaje del alumno: """${input.message.trim()}"""`;
    return hint ? `${hint}\n\n${messageBlock}` : messageBlock;
  }

  private actionHint(action: RecommendedAction): string | null {
    switch (action) {
      case "de_escalate":
        return "Contexto: el alumno muestra señales de frustración. Bajá la dificultad, validá el esfuerzo sin halagar talento, y proponé un primer paso pequeño y concreto.";
      case "redirect_off_topic":
        return "Contexto: el alumno se desvió del tema escolar. Redirigí cálidamente a la materia con una pregunta que conecte el desvío con el contenido.";
      case "consolidate":
        return "Contexto: el alumno parece haber comprendido. Antes de avanzar, proponé un ejercicio de consolidación con dificultad similar.";
      default:
        return null;
    }
  }
}

function inferCompetences(message: string): string[] {
  const competences = new Set<string>();
  if (/\b(por\s*qu[eé]|porque|explica|justific)/i.test(message)) {
    competences.add("comprension");
    competences.add("argumentacion");
  }
  if (
    /\b(resolver|resuelv|cuenta|problema|ejercicio|calcul|sum[oao]|rest[oao]|multiplic|divid|fracci|c[oó]mo\s+(hago|saco|saqu[eé]))/i.test(
      message,
    )
  ) {
    competences.add("aplicacion");
    competences.add("razonamiento");
  }
  if (/\b(comparar|diferencia|similitud|vs)\b/i.test(message)) {
    competences.add("analisis");
  }
  if (competences.size === 0) {
    competences.add("comprension");
  }
  return Array.from(competences);
}

export { LlmGenerateOutput };
