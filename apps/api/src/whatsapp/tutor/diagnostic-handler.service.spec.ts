import { describe, expect, it, vi, beforeEach } from "vitest";
import { DiagnosticHandlerService } from "./diagnostic-handler.service.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

const STUDENT: ResolvedStudent = {
  studentId: "stu_1",
  studentName: "Mateo",
  grade: 5,
  studentProfileId: "prof_1",
  whatsappPhone: "+5493815550202",
  preferredChannel: "whatsapp",
  learningStyle: null,
  diagnosticCompleted: false,
  familyId: "fam_1",
  tenantId: "tnt_1",
  subscription: {
    id: "sub_1",
    plan: "PREMIUM",
    status: "ACTIVE",
    currentPeriodEnd: new Date(),
  },
};

const QUESTION_FIXTURE = {
  id: "prof_1-1",
  subject: "matematica" as const,
  grade: 5,
  prompt: "¿Cuánto es 1/2 + 1/4?",
  options: ["1/8", "2/4", "3/4", "1/6"],
  expectedCompetence: "aplicacion" as const,
  difficulty: "medium" as const,
};

function buildDiagnostic() {
  return {
    start: vi.fn(() => ({
      studentProfileId: STUDENT.studentProfileId,
      grade: STUDENT.grade,
      currentDifficulty: "medium",
      questions: [],
      answers: [],
      completed: false,
      startedAt: "2026-05-05T10:00:00Z",
      lastInteractionAt: "2026-05-05T10:00:00Z",
    })),
    nextQuestion: vi.fn((state: { questions: unknown[] }) => {
      const internal = { ...QUESTION_FIXTURE, correctAnswer: "C" };
      state.questions.push(internal);
      return Promise.resolve(QUESTION_FIXTURE);
    }),
    registerAnswer: vi.fn((state: { answers: unknown[] }, questionId: string, answer: string) => ({
      ...state,
      answers: [
        ...state.answers,
        {
          questionId,
          answer,
          correct: answer === "C",
          difficulty: "medium",
          subject: "matematica",
          expectedCompetence: "aplicacion",
        },
      ],
      completed: state.answers.length + 1 >= 15,
    })),
    summarize: vi.fn(() =>
      Promise.resolve({
        totalQuestions: 15,
        correct: 10,
        score: 0.66,
        bySubject: {} as never,
        byCompetence: {} as never,
        effectiveGradeLevel: {} as never,
        strengths: ["lectura", "perseverancia"],
        opportunities: ["fracciones"],
        recommendations: ["practicar 10 min/día"],
        inferredLearningStyle: "visual",
        narrative: "Buen primer paso, Mateo viene firme.",
      }),
    ),
  };
}

