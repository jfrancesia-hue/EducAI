import type { LlmCachedTextBlock, LlmClient, LlmGenerateOutput } from "../llm/types.js";
import { DeterministicLlmClient } from "../llm/types.js";

export type DiagnosticDifficulty = "low" | "medium" | "high";
export type DiagnosticSubject = "matematica" | "lengua" | "ciencias naturales";
export type DiagnosticCompetence = "comprension" | "aplicacion" | "analisis";

const SUBJECTS: DiagnosticSubject[] = ["matematica", "lengua", "ciencias naturales"];
const MAX_QUESTIONS = 15;
const ANSWERS_FOR_DIFFICULTY_ADJUSTMENT = 3;

/**
 * Pregunta visible al alumno. La respuesta correcta NO está incluida —
 * vive en `correctAnswer` dentro de `DiagnosticState.questions`.
 */
export interface DiagnosticQuestion {
  id: string;
  subject: DiagnosticSubject;
  grade: number;
  prompt: string;
  options: string[];
  expectedCompetence: DiagnosticCompetence;
  difficulty: DiagnosticDifficulty;
}

interface InternalQuestion extends DiagnosticQuestion {
  correctAnswer: string;
}

export interface DiagnosticAnswer {
  questionId: string;
  answer: string;
  correct: boolean;
  difficulty: DiagnosticDifficulty;
  subject: DiagnosticSubject;
  expectedCompetence: DiagnosticCompetence;
}

export interface DiagnosticState {
  studentProfileId: string;
  grade: number;
  currentDifficulty: DiagnosticDifficulty;
  questions: InternalQuestion[];
  answers: DiagnosticAnswer[];
  completed: boolean;
  startedAt: string;
  lastInteractionAt: string;
}

export interface SubjectScore {
  totalQuestions: number;
  correct: number;
  score: number;
  effectiveGradeLevel: number;
}

export interface DiagnosticReport {
  totalQuestions: number;
  correct: number;
  score: number;
  bySubject: Record<DiagnosticSubject, SubjectScore>;
  byCompetence: Record<
    DiagnosticCompetence,
    { totalQuestions: number; correct: number; score: number }
  >;
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
  effectiveGradeLevel: Record<DiagnosticSubject, number>;
  inferredLearningStyle: string | null;
  narrative: string;
}

export interface DiagnosticServiceOptions {
  llm?: LlmClient;
  model?: string;
  maxTokensPerQuestion?: number;
  maxTokensPerReport?: number;
}

const QUESTION_GEN_STATIC_PROMPT = `Sos generador de preguntas para una evaluación diagnóstica adaptativa de estudiantes argentinos de primaria y secundaria (4°-12° grado).

REGLAS DE GENERACIÓN:
1. Cada pregunta es de OPCIÓN MÚLTIPLE con EXACTAMENTE 4 opciones (A, B, C, D).
2. Solo UNA opción es correcta.
3. Las preguntas son COMPRENSIVAS y APLICADAS, NO memorísticas. Medir si entiende el concepto, no si lo recuerda.
4. NO usar trampas, "preguntas capciosa" ni dobles negativos.
5. Adaptar vocabulario y ejemplos al grado del alumno (primaria 4-7 vs secundaria 8-12).
6. Distribuir competencias: comprension (entender un concepto), aplicacion (resolver un problema), analisis (comparar/relacionar).
7. Las preguntas son CORTAS — máximo 3 oraciones para el enunciado.
8. NUNCA generar contenido inapropiado para menores: nada de violencia, sexual, drogas, política partidaria.

DIFICULTAD:
- low: ejercicios mecánicos básicos, vocabulario claro, números chicos.
- medium: aplicación a situación cotidiana, cálculos intermedios.
- high: análisis multi-paso, comparación, justificación.

FORMATO DE SALIDA (JSON estricto, sin markdown):
{
  "prompt": "string corto en español rioplatense",
  "options": ["texto A", "texto B", "texto C", "texto D"],
  "correctAnswer": "A" | "B" | "C" | "D",
  "expectedCompetence": "comprension" | "aplicacion" | "analisis"
}

NO incluyas explicaciones, ni la palabra "JSON", ni backticks. Solo el objeto.`;

