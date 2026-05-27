import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  AnthropicLlmClient,
  EDUCAI_LIMITS,
  PlanGeneratorAgent,
  normalizeEducAIPlan,
} from "@educai/ai";
import { Prisma } from "@educai/database";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { PrismaService } from "../prisma/prisma.service.js";

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class LessonPlanService {
  private readonly generator: PlanGeneratorAgent;

  constructor(private readonly prisma: PrismaService) {
    this.generator = process.env.ANTHROPIC_API_KEY?.trim()
      ? new PlanGeneratorAgent(new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY }))
      : new PlanGeneratorAgent();
  }

  async resolveTeacherIdForPlanning(user: AuthenticatedUser) {
    if (user.teacherId) {
      return user.teacherId;
    }

    if (user.role !== "SCHOOL_ADMIN") {
      throw new ForbiddenException({
        code: "TEACHERID_CONTEXT_MISSING",
        message: "Falta el claim teacherId en la sesion autenticada",
      });
    }

    if (!user.tenantId) {
      throw new ForbiddenException({
        code: "TENANTID_CONTEXT_MISSING",
        message: "Falta el claim tenantId en la sesion autenticada",
      });
    }

    if (!user.schoolId) {
      throw new ForbiddenException({
        code: "SCHOOLID_CONTEXT_MISSING",
        message: "Falta el claim schoolId en la sesion autenticada",
      });
    }

    try {
      const existingTeacher = await this.prisma.teacher.findFirst({
        where: {
          tenantId: user.tenantId,
          schoolId: user.schoolId,
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
      });

      if (!existingTeacher) {
        throw new ForbiddenException({
          code: "TEACHER_PROFILE_MISSING",
          message: "La escuela no tiene un perfil docente disponible para guardar la clase",
        });
      }

      return existingTeacher.id;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: "PLANNER_PROFILE_FAILED",
        message: "No se pudo preparar el perfil docente para generar la clase",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  async generate(input: {
    tenantId: string;
    teacherId: string;
    plan?: string;
    educationLevel: "primaria" | "secundaria" | "terciario" | "universitario";
    grade: number;
    subject: string;
    courseLabel?: string;
    institutionName?: string;
    lessonIntent?: string;
    levelContext?: string;
    plannedDate?: string;
    careerName?: string;
    topic: string;
    sessionCount: number;
    totalDurationMinutes: number;
    learningGoal?: string;
    groupProfile?: string;
    priorKnowledge?: string;
    curriculumContext?: string;
    availableResources?: string;
    assessmentFocus?: string;
    inclusionNeeds?: string;
    outputFormat?: string;
  }) {
    await this.assertCanGenerateLessonPlan({
      tenantId: input.tenantId,
      teacherId: input.teacherId,
      plan: input.plan,
    });

    const plan = await this.generator.generate(input);
    let created: { id: string };
    try {
      created = await this.prisma.$transaction(async (tx) => {
        await this.enableRlsBypass(tx);

        return tx.lessonPlan.create({
          data: {
            tenantId: input.tenantId,
            teacherId: input.teacherId,
            grade: input.grade,
            subject: input.subject,
            topic: input.topic,
            durationMinutes: input.totalDurationMinutes,
            competences: plan.competences,
            objectives: plan.objectives,
            activities: plan.sessions,
            resources: plan.sessions.flatMap((session) => session.resources),
            assessment: plan.assessment,
            adaptations: {
              planningContext: {
                educationLevel: input.educationLevel,
                courseLabel: input.courseLabel,
                institutionName: input.institutionName,
                lessonIntent: input.lessonIntent,
                levelContext: input.levelContext,
                plannedDate: input.plannedDate,
                careerName: input.careerName,
                learningGoal: input.learningGoal,
                groupProfile: input.groupProfile,
                priorKnowledge: input.priorKnowledge,
                curriculumContext: input.curriculumContext,
                availableResources: input.availableResources,
                assessmentFocus: input.assessmentFocus,
                inclusionNeeds: input.inclusionNeeds,
                outputFormat: input.outputFormat,
              },
              differentiation: plan.sessions.map((session) => ({
                session: session.number,
                differentiation: session.differentiation,
              })),
              overview: plan.overview,
              printables: plan.printables,
            },
            generatedByAI: true,
          },
        });
      });
    } catch (error) {
      throw new InternalServerErrorException({
        code: "LESSON_PLAN_SAVE_FAILED",
        message: "No se pudo guardar la planificacion generada",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    }

    return { data: { id: created.id, plan } };
  }

  private async assertCanGenerateLessonPlan(input: {
    tenantId: string;
    teacherId: string;
    plan?: string;
  }): Promise<void> {
    const quota = this.resolveLessonPlanQuota(input.plan);
    if (!quota) {
      return;
    }

    const usage = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);

      const [used, credits] = await Promise.all([
        tx.lessonPlan.count({
          where: {
            tenantId: input.tenantId,
            teacherId: input.teacherId,
            deletedAt: null,
            ...(quota.periodStart ? { createdAt: { gte: quota.periodStart } } : {}),
          },
        }),
        tx.usageCreditLedger.aggregate({
          _sum: { amount: true },
          where: {
            tenantId: input.tenantId,
            product: "EDUCAI",
            unit: "lesson_plan",
            OR: [{ teacherId: input.teacherId }, { teacherId: null }],
            AND: [
              {
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            ],
          },
        }),
      ]);

      return {
        used,
        extraCredits: Math.max(0, credits._sum.amount ?? 0),
      };
    });

    const effectiveLimit = quota.limit + usage.extraCredits;
    if (usage.used >= effectiveLimit) {
      throw new ForbiddenException({
        code: "LESSON_PLAN_QUOTA_EXCEEDED",
        message:
          quota.period === "lifetime"
            ? `Alcanzaste el limite Free de ${quota.limit} planificaciones.`
            : `Alcanzaste el limite mensual de ${quota.limit} planificaciones para tu plan.`,
        plan: quota.plan,
        baseLimit: quota.limit,
        extraCredits: usage.extraCredits,
        limit: effectiveLimit,
        used: usage.used,
        period: quota.period,
      });
    }
  }

  private resolveLessonPlanQuota(plan: string | undefined): {
    plan: string;
    limit: number;
    period: "lifetime" | "monthly";
    periodStart?: Date;
  } | null {
    const normalizedPlan = normalizeEducAIPlan(plan);
    const limits = EDUCAI_LIMITS[normalizedPlan];

    if ("planificaciones" in limits) {
      const lessonPlanLimit = limits.planificaciones;
      if ("total_vida" in lessonPlanLimit) {
        return {
          plan: normalizedPlan,
          limit: lessonPlanLimit.total_vida,
          period: "lifetime",
        };
      }

      if (lessonPlanLimit.mensual === null) {
        return null;
      }

      return {
        plan: normalizedPlan,
        limit: lessonPlanLimit.mensual,
        period: "monthly",
        periodStart: this.currentMonthStart(),
      };
    }

    if ("planificaciones_por_docente_activo" in limits) {
      return {
        plan: normalizedPlan,
        limit: limits.planificaciones_por_docente_activo.mensual,
        period: "monthly",
        periodStart: this.currentMonthStart(),
      };
    }

    return null;
  }

  private currentMonthStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  private async enableRlsBypass(tx: PrismaTx): Promise<void> {
    await tx.$executeRawUnsafe("SELECT set_config('app.bypass_rls', 'true', true)");
  }

  async findOne(id: string, access: { tenantId: string; teacherId?: string; schoolId?: string }) {
    const lessonPlan = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);

      return tx.lessonPlan.findFirst({
        where: {
          id,
          tenantId: access.tenantId,
          ...(access.teacherId ? { teacherId: access.teacherId } : {}),
          ...(access.schoolId ? { teacher: { schoolId: access.schoolId } } : {}),
        },
      });
    });

    if (!lessonPlan) {
      throw new NotFoundException("Lesson plan not found");
    }

    return { data: lessonPlan };
  }
}
