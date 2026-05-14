import { describe, expect, it, vi } from "vitest";
import { HumanHandoffService } from "./human-handoff.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";

const STUDENT: ResolvedStudent = {
  studentId: "stu_1",
  studentName: "Mateo",
  grade: 5,
  studentProfileId: "prof_1",
  whatsappPhone: "+5493815550202",
  preferredChannel: "whatsapp",
  learningStyle: "visual",
  diagnosticCompleted: true,
  familyId: "fam_1",
  tenantId: "tnt_1",
  subscription: {
    id: "sub_1",
    plan: "PREMIUM",
    status: "ACTIVE",
    currentPeriodEnd: new Date("2026-05-30T00:00:00.000Z"),
  },
};

describe("HumanHandoffService", () => {
  it("persiste el handoff en audit logs", async () => {
    const prisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "log_1" }),
      },
    };
    const logger = {
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    const typedPrisma = prisma as unknown as ConstructorParameters<typeof HumanHandoffService>[0];
    const typedLogger = logger as unknown as ConstructorParameters<typeof HumanHandoffService>[1];

    const service = new HumanHandoffService(typedPrisma, typedLogger);

    const result = await service.create({
      student: STUDENT,
      conversationId: "conv_1",
      source: "institutional",
      reason: "human_request",
      inboundMessage: "Necesito hablar con una persona",
      outboundMessage: "Te derivo con una persona del equipo.",
    });

    expect(result.id).toBe("log_1");
    const createArg = prisma.auditLog.create.mock.calls[0]?.[0] as {
      data: {
        tenantId: string;
        action: string;
        entity: string;
        entityId: string;
      };
    };
    expect(createArg.data.tenantId).toBe("tnt_1");
    expect(createArg.data.action).toBe("human_handoff.requested");
    expect(createArg.data.entity).toBe("conversation");
    expect(createArg.data.entityId).toBe("conv_1");
  });
});