const REPORT_STATIC_PROMPT = `Sos analista pedagógico que genera informes diagnósticos para padres de estudiantes argentinos.

Recibís el resumen estadístico de un diagnóstico inicial (puntaje por materia, competencia, grade level efectivo) y devolvés un informe estructurado para el padre/madre.

REGLAS:
1. Tono cálido, constructivo, NUNCA alarmista. Usar "vos" rioplatense con el padre/madre.
2. NO etiquetar al alumno ("retrasado", "lento") — describir el desafío puntual con esperanza.
3. Identificar 2-3 fortalezas concretas (incluso si el score es bajo, siempre hay algo).
4. Identificar 2-3 áreas de oportunidad con sugerencia de cómo trabajarlas en casa.
5. Recomendaciones accionables y simples (no "consultar especialista" como primera línea).
6. Si el score es muy bajo (<0.3), tono de esperanza y plan progresivo. Si es alto (>0.8), reforzar autonomía sin perder rigor.
7. Inferir estilo de aprendizaje (visual / auditivo / kinestesico / mixto) basado en patrón de competencias dominadas. Si no es claro, devolver null.

FORMATO DE SALIDA (JSON estricto, sin markdown):
{
  "strengths": ["string", "string", "string"],
  "opportunities": ["string", "string"],
  "recommendations": ["string", "string", "string"],
  "inferredLearningStyle": "visual" | "auditivo" | "kinestesico" | "mixto" | null,
  "narrative": "Párrafo de 4-6 oraciones para el padre/madre, en primera persona del tutor"
}

NO incluyas explicaciones extra, ni markdown, ni backticks. Solo el objeto.`;

export class DiagnosticService {
  private readonly llm: LlmClient;
  private readonly model: string;
  private readonly maxTokensPerQuestion: number;
  private readonly maxTokensPerReport: number;

  constructor(options: DiagnosticServiceOptions = {}) {
    this.llm = options.llm ?? new DeterministicLlmClient();
    this.model = options.model ?? "claude-opus-4-7";
    this.maxTokensPerQuestion = options.maxTokensPerQuestion ?? 600;
    this.maxTokensPerReport = options.maxTokensPerReport ?? 900;
  }

  start(studentProfileId: string, grade: number): DiagnosticState {
    const now = new Date().toISOString();
    return {
      studentProfileId,
      grade,
      currentDifficulty: "medium",
      questions: [],
      answers: [],
      completed: false,
      startedAt: now,
      lastInteractionAt: now,
    };
  }

  /**
   * Genera la próxima pregunta adaptativa rotando materia y respetando dificultad.
   * Retorna null cuando llegamos al límite (15 preguntas).
   * El LLM puede devolver JSON inválido — en ese caso usamos un fallback determinístico.
   */
  async nextQuestion(state: DiagnosticState): Promise<DiagnosticQuestion | null> {
    if (state.completed || state.questions.length >= MAX_QUESTIONS) {
      return null;
    }

    const subject = SUBJECTS[state.questions.length % SUBJECTS.length] ?? "matematica";
    const competence = this.pickCompetence(state.questions.length);
    const generated = await this.generateQuestion(state, subject, competence);

    state.questions.push(generated);
    return this.toPublicQuestion(generated);
  }

  /**
   * Registra la respuesta del alumno (letra A/B/C/D), determina si es correcta,
   * ajusta la dificultad para la próxima pregunta y marca completado al llegar al límite.
   */
  registerAnswer(state: DiagnosticState, questionId: string, rawAnswer: string): DiagnosticState {
    const question = state.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error(`Pregunta ${questionId} no encontrada en el estado del diagnóstico`);
    }

