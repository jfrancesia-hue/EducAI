import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { AnthropicLlmClient, PlanGeneratorAgent } from "@educai/ai";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { PrismaService } from "../prisma/prisma.service.js";

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
    let created: { id: string };
    try {
      created = await this.prisma.lessonPlan.create({
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
    } catch (error) {
      throw new InternalServerErrorException({
        code: "LESSON_PLAN_SAVE_FAILED",
        message: "No se pudo guardar la planificacion generada",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    }

    return { data: { id: created.id, plan } };
  }

  async findOne(id: string, access: { tenantId: string; teacherId?: string; schoolId?: string }) {
    const lessonPlan = await this.prisma.lessonPlan.findFirst({
      where: {
        id,
        tenantId: access.tenantId,
        ...(access.teacherId ? { teacherId: access.teacherId } : {}),
        ...(access.schoolId ? { teacher: { schoolId: access.schoolId } } : {}),
      },
    });

    if (!lessonPlan) {
      throw new NotFoundException("Lesson plan not found");
    }

    return { data: lessonPlan };
  }
}
