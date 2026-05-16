import { Injectable } from "@nestjs/common";
import {
  DiagnosticService,
  type DiagnosticQuestion,
  type DiagnosticReport,
  type DiagnosticState,
} from "@educai/ai";
import { Prisma } from "@educai/database";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

export type DiagnosticAction =
  | { kind: "start_or_resume"; question: DiagnosticQuestion; resumed: boolean }
  | { kind: "next_question"; question: DiagnosticQuestion }
  | { kind: "completed"; report: DiagnosticReport }
  | { kind: "cant_understand"; lastQuestion: DiagnosticQuestion }
  | { kind: "already_completed" };

const ANSWER_LETTER_PATTERN = /^\s*([abcd])\s*([).:-])?/i;
const FEEDBACK_VARIANTS = [
  "Buena, anotado.",
  "Vamos bien, seguimos.",
  "Tomé tu respuesta.",
  "Listo, vamos con la próxima.",
  "Vamos por la siguiente.",
];

/**
 * Adaptador del DiagnosticService de @educai/ai al canal WhatsApp:
 *
 * - Persiste el state en StudentProfile.diagnosticState entre interacciones.
 * - Formatea preguntas con opciones A/B/C/D para que el alumno responda con
 *   la letra (parsea variantes "A)", "a.", "  B  ", etc.).
 * - Responde feedback motivador SIN revelar correcto/incorrecto (regla
 *   pedagógica del prompt: para no desmotivar).
 */
@Injectable()
export class DiagnosticHandlerService {
  constructor(
    private readonly diagnostic: DiagnosticService,
    private readonly prisma: PrismaService,
  ) {}

  isInProgress(diagnosticState: unknown): boolean {
    return this.parseState(diagnosticState) != null;
  }

