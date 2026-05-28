import { describe, expect, it, vi } from "vitest";
import { WeeklyReportService } from "./parent-report.service.js";

type AnyPrisma = Record<string, unknown>;

function buildFamily(
  overrides: Partial<{
    students: Array<{
      id: string;
      firstName: string;
      grade: number;
      deletedAt: Date | null;
      profile: { id: string } | null;
    }>;
    parents: Array<{ id: string; phone: string | null; user: { fullName: string } | null }>;
  }> = {},
) {
  return {
    id: "fam_1",
    tenantId: "tnt_1",
    name: "Pérez",
    students: overrides.students ?? [
      {
        id: "stu_1",
        firstName: "Mateo",
        grade: 5,
        deletedAt: null,
        profile: { id: "prof_1" },
      },
    ],
    parents: overrides.parents ?? [
      { id: "par_1", phone: "+5493815550202", user: { fullName: "Ana Pérez" } },
    ],
  };
}

function buildPrismaMock(
  opts: {
    family?: ReturnType<typeof buildFamily> | null;
    sessions?: Array<{ subject: string; durationMinutes: number; completed: boolean }>;
    messageCount?: number;
    achievements?: Array<{ type: string; name: string; description: string }>;
    reportId?: string;
  } = {},
) {
  return {
    family: {
      findFirst: vi.fn().mockResolvedValue(opts.family === undefined ? buildFamily() : opts.family),
    },
    learningSession: {
      findMany: vi.fn().mockResolvedValue(opts.sessions ?? []),
    },
    message: {
      count: vi.fn().mockResolvedValue(opts.messageCount ?? 0),
    },
    achievement: {
      findMany: vi.fn().mockResolvedValue(opts.achievements ?? []),
    },
    parentReport: {
      create: vi.fn().mockResolvedValue({ id: opts.reportId ?? "rep_1" }),
      update: vi.fn().mockResolvedValue({ id: opts.reportId ?? "rep_1" }),
    },
  } as unknown as AnyPrisma;
}

function buildTwilioMock(failures: number = 0) {
  let calls = 0;
  return {
    send: vi.fn().mockImplementation(async () => {
      calls += 1;
      if (calls <= failures) throw new Error("twilio fail");
      return { messageSid: `MS${calls}`, status: "queued" };
    }),
  };
}

const DETERMINISTIC_LLM = {
  generate: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      shortMessage: "Mateo sumó 60 minutos esta semana.",
      fullText: "Hola familia Pérez: Mateo trabajó 60 minutos esta semana en matemática.",
    }),
    tokensUsed: 100,
    modelUsed: "claude-haiku-4-5-20251001",
  }),
};

const PERIOD = {
  periodStart: new Date("2026-05-19T00:00:00Z"),
  periodEnd: new Date("2026-05-26T00:00:00Z"),
};

