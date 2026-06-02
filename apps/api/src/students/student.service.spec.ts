import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentService } from "./student.service.js";
import { StudentNotFoundError, StudentProfileNotFoundError } from "./errors/student.errors.js";

type PrismaMock = {
  student: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  subscription: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  studentProfile: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  learningSession: {
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  achievement: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

function buildPrismaMock(): PrismaMock {
  return {
    student: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    subscription: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    studentProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    learningSession: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    achievement: {
      findMany: vi.fn(),
    },
  };
}

const loggerStub = {
  child: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
} as unknown as ConstructorParameters<typeof StudentService>[2];

function buildDiagnosticMock() {
  let stateCounter = 0;
  return {
    start: vi.fn((profileId: string, grade: number) => ({
      studentProfileId: profileId,
      grade,
      currentDifficulty: "medium",
      questions: [],
      answers: [],
      completed: false,
      startedAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
    })),
    nextQuestion: vi.fn((state: { questions: unknown[]; studentProfileId: string }) => {
      stateCounter += 1;
      const question = {
        id: `${state.studentProfileId}-${stateCounter}`,
        subject: "matematica",
        grade: 5,
        prompt: "Pregunta de prueba",
        options: ["A", "B", "C", "D"],
        expectedCompetence: "comprension",
        difficulty: "medium",
      };
      state.questions.push({ ...question, correctAnswer: "A" });
      return Promise.resolve(question);
    }),
    registerAnswer: vi.fn((state: any, questionId: string) => ({
      ...state,
      answers: [
        ...state.answers,
        {
          questionId,
          answer: "A",
          correct: true,
          difficulty: "medium",
          subject: "matematica",
          expectedCompetence: "comprension",
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
        strengths: ["lectura"],
        opportunities: ["práctica"],
        recommendations: ["acompañar"],
        inferredLearningStyle: "visual",
        narrative: "Buen primer paso",
      }),
    ),
  };
}

describe("StudentService", () => {
  let prisma: PrismaMock;
  let diagnostic: ReturnType<typeof buildDiagnosticMock>;
  let service: StudentService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    diagnostic = buildDiagnosticMock();
    service = new StudentService(prisma as never, diagnostic as never, loggerStub);
  });

  describe("create", () => {
    it("crea estudiante con perfil ApoyoAI por defecto en AR-NOA", async () => {
      prisma.student.create.mockResolvedValue({
        id: "stu_1",
        familyId: "fam_1",
        profile: { id: "prof_1", curriculum: "AR-NOA" },
      });

      const result = await service.create(
        {
          firstName: "Mateo",
          lastName: "Demo",
          grade: 6,
        },
        { tenantId: "tnt_1", familyId: "fam_1" },
      );

      expect(prisma.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tnt_1",
            familyId: "fam_1",
            profile: expect.objectContaining({
              create: expect.objectContaining({ curriculum: "AR-NOA", country: "AR" }),
            }),
          }),
        }),
      );
      expect(result.data.id).toBe("stu_1");
    });
  });

  describe("findOne", () => {
    it("devuelve el estudiante cuando existe", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", familyId: "fam_1" });

      const result = await service.findOne("stu_1", { tenantId: "tnt_1", familyId: "fam_1" });

      expect(result.data.id).toBe("stu_1");
    });

    it("lanza StudentNotFoundError cuando no existe", async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne("missing", { tenantId: "tnt_1", familyId: "fam_1" }),
      ).rejects.toBeInstanceOf(StudentNotFoundError);
    });
  });

  describe("update", () => {
    it("actualiza solo el estudiante si no se tocan campos del perfil", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1" });
      prisma.student.update.mockResolvedValue({ id: "stu_1", firstName: "Mateo Pablo" });

      await service.update(
        "stu_1",
        { firstName: "Mateo Pablo" },
        { tenantId: "tnt_1", familyId: "fam_1" },
      );

      const callArg = prisma.student.update.mock.calls[0]?.[0] as
        | { data: { profile?: unknown } }
        | undefined;
      expect(callArg?.data.profile).toBeUndefined();
    });

    it("actualiza el perfil cuando llega grade/curriculum/whatsappPhone", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1" });
      prisma.student.update.mockResolvedValue({ id: "stu_1" });

      await service.update(
        "stu_1",
        { grade: 7, curriculum: "AR-NACIONAL" },
        { tenantId: "tnt_1", familyId: "fam_1" },
      );

      const callArg = prisma.student.update.mock.calls[0]?.[0] as
        | { data: { profile?: unknown } }
        | undefined;
      expect(callArg?.data.profile).toEqual({
        update: { grade: 7, curriculum: "AR-NACIONAL", whatsappPhone: undefined },
      });
    });
  });

  describe("startDiagnostic", () => {
    it("lanza StudentNotFoundError si el estudiante no existe", async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.startDiagnostic("stu_x", { tenantId: "tnt_1", familyId: "fam_1" }),
      ).rejects.toBeInstanceOf(StudentNotFoundError);
    });

    it("lanza StudentProfileNotFoundError si falta perfil", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 6 });
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.startDiagnostic("stu_1", { tenantId: "tnt_1", familyId: "fam_1" }),
      ).rejects.toBeInstanceOf(StudentProfileNotFoundError);
    });

    it("inicia diagnóstico nuevo cuando no hay state previo", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 5 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        diagnosticState: null,
      });

      const result = await service.startDiagnostic("stu_1", {
        tenantId: "tnt_1",
        familyId: "fam_1",
      });

      expect(result.data.resumed).toBe(false);
      expect(result.data.state.studentProfileId).toBe("prof_1");
      expect(result.data.question).not.toBeNull();
      expect(diagnostic.start).toHaveBeenCalledWith("prof_1", 5);
      expect(prisma.studentProfile.update).toHaveBeenCalled();
    });

    it("retoma diagnóstico cuando hay state previo en DB", async () => {
      const existingState = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: [{ id: "q1" }, { id: "q2" }],
        answers: [{ questionId: "q1" }],
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:05:00Z",
      };
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 5 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        diagnosticState: existingState,
      });

      const result = await service.startDiagnostic("stu_1", {
        tenantId: "tnt_1",
        familyId: "fam_1",
      });

      expect(result.data.resumed).toBe(true);
      expect(diagnostic.start).not.toHaveBeenCalled();
      expect(diagnostic.nextQuestion).toHaveBeenCalled();
    });
  });

  describe("answerDiagnostic", () => {
    it("registra respuesta y devuelve próxima pregunta cuando no completó", async () => {
      const initialState = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: [{ id: "q1", correctAnswer: "A" }],
        answers: [],
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:00:00Z",
      };
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 5 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        diagnosticState: initialState,
      });
      prisma.studentProfile.update.mockResolvedValue({});

      const result = await service.answerDiagnostic(
        "stu_1",
        {
          questionId: "q1",
          answer: "A",
        },
        { tenantId: "tnt_1", familyId: "fam_1" },
      );

      expect(result.data.summary).toBeNull();
      expect(result.data.nextQuestion).not.toBeNull();
      expect(diagnostic.registerAnswer).toHaveBeenCalled();
    });

    it("genera resumen y borra state cuando completa el diagnóstico", async () => {
      const stateCompleting = {
        studentProfileId: "prof_1",
        grade: 5,
        currentDifficulty: "medium",
        questions: Array.from({ length: 15 }, (_, i) => ({ id: `q${i}`, correctAnswer: "A" })),
        answers: Array.from({ length: 14 }, (_, i) => ({
          questionId: `q${i}`,
          answer: "A",
          correct: true,
          difficulty: "medium",
          subject: "matematica",
          expectedCompetence: "comprension",
        })),
        completed: false,
        startedAt: "2026-05-05T10:00:00Z",
        lastInteractionAt: "2026-05-05T10:00:00Z",
      };
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 5 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        diagnosticState: stateCompleting,
      });
      prisma.studentProfile.update.mockResolvedValue({});

      const result = await service.answerDiagnostic(
        "stu_1",
        {
          questionId: "q14",
          answer: "A",
        },
        { tenantId: "tnt_1", familyId: "fam_1" },
      );

      expect(result.data.summary).not.toBeNull();
      expect(result.data.nextQuestion).toBeNull();
      expect(diagnostic.summarize).toHaveBeenCalled();

      const updateCall = prisma.studentProfile.update.mock.calls[0]?.[0] as {
        data: { diagnosticCompleted: boolean; diagnosticScore: unknown; diagnosticState: unknown };
      };
      expect(updateCall.data.diagnosticCompleted).toBe(true);
      expect(updateCall.data.diagnosticScore).toBeDefined();
    });

    it("lanza error si no hay state activo", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 5 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        diagnosticState: null,
      });

      await expect(
        service.answerDiagnostic(
          "stu_1",
          { questionId: "q1", answer: "A" },
          { tenantId: "tnt_1", familyId: "fam_1" },
        ),
      ).rejects.toBeInstanceOf(StudentProfileNotFoundError);
    });
  });

  describe("progress", () => {
    it("agrega sesiones, logros y minutos de la semana", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 6 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        strongSubjects: ["ciencias"],
        weakSubjects: ["matematica"],
        diagnosticCompleted: true,
      });
      prisma.learningSession.count.mockResolvedValue(4);
      prisma.achievement.findMany.mockResolvedValue([{ id: "a1", name: "Racha 3 días" }]);
      prisma.learningSession.aggregate.mockResolvedValue({ _sum: { durationMinutes: 90 } });

      const result = await service.progress("stu_1", { tenantId: "tnt_1", familyId: "fam_1" });

      expect(result.data).toMatchObject({
        studentId: "stu_1",
        completedSessions: 4,
        minutesThisWeek: 90,
        diagnosticCompleted: true,
        strengths: ["ciencias"],
        opportunities: ["matematica"],
      });
      expect(result.data.achievements).toHaveLength(1);
    });

    it("usa 0 minutos cuando no hay sesiones esta semana", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 6 });
      prisma.studentProfile.findUnique.mockResolvedValue({
        id: "prof_1",
        strongSubjects: [],
        weakSubjects: [],
        diagnosticCompleted: false,
      });
      prisma.learningSession.count.mockResolvedValue(0);
      prisma.achievement.findMany.mockResolvedValue([]);
      prisma.learningSession.aggregate.mockResolvedValue({ _sum: { durationMinutes: null } });

      const result = await service.progress("stu_1", { tenantId: "tnt_1", familyId: "fam_1" });

      expect(result.data.minutesThisWeek).toBe(0);
    });
  });
});
