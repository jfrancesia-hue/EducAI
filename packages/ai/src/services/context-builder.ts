export interface StudentLearningContext {
  studentName: string;
  grade: number;
  subject: string;
  learningStyle?: string;
  recentHistory?: string[];
  curriculumSnippets?: string[];
}

export interface ContextBuilderOptions {
  maxHistoryEntries?: number;
  maxCurriculumSnippets?: number;
  maxApproxTokens?: number;
}

const DEFAULT_HISTORY = 8;
const DEFAULT_CURRICULUM = 5;
const DEFAULT_MAX_TOKENS = 1500;

/**
 * Arma el bloque de contexto del alumno (perfil + historial + curriculum)
 * que va al system prompt dinámico del tutor. Comprime si supera el budget.
 */
export class ContextBuilder {
  private readonly maxHistory: number;
  private readonly maxCurriculum: number;
  private readonly maxApproxTokens: number;

  constructor(options: ContextBuilderOptions = {}) {
    this.maxHistory = options.maxHistoryEntries ?? DEFAULT_HISTORY;
    this.maxCurriculum = options.maxCurriculumSnippets ?? DEFAULT_CURRICULUM;
    this.maxApproxTokens = options.maxApproxTokens ?? DEFAULT_MAX_TOKENS;
  }

  build(input: StudentLearningContext): string {
    const recentHistory = (input.recentHistory ?? []).slice(-this.maxHistory).join("\n");
    const curriculum = (input.curriculumSnippets ?? []).slice(0, this.maxCurriculum).join("\n");

    const sections = [
      `Alumno: ${input.studentName}`,
      `Grado: ${input.grade}`,
      `Materia: ${input.subject}`,
      `Estilo: ${input.learningStyle ?? "no informado"}`,
      recentHistory ? `Historial:\n${recentHistory}` : "",
      curriculum ? `Currículo relevante:\n${curriculum}` : "",
    ].filter(Boolean);

    const result = sections.join("\n\n");
    return this.compressIfNeeded(result);
  }

  private compressIfNeeded(text: string): string {
    if (this.approxTokens(text) <= this.maxApproxTokens) {
      return text;
    }
    const targetChars = this.maxApproxTokens * 4;
    return `${text.slice(0, targetChars)}\n\n[... contexto truncado para respetar el límite de tokens ...]`;
  }

  private approxTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
