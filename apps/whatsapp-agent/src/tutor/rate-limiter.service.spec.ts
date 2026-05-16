import { describe, expect, it, vi } from "vitest";
import { RateLimiterService } from "./rate-limiter.service.js";
import {
  RateLimitExceededError,
  SubscriptionInactiveError,
} from "../webhooks/errors/webhook.errors.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

function buildStudent(overrides: Partial<ResolvedStudent["subscription"]> = {}): ResolvedStudent {
  return {
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
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodEnd: new Date(),
      ...overrides,
    },
  };
}

function buildPrisma(messageCount: number) {
  return {
    message: { count: vi.fn().mockResolvedValue(messageCount) },
  };
}

describe("RateLimiterService", () => {
  it("FREE no permite WhatsApp", async () => {
    const prisma = buildPrisma(5);
    const service = new RateLimiterService(prisma as never);

    await expect(service.assertCanReceive(buildStudent())).rejects.toBeInstanceOf(
      RateLimitExceededError,
    );
    expect(prisma.message.count).not.toHaveBeenCalled();
  });

  it("BASIC permite hasta 20 mensajes por dia por hijo", async () => {
    const prisma = buildPrisma(5);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent({ plan: "BASIC" }));

    expect(decision.allowed).toBe(true);
    expect(decision.dailyLimit).toBe(20);
    expect(decision.used).toBe(5);
    expect(decision.remaining).toBe(15);
  });

  it("BASIC rechaza al llegar al limite", async () => {
    const prisma = buildPrisma(20);
    const service = new RateLimiterService(prisma as never);

    await expect(service.assertCanReceive(buildStudent({ plan: "BASIC" }))).rejects.toBeInstanceOf(
      RateLimitExceededError,
    );
  });

  it("PREMIUM se normaliza a Plus y permite 60 mensajes por dia", async () => {
    const prisma = buildPrisma(59);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent({ plan: "PREMIUM" }));

    expect(decision.dailyLimit).toBe(60);
    expect(decision.remaining).toBe(1);
  });

  it("FAMILY se normaliza a Familiar y permite 25 mensajes por dia", async () => {
    const prisma = buildPrisma(24);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent({ plan: "FAMILY" }));

    expect(decision.dailyLimit).toBe(25);
    expect(decision.remaining).toBe(1);
  });

  it("rechaza si la suscripcion esta canceled", async () => {
    const prisma = buildPrisma(0);
    const service = new RateLimiterService(prisma as never);

    await expect(
      service.assertCanReceive(buildStudent({ status: "CANCELED" })),
    ).rejects.toBeInstanceOf(SubscriptionInactiveError);
  });

  it("permite IN_GRACE_PERIOD en plan pago", async () => {
    const prisma = buildPrisma(2);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(
      buildStudent({ plan: "BASIC", status: "IN_GRACE_PERIOD" }),
    );

    expect(decision.allowed).toBe(true);
  });
});
