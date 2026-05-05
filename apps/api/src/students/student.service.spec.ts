import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentService } from "./student.service.js";
import { StudentNotFoundError, StudentProfileNotFoundError } from "./errors/student.errors.js";

type PrismaMock = {
  student: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
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
} as unknown as ConstructorParameters<typeof StudentService>[1];

describe("StudentService", () => {
  let prisma: PrismaMock;
  let service: StudentService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new StudentService(prisma as never, loggerStub);
  });

  describe("create", () => {
    it("crea estudiante con perfil ApoyoAI por defecto en AR-NOA", async () => {
      prisma.student.create.mockResolvedValue({
        id: "stu_1",
        familyId: "fam_1",
        profile: { id: "prof_1", curriculum: "AR-NOA" },
      });

      const result = await service.create({
        tenantId: "tnt_1",
        familyId: "fam_1",
        firstName: "Mateo",
        lastName: "Demo",
        grade: 6,
      });

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

      const result = await service.findOne("stu_1");

      expect(result.data.id).toBe("stu_1");
    });

    it("lanza StudentNotFoundError cuando no existe", async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.findOne("missing")).rejects.toBeInstanceOf(StudentNotFoundError);
    });
  });

  describe("update", () => {
    it("actualiza solo el estudiante si no se tocan campos del perfil", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1" });
      prisma.student.update.mockResolvedValue({ id: "stu_1", firstName: "Mateo Pablo" });

      await service.update("stu_1", { firstName: "Mateo Pablo" });

      const callArg = prisma.student.update.mock.calls[0]?.[0] as
        | { data: { profile?: unknown } }
        | undefined;
      expect(callArg?.data.profile).toBeUndefined();
    });

    it("actualiza el perfil cuando llega grade/curriculum/whatsappPhone", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1" });
      prisma.student.update.mockResolvedValue({ id: "stu_1" });

      await service.update("stu_1", { grade: 7, curriculum: "AR-NACIONAL" });

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

      await expect(service.startDiagnostic("stu_x")).rejects.toBeInstanceOf(StudentNotFoundError);
    });

    it("lanza StudentProfileNotFoundError si falta perfil", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 6 });
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.startDiagnostic("stu_1")).rejects.toBeInstanceOf(
        StudentProfileNotFoundError,
      );
    });

    it("devuelve estado y siguiente pregunta cuando hay perfil", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 6 });
      prisma.studentProfile.findUnique.mockResolvedValue({ id: "prof_1" });

      const result = await service.startDiagnostic("stu_1");

      expect(result.data.state.studentProfileId).toBe("prof_1");
      expect(result.data.question).not.toBeNull();
    });
  });

  describe("answerDiagnostic", () => {
    it("actualiza el perfil con el resumen del diagnóstico", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "stu_1", grade: 6 });
      prisma.studentProfile.findUnique.mockResolvedValue({ id: "prof_1" });
      prisma.studentProfile.update.mockResolvedValue({});

      const result = await service.answerDiagnostic("stu_1", {
        questionId: "q1",
        answer: "B",
        correct: true,
      });

      expect(prisma.studentProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prof_1" },
          data: expect.objectContaining({
            diagnosticCompleted: false,
            diagnosticScore: expect.any(Object),
          }),
        }),
      );
      expect(result.data.summary.totalQuestions).toBe(1);
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

      const result = await service.progress("stu_1");

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

      const result = await service.progress("stu_1");

      expect(result.data.minutesThisWeek).toBe(0);
    });
  });
});
