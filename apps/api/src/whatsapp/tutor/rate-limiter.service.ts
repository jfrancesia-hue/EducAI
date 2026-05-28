import { Injectable } from "@nestjs/common";
import { APOYOAI_LIMITS, normalizeApoyoAIPlan } from "@educai/ai";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  RateLimitExceededError,
  SubscriptionInactiveError,
} from "../webhooks/errors/webhook.errors.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

const ACCEPTED_STATUSES = new Set(["ACTIVE", "IN_GRACE_PERIOD"]);

export interface RateLimitDecision {
  allowed: boolean;
  plan: string;
  dailyLimit: number | null;
  lifetimeLimit?: number | null;
  used: number;
  remaining: number | null;
}

/**
 * Cuotas WhatsApp por plan de ApoyoAI:
 *   FREE      -> sin WhatsApp
 *   BASICO    -> 20 mensajes / dia por hijo
 *   PLUS      -> 60 mensajes / dia por hijo
 *   FAMILIAR  -> 25 mensajes / dia por hijo
 *   INTENSIVO -> 40 mensajes / dia por hijo
 *
 * El conteo se hace sobre Message del dia (zona AR -3) cuyo
 * studentProfileId pertenece al alumno solicitante y rol = "student".
 */
@Injectable()
export class RateLimiterService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanReceive(student: ResolvedStudent): Promise<RateLimitDecision> {
    if (!ACCEPTED_STATUSES.has(student.subscription.status)) {
      throw new SubscriptionInactiveError(student.familyId, student.subscription.status);
    }

    const plan = normalizeApoyoAIPlan(student.subscription.plan);
    const planLimits = APOYOAI_LIMITS[plan];
    const limit = "whatsapp_texto" in planLimits ? planLimits.whatsapp_texto.diario_por_hijo : null;

    if (limit === null) {
      throw new RateLimitExceededError(student.subscription.plan, 0);
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

  async assertCanUseApp(student: ResolvedStudent): Promise<RateLimitDecision> {
    if (!ACCEPTED_STATUSES.has(student.subscription.status)) {
      throw new SubscriptionInactiveError(student.familyId, student.subscription.status);
    }

    const plan = normalizeApoyoAIPlan(student.subscription.plan);
    const planLimits = APOYOAI_LIMITS[plan];
    const appLimit = planLimits.app_consultas;
    const lifetimeLimit = "total_vida" in appLimit ? appLimit.total_vida : null;
    const dailyLimit = "diario" in appLimit ? appLimit.diario : null;

    if (lifetimeLimit === null && dailyLimit === null) {
      return {
        allowed: true,
        plan: student.subscription.plan,
        dailyLimit: null,
        lifetimeLimit: null,
        used: 0,
        remaining: null,
      };
    }

    const where =
      lifetimeLimit !== null
        ? {
            role: "web_student",
            conversation: {
              studentProfileId: student.studentProfileId,
            },
          }
        : {
            role: "web_student",
            createdAt: { gte: this.startOfDayArgentina() },
            conversation: {
              studentProfileId: student.studentProfileId,
            },
          };

    const limit = lifetimeLimit ?? dailyLimit ?? 0;
    const used = await this.prisma.message.count({ where });

    if (used >= limit) {
      throw new RateLimitExceededError(student.subscription.plan, limit);
    }

    return {
      allowed: true,
      plan: student.subscription.plan,
      dailyLimit,
      lifetimeLimit,
      used,
      remaining: limit - used,
    };
  }

  private startOfDayArgentina(reference: Date = new Date()): Date {
    // Argentina es UTC-3 sin horario de verano. El inicio del dia en AR
    // corresponde a 03:00 UTC del mismo dia calendario.
    const argDate = new Date(reference.getTime() - 3 * 60 * 60 * 1000);
    argDate.setUTCHours(0, 0, 0, 0);
    return new Date(argDate.getTime() + 3 * 60 * 60 * 1000);
  }
}
