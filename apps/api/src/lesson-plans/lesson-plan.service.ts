import { Injectable, NotFoundException } from "@nestjs/common";
import { PlanGeneratorAgent } from "@educai/ai";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LessonPlanService {
  private readonly generator = new PlanGeneratorAgent();

  constructor(private readonly prisma: PrismaService) {}

  async generate(input: {
    tenantId: string;
    teacherId: string;
    grade: number;
    subject: string;
    topic: string;
    sessionCount: number;
    totalDurationMinutes: number;
  }) {
    const plan = await this.generator.generate(input);
    const created = await this.prisma.lessonPlan.create({
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
        generatedByAI: true,
      },
    });

    return { data: { id: created.id, plan } };
  }

  async findOne(id: string) {
    const lessonPlan = await this.prisma.lessonPlan.findUnique({ where: { id } });

    if (!lessonPlan) {
      throw new NotFoundException("Lesson plan not found");
    }

    return { data: lessonPlan };
  }
}

