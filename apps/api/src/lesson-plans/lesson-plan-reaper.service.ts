import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "../prisma/tenant-context.service.js";

const DEFAULT_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // cada 5 minutos
const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // un job no puede estar "pending/running" más de 30 minutos

@Injectable()
export class LessonPlanReaperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LessonPlanReaperService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs = readPositiveIntegerEnv(
    "LESSON_PLAN_REAPER_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );
  private readonly maxAgeMs = readPositiveIntegerEnv(
    "LESSON_PLAN_REAPER_MAX_AGE_MS",
    DEFAULT_MAX_AGE_MS,
  );
  private readonly enabled = process.env.LESSON_PLAN_REAPER_DISABLED !== "true";

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.warn({ event: "lesson_plan_reaper_disabled" });
      return;
    }
    // No corremos inmediato para no impactar el boot. Primer sweep a los `intervalMs`.
    this.timer = setInterval(() => {
      void this.sweep();
    }, this.intervalMs);
    this.timer.unref?.();
    this.logger.log({
      event: "lesson_plan_reaper_started",
      intervalMs: this.intervalMs,
      maxAgeMs: this.maxAgeMs,
    });
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async sweep(): Promise<void> {
    const cutoff = new Date(Date.now() - this.maxAgeMs);
    try {
      // Job de mantenimiento global (sin request ni tenant): barre planes colgados
      // de TODOS los tenants. Corre como operación de sistema con bypass explícito.
      const result = await this.tenantContext.runAsSystem(() =>
        this.prisma.lessonPlan.updateMany({
          where: {
            status: { in: ["pending", "running"] },
            updatedAt: { lt: cutoff },
          },
          data: { status: "failed" },
        }),
      );

      if (result.count > 0) {
        this.logger.warn({
          event: "lesson_plan_reaper_swept",
          count: result.count,
          cutoff: cutoff.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error({
        event: "lesson_plan_reaper_failed",
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
