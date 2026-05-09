import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AnthropicLlmClient, PlanGeneratorAgent } from "@educai/ai";
import { Prisma } from "@educai/database";
import { isElevatedRole, type AuthenticatedUser } from "../auth/types.js";
import { PrismaService } from "../prisma/prisma.service.js";

type RlsDb = Prisma.TransactionClient;

@Injectable()
export class LessonPlanService {
  private readonly generator = new PlanGeneratorAgent(
    process.env.ANTHROPIC_API_KEY
      ? new AnthropicLlmClient({
          defaultModel: "claude-3-5-sonnet-latest",
          defaultMaxTokens: 1800,
        })
      : undefined,
  );

  constructor(private readonly prisma: PrismaService) {}

  async generate(
    input: {
      tenantId: string;
      teacherId: string;
      grade: number;
      subject: string;
      topic: string;
      sessionCount: number;
      totalDurationMinutes: number;
    },
    user: AuthenticatedUser,
  ) {
    const teacherId = this.resolveTeacherId(input.teacherId, user);
    await this.prisma.withUser(user, (db) =>
      this.ensureTeacherInTenant(db, teacherId, user.tenantId),
    );

    const plan = await this.generator.generate({
      grade: input.grade,
      subject: input.subject,
      topic: input.topic,
      sessionCount: input.sessionCount,
      totalDurationMinutes: input.totalDurationMinutes,
    });
    const created = await this.prisma.withUser(user, (db) =>
      db.lessonPlan.create({
        data: {
          tenantId: user.tenantId,
          teacherId,
          grade: input.grade,
          subject: input.subject,
          topic: input.topic,
          durationMinutes: input.totalDurationMinutes,
          competences: plan.competences,
          objectives: plan.objectives,
          activities: plan.sessions,
          resources: plan.sessions.flatMap((session) => session.resources),
          assessment: plan.assessment,
          generatedByAI: true,
        },
      }),
    );

    return { data: { id: created.id, plan } };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const lessonPlan = await this.prisma.withUser(user, (db) =>
      db.lessonPlan.findFirst({
        where: { id, tenantId: user.tenantId },
      }),
    );

    if (!lessonPlan) {
      throw new NotFoundException("Lesson plan not found");
    }

    if (!isElevatedRole(user) && user.teacherId !== lessonPlan.teacherId) {
      throw new ForbiddenException({
        code: "TEACHER_ACCESS_DENIED",
        message: `El usuario autenticado no tiene acceso a la planificacion ${id}`,
        lessonPlanId: id,
      });
    }

    return { data: lessonPlan };
  }

  private resolveTeacherId(inputTeacherId: string, user: AuthenticatedUser): string {
    if (isElevatedRole(user)) {
      return inputTeacherId;
    }
    if (!user.teacherId || user.teacherId !== inputTeacherId) {
      throw new ForbiddenException({
        code: "TEACHER_ACCESS_DENIED",
        message: `El usuario autenticado no puede operar como docente ${inputTeacherId}`,
        teacherId: inputTeacherId,
      });
    }
    return user.teacherId;
  }

  private async ensureTeacherInTenant(
    db: RlsDb,
    teacherId: string,
    tenantId: string,
  ): Promise<void> {
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
  }
}
