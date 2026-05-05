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
  it("FREE permite hasta 10 mensajes/día", async () => {
    const prisma = buildPrisma(5);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent());

    expect(decision.allowed).toBe(true);
    expect(decision.dailyLimit).toBe(10);
    expect(decision.used).toBe(5);
    expect(decision.remaining).toBe(5);
  });

  it("FREE rechaza al llegar al límite", async () => {
    const prisma = buildPrisma(10);
    const service = new RateLimiterService(prisma as never);

    await expect(service.assertCanReceive(buildStudent())).rejects.toBeInstanceOf(
      RateLimitExceededError,
    );
  });

  it("BASIC es ilimitado", async () => {
    const prisma = buildPrisma(9999);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent({ plan: "BASIC" }));

    expect(decision.dailyLimit).toBeNull();
    expect(decision.remaining).toBeNull();
    expect(prisma.message.count).not.toHaveBeenCalled();
  });

  it("PREMIUM es ilimitado", async () => {
    const prisma = buildPrisma(9999);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent({ plan: "PREMIUM" }));

    expect(decision.dailyLimit).toBeNull();
  });

  it("rechaza si la suscripción está canceled", async () => {
    const prisma = buildPrisma(0);
    const service = new RateLimiterService(prisma as never);

    await expect(
      service.assertCanReceive(buildStudent({ status: "CANCELED" })),
    ).rejects.toBeInstanceOf(SubscriptionInactiveError);
  });

  it("permite IN_GRACE_PERIOD", async () => {
    const prisma = buildPrisma(2);
    const service = new RateLimiterService(prisma as never);

    const decision = await service.assertCanReceive(buildStudent({ status: "IN_GRACE_PERIOD" }));

    expect(decision.allowed).toBe(true);
  });
});
