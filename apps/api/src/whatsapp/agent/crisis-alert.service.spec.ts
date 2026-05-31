import { beforeEach, describe, expect, it, vi } from "vitest";

import { CrisisAlertService } from "./crisis-alert.service.js";
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
  subscription: { id: "sub_1", plan: "PREMIUM", status: "ACTIVE", currentPeriodEnd: new Date() },
};

function build(opts: {
  envRecipient?: string;
  tenantMetadata?: unknown;
  sendImpl?: () => Promise<{ messageSid: string; status: string }>;
}) {
  const config = {
    get: (key: string) => (key === "CRISIS_ALERT_WHATSAPP_TO" ? opts.envRecipient : undefined),
  };
  const sender = {
    send: vi.fn((_input: { toWhatsappPhone: string; body: string }) =>
      opts.sendImpl ? opts.sendImpl() : Promise.resolve({ messageSid: "SM1", status: "queued" }),
    ),
  };
  const prisma = {
    tenant: {
      findUnique: vi.fn().mockResolvedValue({ metadata: opts.tenantMetadata ?? null }),
    },
  };
  const logger = { warn: vi.fn(), error: vi.fn() };

  const service = new CrisisAlertService(
    config as never,
    sender as never,
    prisma as never,
    logger as never,
  );
  return { service, sender, prisma, logger };
}

const INPUT = {
  student: STUDENT,
  conversationId: "conv_1",
  severity: "critical" as const,
  signals: ["crisis_suicide"],
  inboundMessage: "no quiero vivir mas",
  helplines: ["Línea 102"],
};

describe("CrisisAlertService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía al destinatario del env cuando el tenant no tiene override", async () => {
    const { service, sender } = build({ envRecipient: "+5493810000000" });

    const result = await service.notifyCrisis(INPUT);

    expect(result.delivered).toBe(true);
    expect(result.recipientConfigured).toBe(true);
    expect(sender.send).toHaveBeenCalledTimes(1);
    const arg = sender.send.mock.calls[0]![0];
    expect(arg.toWhatsappPhone).toBe("+5493810000000");
    expect(arg.body).toContain("ALERTA DE CRISIS");
    expect(arg.body).toContain("CRÍTICA");
    expect(arg.body).toContain("Mateo");
    expect(arg.body).toContain("crisis_suicide");
    expect(arg.body).toContain("conv_1");
  });

  it("prioriza el override por tenant sobre el env", async () => {
    const { service, sender } = build({
      envRecipient: "+5493810000000",
      tenantMetadata: { crisisAlertWhatsappTo: "+5493819999999" },
    });

    await service.notifyCrisis(INPUT);

    const arg = sender.send.mock.calls[0]![0];
    expect(arg.toWhatsappPhone).toBe("+5493819999999");
  });

  it("NO envía y avisa por log cuando no hay destinatario configurado", async () => {
    const { service, sender, logger } = build({ envRecipient: undefined });

    const result = await service.notifyCrisis(INPUT);

    expect(result.delivered).toBe(false);
    expect(result.recipientConfigured).toBe(false);
    expect(result.reason).toBe("no_recipient_configured");
    expect(sender.send).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("no rompe si el envío falla: delivered=false con reason send_failed", async () => {
    const { service, logger } = build({
      envRecipient: "+5493810000000",
      sendImpl: () => Promise.reject(new Error("twilio down")),
    });

    const result = await service.notifyCrisis(INPUT);

    expect(result.delivered).toBe(false);
    expect(result.recipientConfigured).toBe(true);
    expect(result.reason).toBe("send_failed");
    expect(logger.error).toHaveBeenCalled();
  });

  it("nunca expone el número completo en el resultado (enmascarado)", async () => {
    const { service } = build({ envRecipient: "+5493810001234" });

    const result = await service.notifyCrisis(INPUT);

    expect(result.recipientMasked).toBe("***1234");
    expect(result.recipientMasked).not.toContain("549381000");
  });
});
