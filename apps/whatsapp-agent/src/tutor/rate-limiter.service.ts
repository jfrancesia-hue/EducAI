import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  RateLimitExceededError,
  SubscriptionInactiveError,
} from "../webhooks/errors/webhook.errors.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

const FREE_PLAN_DAILY_LIMIT = 10;

const PLAN_LIMITS: Record<string, number | null> = {
  FREE: FREE_PLAN_DAILY_LIMIT,
  BASIC: null,
  PREMIUM: null,
  FAMILY: null,
};

const ACCEPTED_STATUSES = new Set(["ACTIVE", "IN_GRACE_PERIOD"]);

export interface RateLimitDecision {
  allowed: boolean;
  plan: string;
  dailyLimit: number | null;
  used: number;
  remaining: number | null;
}

/**
 * Cuotas por plan de ApoyoAI:
 *   FREE      → 10 mensajes / día (alumno) — corte a medianoche AR
 *   BASIC+    → ilimitado
 *
 * El conteo se hace sobre Message del día (zona AR -3) cuyo
 * studentProfileId pertenece al alumno solicitante y rol = "student".
 */
@Injectable()
export class RateLimiterService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanReceive(student: ResolvedStudent): Promise<RateLimitDecision> {
    if (!ACCEPTED_STATUSES.has(student.subscription.status)) {
      throw new SubscriptionInactiveError(student.familyId, student.subscription.status);
    }

    const limit = PLAN_LIMITS[student.subscription.plan] ?? null;

    if (limit === null) {
      return {
        allowed: true,
        plan: student.subscription.plan,
        dailyLimit: null,
        used: 0,
        remaining: null,
      };
    }

    const since = this.startOfDayArgentina();
    const used = await this.prisma.message.count({
      where: {
        role: "student",
        createdAt: { gte: since },
        conversation: {
          studentProfileId: student.studentProfileId,
        },
      },
    });

    if (used >= limit) {
      throw new RateLimitExceededError(student.subscription.plan, limit);
    }

    return {
      allowed: true,
      plan: student.subscription.plan,
      dailyLimit: limit,
      used,
      remaining: limit - used,
    };
  }

  private startOfDayArgentina(reference: Date = new Date()): Date {
    // Argentina es UTC-3 sin horario de verano. El "inicio del día" en AR
    // corresponde a 03:00 UTC del mismo día calendario.
    const argDate = new Date(reference.getTime() - 3 * 60 * 60 * 1000);
    argDate.setUTCHours(0, 0, 0, 0);
    return new Date(argDate.getTime() + 3 * 60 * 60 * 1000);
  }
}
