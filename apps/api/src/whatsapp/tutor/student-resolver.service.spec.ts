import { describe, expect, it, vi } from "vitest";
import { StudentResolverService } from "./student-resolver.service.js";
import { StudentNotEnrolledError } from "../webhooks/errors/webhook.errors.js";

const PROFILE_OK = {
  id: "prof_1",
  studentId: "stu_1",
  tenantId: "tnt_1",
  grade: 5,
  preferredChannel: "whatsapp",
  learningStyle: "visual",
  diagnosticCompleted: true,
  whatsappPhone: "+5493815550202",
  student: {
    id: "stu_1",
    firstName: "Mateo",
    deletedAt: null,
    family: {
      id: "fam_1",
      subscription: {
        id: "sub_1",
        plan: "PREMIUM",
        status: "ACTIVE",
        currentPeriodEnd: new Date("2030-01-01"),
      },
    },
  },
};

describe("StudentResolverService", () => {
  it("resuelve un alumno por whatsappPhone normalizado", async () => {
    const findUnique = vi.fn().mockResolvedValue(PROFILE_OK);
    const prisma = { studentProfile: { findUnique } } as never;
    const service = new StudentResolverService(prisma);

    const resolved = await service.resolveByWhatsapp("whatsapp:+5493815550202");

    expect(resolved.studentName).toBe("Mateo");
    expect(resolved.grade).toBe(5);
    expect(resolved.subscription.plan).toBe("PREMIUM");
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { whatsappPhone: "+5493815550202" } }),
    );
  });

  it("lanza StudentNotEnrolledError si no existe", async () => {
    const prisma = {
      studentProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never;
    const service = new StudentResolverService(prisma);

    await expect(service.resolveByWhatsapp("+549999")).rejects.toBeInstanceOf(
      StudentNotEnrolledError,
    );
  });

  it("lanza StudentNotEnrolledError si no hay subscription", async () => {
    const profileSinSub = {
      ...PROFILE_OK,
      student: { ...PROFILE_OK.student, family: { id: "fam_1", subscription: null } },
    };
    const prisma = {
      studentProfile: { findUnique: vi.fn().mockResolvedValue(profileSinSub) },
    } as never;
    const service = new StudentResolverService(prisma);

    await expect(service.resolveByWhatsapp("+5493815550202")).rejects.toBeInstanceOf(
      StudentNotEnrolledError,
    );
  });

  it("normaliza prefijo whatsapp:", () => {
    const service = new StudentResolverService({} as never);
    expect(service.normalize("whatsapp:+5493815550202")).toBe("+5493815550202");
    expect(service.normalize("WhatsApp:+549")).toBe("+549");
    expect(service.normalize("+549")).toBe("+549");
  });
});