  async startOrResume(student: ResolvedStudent): Promise<DiagnosticAction> {
    if (student.diagnosticCompleted) {
      return { kind: "already_completed" };
    }

    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: student.studentProfileId },
      select: { diagnosticState: true },
    });
    const existing = this.parseState(profile?.diagnosticState ?? null);
    const state = existing ?? this.diagnostic.start(student.studentProfileId, student.grade);

    const question = await this.diagnostic.nextQuestion(state);
    if (!question) {
      const report = await this.completeDiagnostic(student, state);
      return { kind: "completed", report };
    }

    await this.persistState(student.studentProfileId, state);

    return {
      kind: "start_or_resume",
      question,
      resumed: existing != null,
    };
  }

  async handleAnswer(student: ResolvedStudent, rawMessage: string): Promise<DiagnosticAction> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: student.studentProfileId },
      select: { diagnosticState: true },
    });
    const state = this.parseState(profile?.diagnosticState ?? null);
    if (!state) {
      // El handler asume que el orchestrator ya verificó isInProgress, pero
      // por consistencia: si llega acá sin state, arrancamos uno nuevo.
      return this.startOrResume(student);
    }

    const lastQuestion = state.questions[state.questions.length - 1];
    if (!lastQuestion) {
      return this.startOrResume(student);
    }

    const letter = this.parseAnswerLetter(rawMessage);
    if (!letter) {
      return {
        kind: "cant_understand",
        lastQuestion: this.toPublicQuestion(lastQuestion),
      };
    }

    const updated = this.diagnostic.registerAnswer(state, lastQuestion.id, letter);

    if (updated.completed) {
      const report = await this.completeDiagnostic(student, updated);
      return { kind: "completed", report };
    }

    const nextQuestion = await this.diagnostic.nextQuestion(updated);
    if (!nextQuestion) {
      const report = await this.completeDiagnostic(student, updated);
      return { kind: "completed", report };
    }

    await this.persistState(student.studentProfileId, updated);

    return { kind: "next_question", question: nextQuestion };
  }

  formatQuestionMessage(
    question: DiagnosticQuestion,
    progress: { answered: number; total: number },
    intro?: string,
  ): string {
    const letters = ["A", "B", "C", "D"];
    const optionsText = question.options.map((opt, idx) => `${letters[idx]}) ${opt}`).join("\n");

    const lines: string[] = [];
    if (intro) {
      lines.push(intro);
      lines.push("");
    }
    lines.push(`📝 Pregunta ${progress.answered + 1} de ${progress.total}`);
    lines.push("");
    lines.push(question.prompt);
    lines.push("");
    lines.push(optionsText);
    lines.push("");
    lines.push("Respondé con la letra (A, B, C o D).");

    return lines.join("\n");
  }

  formatStartMessage(studentName: string, question: DiagnosticQuestion, resumed: boolean): string {
    const intro = resumed
      ? `¡Volviste, ${studentName}! Retomamos donde dejamos. Te doy la próxima pregunta.`
      : `¡Hola ${studentName}! Soy Mica. Vamos a conocernos mejor con un jueguito de 15 preguntas (te toma 10 minutos). No es un examen — es para saber cómo ayudarte mejor. Si una pregunta no la sabés, elegí la opción que más te convenza y seguimos.`;
    return this.formatQuestionMessage(question, { answered: 0, total: 15 }, intro);
  }

  formatNextMessage(question: DiagnosticQuestion, answered: number): string {
    const intro = this.pickFeedback();
    return this.formatQuestionMessage(question, { answered, total: 15 }, intro);
  }

  formatCantUnderstandMessage(lastQuestion: DiagnosticQuestion, answered: number): string {
    return [
      "No entendí tu respuesta. Necesito que me mandes solo una letra: A, B, C o D.",
      "",
      this.formatQuestionMessage(lastQuestion, { answered, total: 15 }),
    ].join("\n");
  }

  formatCompletedMessage(studentName: string, report: DiagnosticReport): string {
    const lines = [
      `¡Genial, ${studentName}! Terminamos el diagnóstico. 🎉`,
      "",
      report.narrative,
      "",
      `Lo que te sale bien: ${report.strengths.slice(0, 3).join(", ")}.`,
      `Donde vamos a trabajar juntos: ${report.opportunities.slice(0, 2).join(", ")}.`,
      "",
      "Cuando quieras arrancar, mandame una pregunta de matemática, lengua o ciencias y te acompaño paso a paso.",
    ];
    return lines.join("\n");
  }

  formatAlreadyCompletedMessage(studentName: string): string {
    return `${studentName}, ya hicimos el diagnóstico. Si querés practicar, mandame /ejercicio o tirame una pregunta de la materia que estás viendo.`;
  }

  private async completeDiagnostic(
    student: ResolvedStudent,
    state: DiagnosticState,
  ): Promise<DiagnosticReport> {
    const report = await this.diagnostic.summarize(state);
    await this.prisma.studentProfile.update({
      where: { id: student.studentProfileId },
      data: {
        diagnosticCompleted: true,
        diagnosticScore: report as unknown as Prisma.InputJsonValue,
        diagnosticState: Prisma.JsonNull,
        learningStyle: report.inferredLearningStyle ?? undefined,
      },
    });
    return report;
  }

  private async persistState(studentProfileId: string, state: DiagnosticState): Promise<void> {
    await this.prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        diagnosticState: state as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private parseState(raw: unknown): DiagnosticState | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const state = raw as DiagnosticState;
    if (typeof state.studentProfileId !== "string" || !Array.isArray(state.questions)) {
      return null;
    }
    return state;
  }

  private parseAnswerLetter(message: string): string | null {
    const match = ANSWER_LETTER_PATTERN.exec(message.trim());
    if (!match) {
      return null;
    }
    return match[1]?.toUpperCase() ?? null;
  }

  private pickFeedback(): string {
    const idx = Math.floor(Math.random() * FEEDBACK_VARIANTS.length);
    return FEEDBACK_VARIANTS[idx] ?? FEEDBACK_VARIANTS[0]!;
  }

  private toPublicQuestion(internal: DiagnosticState["questions"][number]): DiagnosticQuestion {
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
}