    const normalized = this.normalizeAnswer(rawAnswer);
    const correct = normalized === question.correctAnswer;

    const answer: DiagnosticAnswer = {
      questionId,
      answer: normalized,
      correct,
      difficulty: question.difficulty,
      subject: question.subject,
      expectedCompetence: question.expectedCompetence,
    };

    const answers = [...state.answers, answer];
    const recent = answers.slice(-ANSWERS_FOR_DIFFICULTY_ADJUSTMENT);
    const successRate = recent.filter((a) => a.correct).length / recent.length;

    const completed = answers.length >= MAX_QUESTIONS;

    return {
      ...state,
      answers,
      currentDifficulty: successRate > 0.75 ? "high" : successRate < 0.4 ? "low" : "medium",
      completed,
      lastInteractionAt: new Date().toISOString(),
    };
  }

  async summarize(state: DiagnosticState): Promise<DiagnosticReport> {
    const stats = this.computeStats(state);

    if (state.answers.length === 0) {
      return {
        ...stats,
        strengths: [],
        opportunities: [],
        recommendations: [],
        inferredLearningStyle: null,
        narrative: "Diagnóstico aún no iniciado.",
      };
    }

    const narrative = await this.generateReport(state, stats);

    return {
      ...stats,
      strengths: narrative.strengths,
      opportunities: narrative.opportunities,
      recommendations: narrative.recommendations,
      inferredLearningStyle: narrative.inferredLearningStyle,
      narrative: narrative.narrative,
    };
  }

  private pickCompetence(index: number): DiagnosticCompetence {
    const order: DiagnosticCompetence[] = ["comprension", "aplicacion", "analisis"];
    return order[index % order.length] ?? "comprension";
  }

  private toPublicQuestion(internal: InternalQuestion): DiagnosticQuestion {
    return {
      id: internal.id,
      subject: internal.subject,
      grade: internal.grade,
      prompt: internal.prompt,
      options: internal.options,
      expectedCompetence: internal.expectedCompetence,
      difficulty: internal.difficulty,
    };
  }

  private async generateQuestion(
    state: DiagnosticState,
    subject: DiagnosticSubject,
    competence: DiagnosticCompetence,
  ): Promise<InternalQuestion> {
    const userPrompt = [
      `Generá UNA pregunta diagnóstica:`,
      `- Grado: ${state.grade}`,
      `- Materia: ${subject}`,
      `- Dificultad: ${state.currentDifficulty}`,
      `- Competencia objetivo: ${competence}`,
      `- Preguntas ya hechas en el diagnóstico: ${state.questions.length}`,
      "",
      "Devolvé SOLO el objeto JSON con prompt, options (4), correctAnswer (A/B/C/D), expectedCompetence.",
    ].join("\n");

    const system: LlmCachedTextBlock[] = [
      { type: "text", text: QUESTION_GEN_STATIC_PROMPT, cacheable: true },
    ];

    const result = await this.callLlm({
      system,
      userPrompt,
      maxTokens: this.maxTokensPerQuestion,
      label: "diagnostic.question_generation",
    });

    const parsed = this.parseQuestionJson(result.content);
    const id = `${state.studentProfileId}-${state.questions.length + 1}`;

    return {
      id,
      subject,
      grade: state.grade,
      prompt: parsed.prompt,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      expectedCompetence: parsed.expectedCompetence ?? competence,
      difficulty: state.currentDifficulty,
    };
  }

  private async generateReport(
    state: DiagnosticState,
    stats: Pick<
      DiagnosticReport,
      "totalQuestions" | "correct" | "score" | "bySubject" | "byCompetence" | "effectiveGradeLevel"
    >,
  ): Promise<{
    strengths: string[];
    opportunities: string[];
    recommendations: string[];
    inferredLearningStyle: DiagnosticReport["inferredLearningStyle"];
    narrative: string;
  }> {
    const userPrompt = [
      `Resumen del diagnóstico para el padre/madre:`,
      `- Grado oficial declarado: ${state.grade}`,
      `- Total respondidas: ${stats.totalQuestions}`,
      `- Acertadas: ${stats.correct} (${(stats.score * 100).toFixed(0)}%)`,
      `- Por materia:`,
      `  · matemática: ${(stats.bySubject.matematica.score * 100).toFixed(0)}% (nivel efectivo: grado ${stats.bySubject.matematica.effectiveGradeLevel})`,
      `  · lengua: ${(stats.bySubject.lengua.score * 100).toFixed(0)}% (nivel efectivo: grado ${stats.bySubject.lengua.effectiveGradeLevel})`,
      `  · ciencias naturales: ${(stats.bySubject["ciencias naturales"].score * 100).toFixed(0)}% (nivel efectivo: grado ${stats.bySubject["ciencias naturales"].effectiveGradeLevel})`,
      `- Por competencia: comprensión ${(stats.byCompetence.comprension.score * 100).toFixed(0)}%, aplicación ${(stats.byCompetence.aplicacion.score * 100).toFixed(0)}%, análisis ${(stats.byCompetence.analisis.score * 100).toFixed(0)}%.`,
      "",
      "Devolvé SOLO el objeto JSON con strengths, opportunities, recommendations, inferredLearningStyle, narrative.",
    ].join("\n");

    const system: LlmCachedTextBlock[] = [
      { type: "text", text: REPORT_STATIC_PROMPT, cacheable: true },
    ];

    const result = await this.callLlm({
      system,
      userPrompt,
      maxTokens: this.maxTokensPerReport,
      label: "diagnostic.report_generation",
    });

    return this.parseReportJson(result.content);
  }

  private async callLlm(input: {
    system: LlmCachedTextBlock[];
    userPrompt: string;
    maxTokens: number;
    label: string;
  }): Promise<LlmGenerateOutput> {
    return this.llm.generate({
      model: this.model,
      maxTokens: input.maxTokens,
      system: input.system,
      messages: [{ role: "user", content: input.userPrompt }],
      responseFormat: "json",
    });
  }

  private parseQuestionJson(content: string): {
    prompt: string;
    options: string[];
    correctAnswer: string;
    expectedCompetence?: DiagnosticCompetence;
  } {
    const fallback = {
      prompt: "Elegí la opción que mejor resuelve la situación planteada.",
      options: ["Opción A", "Opción B", "Opción C", "Opción D"],
      correctAnswer: "A",
      expectedCompetence: "comprension" as DiagnosticCompetence,
    };

    try {
      const parsed = this.extractJson(content) as {
        prompt?: string;
        options?: string[];
        correctAnswer?: string;
        expectedCompetence?: DiagnosticCompetence;
      };
      if (
        !parsed.prompt ||
        !Array.isArray(parsed.options) ||
        parsed.options.length !== 4 ||
        !parsed.correctAnswer
      ) {
        return fallback;
      }
      const letter = this.normalizeAnswer(parsed.correctAnswer);
      if (!["A", "B", "C", "D"].includes(letter)) {
        return fallback;
      }
      return {
        prompt: parsed.prompt,
        options: parsed.options,
        correctAnswer: letter,
        expectedCompetence: parsed.expectedCompetence,
      };
    } catch {
      return fallback;
    }
  }

  private parseReportJson(content: string): {
    strengths: string[];
    opportunities: string[];
    recommendations: string[];
    inferredLearningStyle: DiagnosticReport["inferredLearningStyle"];
    narrative: string;
  } {
    const fallback = {
      strengths: ["Compromiso al completar el diagnóstico"],
      opportunities: ["Práctica guiada en las áreas más débiles"],
      recommendations: [
        "Acompañar 10 minutos al día con ejercicios cortos",
        "Validar el esfuerzo, no el resultado",
      ],
      inferredLearningStyle: null,
      narrative:
        "Tu hijo o hija completó el diagnóstico inicial. Vamos a trabajar juntos un plan personalizado.",
    };

    try {
      const parsed = this.extractJson(content) as Partial<typeof fallback>;
      return {
        strengths: parsed.strengths ?? fallback.strengths,
        opportunities: parsed.opportunities ?? fallback.opportunities,
        recommendations: parsed.recommendations ?? fallback.recommendations,
        inferredLearningStyle: parsed.inferredLearningStyle ?? null,
        narrative: parsed.narrative ?? fallback.narrative,
      };
    } catch {
      return fallback;
    }
  }

  private extractJson(content: string): unknown {
    const trimmed = content.trim();
    const stripped = trimmed.startsWith("```")
      ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
      : trimmed;
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("Respuesta del LLM no contiene un objeto JSON");
    }
    return JSON.parse(stripped.slice(start, end + 1));
  }

  private normalizeAnswer(raw: string): string {
    return raw.trim().toUpperCase().slice(0, 1);
  }

  private computeStats(
    state: DiagnosticState,
  ): Pick<
    DiagnosticReport,
    "totalQuestions" | "correct" | "score" | "bySubject" | "byCompetence" | "effectiveGradeLevel"
  > {
    const totalQuestions = state.answers.length;
    const correct = state.answers.filter((a) => a.correct).length;
    const score = totalQuestions === 0 ? 0 : correct / totalQuestions;

    const bySubject: Record<DiagnosticSubject, SubjectScore> = {
      matematica: this.subjectStats(state, "matematica"),
      lengua: this.subjectStats(state, "lengua"),
      "ciencias naturales": this.subjectStats(state, "ciencias naturales"),
    };

    const byCompetence: DiagnosticReport["byCompetence"] = {
      comprension: this.competenceStats(state, "comprension"),
      aplicacion: this.competenceStats(state, "aplicacion"),
      analisis: this.competenceStats(state, "analisis"),
    };

    const effectiveGradeLevel: Record<DiagnosticSubject, number> = {
      matematica: bySubject.matematica.effectiveGradeLevel,
      lengua: bySubject.lengua.effectiveGradeLevel,
      "ciencias naturales": bySubject["ciencias naturales"].effectiveGradeLevel,
    };

    return {
      totalQuestions,
      correct,
      score,
      bySubject,
      byCompetence,
      effectiveGradeLevel,
    };
  }

  private subjectStats(state: DiagnosticState, subject: DiagnosticSubject): SubjectScore {
    const subjectAnswers = state.answers.filter((a) => a.subject === subject);
    const totalQuestions = subjectAnswers.length;
    const correct = subjectAnswers.filter((a) => a.correct).length;
    const score = totalQuestions === 0 ? 0 : correct / totalQuestions;
    return {
      totalQuestions,
      correct,
      score,
      effectiveGradeLevel: this.estimateGradeLevel(state.grade, score),
    };
  }

  private competenceStats(state: DiagnosticState, competence: DiagnosticCompetence) {
    const filtered = state.answers.filter((a) => a.expectedCompetence === competence);
    const totalQuestions = filtered.length;
    const correct = filtered.filter((a) => a.correct).length;
    const score = totalQuestions === 0 ? 0 : correct / totalQuestions;
    return { totalQuestions, correct, score };
  }

  /**
   * Heurística simple: scores < 0.3 → 2 grados atrás, < 0.5 → 1 grado atrás,
   * < 0.7 → grado oficial, < 0.85 → grado oficial, ≥ 0.85 → 1 grado por encima.
   * No es ciencia exacta — el reporte narrativo agrega contexto.
   */
  private estimateGradeLevel(officialGrade: number, score: number): number {
    let delta = 0;
    if (score < 0.3) delta = -2;
    else if (score < 0.5) delta = -1;
    else if (score < 0.85) delta = 0;
    else delta = 1;
    return Math.max(1, Math.min(12, officialGrade + delta));
  }
}