function buildPrisma(diagnosticState: unknown = null) {
  return {
    studentProfile: {
      findUnique: vi.fn().mockResolvedValue({ diagnosticState }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("DiagnosticHandlerService", () => {
  let diagnostic: ReturnType<typeof buildDiagnostic>;

  beforeEach(() => {
    diagnostic = buildDiagnostic();
  });

  describe("isInProgress", () => {
    it("retorna true si hay state válido", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      expect(
        handler.isInProgress({
          studentProfileId: "prof_1",
          questions: [],
          answers: [],
          completed: false,
        }),
      ).toBe(true);
    });

    it("retorna false si state es null", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      expect(handler.isInProgress(null)).toBe(false);
    });

    it("retorna false si state malformado", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      expect(handler.isInProgress({ random: "stuff" })).toBe(false);
    });
  });

  describe("startOrResume", () => {
    it("arranca diagnóstico nuevo cuando no hay state previo", async () => {
      const prisma = buildPrisma(null);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      const action = await handler.startOrResume(STUDENT);

      expect(action.kind).toBe("start_or_resume");
      if (action.kind === "start_or_resume") {
        expect(action.resumed).toBe(false);
        expect(action.question.id).toBe("prof_1-1");
      }
      expect(diagnostic.start).toHaveBeenCalled();
      expect(prisma.studentProfile.update).toHaveBeenCalled();
    });

    it("retoma diagnóstico cuando hay state previo", async () => {
      const existing = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: [],
        answers: [],
        completed: false,
        startedAt: "2026-05-05T09:00:00Z",
        lastInteractionAt: "2026-05-05T09:30:00Z",
      };
      const prisma = buildPrisma(existing);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      const action = await handler.startOrResume(STUDENT);

      expect(action.kind).toBe("start_or_resume");
      if (action.kind === "start_or_resume") {
        expect(action.resumed).toBe(true);
      }
      expect(diagnostic.start).not.toHaveBeenCalled();
    });

    it("retorna already_completed si el alumno ya hizo el diagnóstico", async () => {
      const prisma = buildPrisma(null);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      const action = await handler.startOrResume({ ...STUDENT, diagnosticCompleted: true });

      expect(action.kind).toBe("already_completed");
      expect(diagnostic.start).not.toHaveBeenCalled();
    });
  });

  describe("handleAnswer", () => {
    it("registra respuesta y devuelve next_question si no completó", async () => {
      const stateInDb = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: [{ ...QUESTION_FIXTURE, correctAnswer: "C" }],
        answers: [],
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:00:00Z",
      };
      const prisma = buildPrisma(stateInDb);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      const action = await handler.handleAnswer(STUDENT, "C");

      expect(action.kind).toBe("next_question");
      expect(diagnostic.registerAnswer).toHaveBeenCalled();
    });

    it("acepta variantes de letra: minúscula, con paréntesis, con espacios", async () => {
      const stateInDb = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: [{ ...QUESTION_FIXTURE, correctAnswer: "C" }],
        answers: [],
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:00:00Z",
      };
      const prisma = buildPrisma(stateInDb);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      for (const variant of ["c", "C", "  C  ", "c)", "C.", "c:"]) {
        prisma.studentProfile.findUnique.mockResolvedValueOnce({
          diagnosticState: stateInDb,
        });
        const action = await handler.handleAnswer(STUDENT, variant);
        expect(["next_question", "completed"]).toContain(action.kind);
      }
    });

    it("retorna cant_understand si la respuesta no contiene letra A/B/C/D", async () => {
      const stateInDb = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: [{ ...QUESTION_FIXTURE, correctAnswer: "C" }],
        answers: [],
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:00:00Z",
      };
      const prisma = buildPrisma(stateInDb);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      const action = await handler.handleAnswer(STUDENT, "no sé, ninguna");

      expect(action.kind).toBe("cant_understand");
    });

    it("genera reporte y persiste cuando completa", async () => {
      const stateAlmostDone = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: Array.from({ length: 15 }, (_, i) => ({
          ...QUESTION_FIXTURE,
          id: `prof_1-${i + 1}`,
          correctAnswer: "C",
        })),
        answers: Array.from({ length: 14 }, (_, i) => ({
          questionId: `prof_1-${i + 1}`,
          answer: "C",
          correct: true,
          difficulty: "medium",
          subject: "matematica",
          expectedCompetence: "comprension",
        })),
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:00:00Z",
      };
      const prisma = buildPrisma(stateAlmostDone);
      const handler = new DiagnosticHandlerService(diagnostic as never, prisma as never);

      const action = await handler.handleAnswer(STUDENT, "C");

      expect(action.kind).toBe("completed");
      expect(diagnostic.summarize).toHaveBeenCalled();
      const updateCall = prisma.studentProfile.update.mock.calls.at(-1)?.[0] as {
        data: { diagnosticCompleted: boolean; learningStyle?: string };
      };
      expect(updateCall.data.diagnosticCompleted).toBe(true);
      expect(updateCall.data.learningStyle).toBe("visual");
    });
  });

  describe("formatStartMessage", () => {
    it("incluye nombre, instrucciones y primera pregunta con letras A-D", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      const message = handler.formatStartMessage("Mateo", QUESTION_FIXTURE, false);

      expect(message).toContain("Mateo");
      expect(message).toContain("Pregunta 1 de 15");
      expect(message).toContain("A) 1/8");
      expect(message).toContain("B) 2/4");
      expect(message).toContain("C) 3/4");
      expect(message).toContain("D) 1/6");
      expect(message).toContain("A, B, C o D");
    });

    it("usa intro distinto cuando es resumen", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      const message = handler.formatStartMessage("Mateo", QUESTION_FIXTURE, true);

      expect(message).toContain("Volviste");
    });
  });

  describe("formatNextMessage", () => {
    it("usa intro motivador SIN revelar correcto/incorrecto", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      const message = handler.formatNextMessage(QUESTION_FIXTURE, 5);

      // No debe contener palabras como "correcto", "incorrecto", "bien hecho", "mal"
      expect(message.toLowerCase()).not.toContain("correcto");
      expect(message.toLowerCase()).not.toContain("incorrecto");
      expect(message.toLowerCase()).not.toContain("bien hecho");
      expect(message).toContain("Pregunta 6 de 15");
    });
  });

  describe("formatCompletedMessage", () => {
    it("incluye nombre, narrativa, fortalezas y oportunidades", () => {
      const handler = new DiagnosticHandlerService(diagnostic as never, {} as never);
      const report = {
        totalQuestions: 15,
        correct: 10,
        score: 0.66,
        bySubject: {} as never,
        byCompetence: {} as never,
        effectiveGradeLevel: {} as never,
        strengths: ["lectura", "perseverancia"],
        opportunities: ["fracciones"],
        recommendations: [],
        inferredLearningStyle: null,
        narrative: "Buen primer paso.",
      };

      const message = handler.formatCompletedMessage("Mateo", report);

      expect(message).toContain("Mateo");
      expect(message).toContain("Buen primer paso");
      expect(message).toContain("lectura");
      expect(message).toContain("fracciones");
    });
  });
});
