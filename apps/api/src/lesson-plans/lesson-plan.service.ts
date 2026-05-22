import { Injectable, NotFoundException } from "@nestjs/common";
import { AnthropicLlmClient, PlanGeneratorAgent } from "@educai/ai";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class LessonPlanService {
  private readonly generator: PlanGeneratorAgent;

  constructor(private readonly prisma: PrismaService) {
    this.generator = process.env.ANTHROPIC_API_KEY?.trim()
      ? new PlanGeneratorAgent(new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY }))
      : new PlanGeneratorAgent();
  }

  async generate(input: {
    tenantId: string;
    teacherId: string;
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
        },
        generatedByAI: true,
      },
    });

    return { data: { id: created.id, plan } };
  }

  async findOne(id: string, access: { tenantId: string; teacherId: string }) {
    const lessonPlan = await this.prisma.lessonPlan.findFirst({
      where: {
        id,
        tenantId: access.tenantId,
        teacherId: access.teacherId,
      },
    });

    if (!lessonPlan) {
      throw new NotFoundException("Lesson plan not found");
    }

    return { data: lessonPlan };
  }
}