describe("WeeklyReportService", () => {
  it("rechaza periodos invertidos", async () => {
    const prisma = buildPrismaMock();
    const twilio = buildTwilioMock();
    const service = new WeeklyReportService(prisma as never, twilio as never, DETERMINISTIC_LLM);

    await expect(
      service.generateForFamily({
        familyId: "fam_1",
        tenantId: "tnt_1",
        periodStart: PERIOD.periodEnd,
        periodEnd: PERIOD.periodStart,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "WEEKLY_REPORT_INVALID_PERIOD" }),
    });
  });

  it("lanza NotFound si la familia no existe en el tenant", async () => {
    const prisma = buildPrismaMock({ family: null });
    const twilio = buildTwilioMock();
    const service = new WeeklyReportService(prisma as never, twilio as never, DETERMINISTIC_LLM);

    await expect(
      service.generateForFamily({ familyId: "fam_x", tenantId: "tnt_1", ...PERIOD }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "WEEKLY_REPORT_FAMILY_NOT_FOUND" }),
    });
  });

  it("genera reporte sin estudiantes con narrativa de baja actividad y no envía WhatsApp", async () => {
    const familySinAlumnos = buildFamily({ students: [] });
    const prisma = buildPrismaMock({ family: familySinAlumnos });
    const twilio = buildTwilioMock();
    const service = new WeeklyReportService(prisma as never, twilio as never, DETERMINISTIC_LLM);

    const result = await service.generateForFamily({
      familyId: "fam_1",
      tenantId: "tnt_1",
      ...PERIOD,
    });

    expect(result.studentsIncluded).toBe(0);
    expect(twilio.send).toHaveBeenCalledTimes(1); // un mensaje "no hubo actividad" igual va al padre
    expect(prisma.parentReport.create).toHaveBeenCalled();
  });

  it("agrega sesiones, llama al LLM, persiste y notifica al adulto con teléfono", async () => {
    const prisma = buildPrismaMock({
      sessions: [
        { subject: "matemática", durationMinutes: 30, completed: true },
        { subject: "matemática", durationMinutes: 20, completed: false },
        { subject: "lengua", durationMinutes: 10, completed: true },
      ],
      messageCount: 12,
      achievements: [
        {
          type: "streak",
          name: "Tres días seguidos",
          description: "Resolvió ejercicios 3 días seguidos",
        },
      ],
    });
    const twilio = buildTwilioMock();
    const service = new WeeklyReportService(prisma as never, twilio as never, DETERMINISTIC_LLM);

    const result = await service.generateForFamily({
      familyId: "fam_1",
      tenantId: "tnt_1",
      ...PERIOD,
    });

    expect(result.studentsIncluded).toBe(1);
    expect(result.sentToWhatsapp).toBe(1);
    expect(DETERMINISTIC_LLM.generate).toHaveBeenCalled();
    expect(prisma.parentReport.create).toHaveBeenCalled();
    expect(prisma.parentReport.update).toHaveBeenCalled(); // marca sentAt cuando hubo envío
    const createCall = (prisma.parentReport.create as { mock: { calls: unknown[][] } }).mock
      .calls[0]!;
    const summary = (createCall[0] as { data: { summary: Record<string, unknown> } }).data.summary;
    expect(summary.aggregations).toBeDefined();
    expect(summary.narrative).toBeDefined();
  });

  it("no marca sentAt cuando ningún parent tiene phone", async () => {
    const familySinTelefonos = buildFamily({
      parents: [{ id: "par_1", phone: null, user: { fullName: "Ana" } }],
    });
    const prisma = buildPrismaMock({
      family: familySinTelefonos,
      sessions: [{ subject: "lengua", durationMinutes: 30, completed: true }],
    });
    const twilio = buildTwilioMock();
    const service = new WeeklyReportService(prisma as never, twilio as never, DETERMINISTIC_LLM);

    const result = await service.generateForFamily({
      familyId: "fam_1",
      tenantId: "tnt_1",
      ...PERIOD,
    });

    expect(result.sentToWhatsapp).toBe(0);
    expect(twilio.send).not.toHaveBeenCalled();
    expect(prisma.parentReport.update).not.toHaveBeenCalled();
  });

  it("cae a narrativa determinística si el LLM falla", async () => {
    const failingLlm = {
      generate: vi.fn().mockRejectedValue(new Error("anthropic 503")),
    };
    const prisma = buildPrismaMock({
      sessions: [{ subject: "matemática", durationMinutes: 45, completed: true }],
    });
    const twilio = buildTwilioMock();
    const service = new WeeklyReportService(prisma as never, twilio as never, failingLlm);

    const result = await service.generateForFamily({
      familyId: "fam_1",
      tenantId: "tnt_1",
      ...PERIOD,
    });

    expect(result.studentsIncluded).toBe(1);
    expect(failingLlm.generate).toHaveBeenCalled();
    expect(prisma.parentReport.create).toHaveBeenCalled();
    const createCall = (prisma.parentReport.create as { mock: { calls: unknown[][] } }).mock
      .calls[0]!;
    const summary = (
      createCall[0] as { data: { summary: { narrative: { shortMessage: string } } } }
    ).data.summary;
    expect(summary.narrative.shortMessage).toContain("Mateo");
  });
});
