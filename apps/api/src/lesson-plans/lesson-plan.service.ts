import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
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

    if (!user.email) {
      throw new ForbiddenException({
        code: "EMAIL_CONTEXT_MISSING",
        message: "Falta el email en la sesion autenticada",
      });
    }

    const appUser =
      (await this.prisma.user.findUnique({ where: { email: user.email } })) ??
      (await this.prisma.user.create({
        data: {
          tenantId: user.tenantId,
          email: user.email,
          fullName: user.email.split("@")[0] || "Administrador escolar",
          role: "SCHOOL_ADMIN",
        },
      }));

    if (appUser.tenantId && appUser.tenantId !== user.tenantId) {
      throw new ForbiddenException({
        code: "TENANT_CONTEXT_MISMATCH",
        message: "El usuario autenticado no pertenece al tenant solicitado",
      });
    }

    const existingTeacher = await this.prisma.teacher.findUnique({
      where: { userId: appUser.id },
    });

    if (existingTeacher) {
      if (
        existingTeacher.tenantId !== user.tenantId ||
        existingTeacher.schoolId !== user.schoolId
      ) {
        throw new ForbiddenException({
          code: "SCHOOL_CONTEXT_MISMATCH",
          message: "El perfil docente no pertenece a la escuela autenticada",
        });
      }

      return existingTeacher.id;
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        tenantId: user.tenantId,
        schoolId: user.schoolId,
        userId: appUser.id,
        title: "Administrador escolar",
        subjects: [],
      },
    });

    return teacher.id;
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
