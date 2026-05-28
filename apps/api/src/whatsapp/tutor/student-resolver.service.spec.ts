import { describe, expect, it, vi } from "vitest";
import { StudentResolverService } from "./student-resolver.service.js";
import {
  ParentalConsentMissingError,
  StudentNotEnrolledError,
} from "../webhooks/errors/webhook.errors.js";

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

const CONSENT_OK = {
  termsAccepted: true,
  privacyAccepted: true,
  aiProcessingAccepted: true,
};

function buildPrismaMock(
  overrides: {
    profile?: typeof PROFILE_OK | null;
    consent?: typeof CONSENT_OK | null;
  } = {},
) {
  return {
    educaiWhatsappContact: { findMany: vi.fn().mockResolvedValue([]) },
    studentProfile: {
      findUnique: vi
        .fn()
        .mockResolvedValue(overrides.profile === undefined ? PROFILE_OK : overrides.profile),
    },
    parentalConsent: {
      findFirst: vi
        .fn()
        .mockResolvedValue(overrides.consent === undefined ? CONSENT_OK : overrides.consent),
    },
  } as never;
}

describe("StudentResolverService", () => {
  it("resuelve un alumno por whatsappPhone normalizado", async () => {
    const prisma = buildPrismaMock();
    const service = new StudentResolverService(prisma);

    const resolved = await service.resolveByWhatsapp("whatsapp:+5493815550202");

    expect(resolved.studentName).toBe("Mateo");
    expect(resolved.grade).toBe(5);
    expect(resolved.subscription.plan).toBe("PREMIUM");
    expect(resolved.replyWhatsappPhone).toBe("+5493815550202");
  });

  it("lanza StudentNotEnrolledError si no existe", async () => {
    const prisma = buildPrismaMock({ profile: null });
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
    const prisma = buildPrismaMock({ profile: profileSinSub as unknown as typeof PROFILE_OK });
    const service = new StudentResolverService(prisma);

    await expect(service.resolveByWhatsapp("+5493815550202")).rejects.toBeInstanceOf(
      StudentNotEnrolledError,
    );
  });

  it("lanza ParentalConsentMissingError si no hay consent registrado", async () => {
    const prisma = buildPrismaMock({ consent: null });
    const service = new StudentResolverService(prisma);

    await expect(service.resolveByWhatsapp("+5493815550202")).rejects.toBeInstanceOf(
      ParentalConsentMissingError,
    );
  });

  it("lanza ParentalConsentMissingError si algún flag del consent está en false", async () => {
    const consentIncompleto = { ...CONSENT_OK, aiProcessingAccepted: false };
    const prisma = buildPrismaMock({ consent: consentIncompleto });
    const service = new StudentResolverService(prisma);

    await expect(service.resolveByWhatsapp("+5493815550202")).rejects.toBeInstanceOf(
      ParentalConsentMissingError,
    );
  });

  it("normaliza prefijo whatsapp:", () => {
    const service = new StudentResolverService({} as never);
    expect(service.normalize("whatsapp:+5493815550202")).toBe("+5493815550202");
    expect(service.normalize("WhatsApp:+549")).toBe("+549");
    expect(service.normalize("+549")).toBe("+549");
  });
});
