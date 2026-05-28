import { Injectable, Logger } from "@nestjs/common";
import { EDUCAI_LIMITS, normalizeEducAIPlan } from "@educai/ai";
import { Prisma } from "@educai/database";

import { PrismaService } from "../prisma/prisma.service.js";

const HANDOFF_ACTION = "human_handoff.requested";

type HandoffMetadata = {
  status?: string;
  source?: string;
  requestedAt?: string;
  resolvedAt?: string;
  [key: string]: unknown;
};

type InstitutionalInput = {
  role?: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER";
  tenantId: string;
  schoolId?: string;
  teacherId?: string;
  plan?: string;
};

type PrismaTx = Prisma.TransactionClient;
type SubjectCountRow = { subject: string; _count: { _all: number } };
type RecentLessonPlanRow = {
  id: string;
  grade: number;
  subject: string;
  topic: string;
  status: string;
  durationMinutes: number;
  generatedByAI: boolean;
  createdAt: Date;
};
type LessonPlanSummary = {
  count: number;
  recent: RecentLessonPlanRow[];
};
type RecentStudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  school: { name: string } | null;
  profile: {
    learningStyle: string | null;
    diagnosticCompleted: boolean;
    strongSubjects: string[];
    weakSubjects: string[];
  } | null;
};
type LessonPlanQuota = {
  plan: string;
  period: "lifetime" | "monthly" | "unlimited";
  used: number;
  baseLimit: number | null;
  extraCredits: number;
  effectiveLimit: number | null;
  remaining: number | null;
};

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getInstitutionalOverview(input: InstitutionalInput) {
    return this.getInstitutionalOverviewWithClient(input);
  }

  async getPlanningOverview(input: InstitutionalInput) {
    const lessonPlanWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.teacherId ? { teacherId: input.teacherId } : {}),
    };

    const { lessonPlanSummary, lessonPlanQuota } = await this.readDashboardValue<{
      lessonPlanSummary: LessonPlanSummary;
      lessonPlanQuota: LessonPlanQuota | null;
    }>(
      "planning.overview",
      {
        lessonPlanSummary: { count: 0, recent: [] },
        lessonPlanQuota: null,
      },
      async (prisma) => {
        const visibleWhere = {
          ...lessonPlanWhere,
          status: { notIn: ["pending", "running", "failed"] },
        };
        const count = await prisma.lessonPlan.count({ where: visibleWhere });
        const recent = await prisma.lessonPlan.findMany({
          where: visibleWhere,
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            grade: true,
            subject: true,
            topic: true,
            status: true,
            durationMinutes: true,
            generatedByAI: true,
            createdAt: true,
          },
        });
        const lessonPlanQuota = await this.getLessonPlanQuota(prisma, input);

        return { lessonPlanSummary: { count, recent }, lessonPlanQuota };
      },
    );

    return {
      data: {
        scope: input.role === "TEACHER" ? "teacher" : "institution",
        metrics: {
          lessonPlanCount: lessonPlanSummary.count,
        },
        recentLessonPlans: lessonPlanSummary.recent.map((plan) => ({
          ...plan,
          createdAt: plan.createdAt.toISOString(),
        })),
        lessonPlanQuota,
      },
    };
  }

  async getStudentsOverview(input: InstitutionalInput) {
    const studentWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    };

    const profileWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.schoolId ? { student: { schoolId: input.schoolId, deletedAt: null } } : {}),
    };

    const { studentCount, profileCount, diagnosticCompletedCount, recentStudents, recentSessions } =
      await this.readDashboardValue<{
        studentCount: number;
        profileCount: number;
        diagnosticCompletedCount: number;
        recentStudents: RecentStudentRow[];
        recentSessions: { _sum: { durationMinutes: number | null } } | null;
      }>(
        "students.overview",
        {
          studentCount: 0,
          profileCount: 0,
          diagnosticCompletedCount: 0,
          recentStudents: [],
          recentSessions: null,
        },
        async (prisma) => {
          const studentCount = await prisma.student.count({ where: studentWhere });
          const profileCount = await prisma.studentProfile.count({ where: profileWhere });
          const diagnosticCompletedCount = await prisma.studentProfile.count({
            where: {
              ...profileWhere,
              diagnosticCompleted: true,
            },
          });
          const recentStudents = await prisma.student.findMany({
            where: studentWhere,
            orderBy: { createdAt: "desc" },
            take: 24,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              grade: true,
              school: { select: { name: true } },
              profile: {
                select: {
                  learningStyle: true,
                  diagnosticCompleted: true,
                  strongSubjects: true,
                  weakSubjects: true,
                },
              },
            },
          });
          const recentSessions = await prisma.learningSession.aggregate({
            where: {
              tenantId: input.tenantId,
              ...(input.schoolId
                ? { studentProfile: { student: { schoolId: input.schoolId } } }
                : {}),
              createdAt: { gte: this.startOfWeek() },
            },
            _sum: { durationMinutes: true },
          });

          return {
            studentCount,
            profileCount,
            diagnosticCompletedCount,
            recentStudents,
            recentSessions,
          };
        },
      );

    const diagnosticRate =
      profileCount > 0 ? Math.round((diagnosticCompletedCount / profileCount) * 100) : 0;

    return {
      data: {
        scope: input.role === "TEACHER" ? "teacher" : "institution",
        metrics: {
          studentCount,
          diagnosticCompletionRate: diagnosticRate,
          learningMinutesThisWeek: recentSessions?._sum.durationMinutes ?? 0,
        },
        recentStudents: this.mapRecentStudents(recentStudents),
      },
    };
  }

  async getReportsOverview(input: InstitutionalInput) {
    const studentWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    };

    const profileWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.schoolId ? { student: { schoolId: input.schoolId, deletedAt: null } } : {}),
    };

    const lessonPlanWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.teacherId ? { teacherId: input.teacherId } : {}),
    };

    const curriculumWhere = {
      tenantId: input.tenantId,
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    };

    const {
      studentCount,
      profileCount,
      diagnosticCompletedCount,
      lessonPlanCount,
      curriculumCount,
      lessonPlanBySubject,
      handoffLogs,
      recentSessions,
      recentStudents,
    } = await this.readDashboardValue<{
      studentCount: number;
      profileCount: number;
      diagnosticCompletedCount: number;
      lessonPlanCount: number;
      curriculumCount: number;
      lessonPlanBySubject: SubjectCountRow[];
      handoffLogs: Array<{ metadata: Prisma.JsonValue }>;
      recentSessions: { _sum: { durationMinutes: number | null } } | null;
      recentStudents: RecentStudentRow[];
    }>(
      "reports.overview",
      {
        studentCount: 0,
        profileCount: 0,
        diagnosticCompletedCount: 0,
        lessonPlanCount: 0,
        curriculumCount: 0,
        lessonPlanBySubject: [],
        handoffLogs: [],
        recentSessions: null,
        recentStudents: [],
      },
      async (prisma) => {
        const studentCount = await prisma.student.count({ where: studentWhere });
        const profileCount = await prisma.studentProfile.count({ where: profileWhere });
        const diagnosticCompletedCount = await prisma.studentProfile.count({
          where: {
            ...profileWhere,
            diagnosticCompleted: true,
          },
        });
        const lessonPlanCount = await prisma.lessonPlan.count({ where: lessonPlanWhere });
        const curriculumCount = await prisma.curriculum.count({ where: curriculumWhere });
        const rows = await prisma.lessonPlan.groupBy({
          by: ["subject"],
          where: lessonPlanWhere,
          _count: { _all: true },
          orderBy: { _count: { subject: "desc" } },
          take: 6,
        });
        const handoffLogs = await prisma.auditLog.findMany({
          where: {
            tenantId: input.tenantId,
            action: HANDOFF_ACTION,
          },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            metadata: true,
          },
        });
        const recentSessions = await prisma.learningSession.aggregate({
          where: {
            tenantId: input.tenantId,
            ...(input.schoolId
              ? { studentProfile: { student: { schoolId: input.schoolId } } }
              : {}),
            createdAt: { gte: this.startOfWeek() },
          },
          _sum: { durationMinutes: true },
        });
        const recentStudents = await prisma.student.findMany({
          where: studentWhere,
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
            school: { select: { name: true } },
            profile: {
              select: {
                learningStyle: true,
                diagnosticCompleted: true,
                strongSubjects: true,
                weakSubjects: true,
              },
            },
          },
        });

        return {
          studentCount,
          profileCount,
          diagnosticCompletedCount,
          lessonPlanCount,
          curriculumCount,
          lessonPlanBySubject: rows.map((row) => ({
            subject: row.subject,
            _count: { _all: row._count._all },
          })),
          handoffLogs,
          recentSessions,
          recentStudents,
        };
      },
    );

    const openHandoffs = handoffLogs.filter(
      (log) => this.getHandoffStatus(log.metadata) !== "closed",
    );
    const diagnosticRate =
      profileCount > 0 ? Math.round((diagnosticCompletedCount / profileCount) * 100) : 0;

    return {
      data: {
        scope: input.role === "TEACHER" ? "teacher" : "institution",
        metrics: {
          studentCount,
          lessonPlanCount,
          curriculumCount,
          openHandoffCount: openHandoffs.length,
          diagnosticCompletionRate: diagnosticRate,
          learningMinutesThisWeek: recentSessions?._sum.durationMinutes ?? 0,
        },
        recentStudents: this.mapRecentStudents(recentStudents),
        subjectMix: lessonPlanBySubject.map((item) => ({
          subject: item.subject,
          count: item._count._all,
        })),
      },
    };
  }

  private async getInstitutionalOverviewWithClient(input: InstitutionalInput) {
    const studentWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    };

    const profileWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.schoolId ? { student: { schoolId: input.schoolId, deletedAt: null } } : {}),
    };

    const lessonPlanWhere = {
      tenantId: input.tenantId,
      deletedAt: null,
      ...(input.teacherId ? { teacherId: input.teacherId } : {}),
    };

    const curriculumWhere = {
      tenantId: input.tenantId,
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    };

    const lessonPlanSummary = await this.readDashboardValue<LessonPlanSummary>(
      "lessonPlanSummary",
      { count: 0, recent: [] },
      async (prisma) => {
        const visibleWhere = {
          ...lessonPlanWhere,
          status: { notIn: ["pending", "running", "failed"] },
        };
        const count = await prisma.lessonPlan.count({ where: visibleWhere });
        const recent = await prisma.lessonPlan.findMany({
          where: visibleWhere,
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            grade: true,
            subject: true,
            topic: true,
            status: true,
            durationMinutes: true,
            generatedByAI: true,
            createdAt: true,
          },
        });

        return { count, recent };
      },
    );
    const lessonPlanQuota = await this.readDashboardValue<LessonPlanQuota | null>(
      "lessonPlanQuota",
      null,
      (prisma) => this.getLessonPlanQuota(prisma, input),
    );

    const studentCount = await this.readDashboardValue("studentCount", 0, (prisma) =>
      prisma.student.count({ where: studentWhere }),
    );
    const profileCount = await this.readDashboardValue("profileCount", 0, (prisma) =>
      prisma.studentProfile.count({ where: profileWhere }),
    );
    const diagnosticCompletedCount = await this.readDashboardValue(
      "diagnosticCompletedCount",
      0,
      (prisma) =>
        prisma.studentProfile.count({
          where: {
            ...profileWhere,
            diagnosticCompleted: true,
          },
        }),
    );
    const curriculumCount = await this.readDashboardValue("curriculumCount", 0, (prisma) =>
      prisma.curriculum.count({ where: curriculumWhere }),
    );
    const recentStudents = await this.readDashboardValue("recentStudents", [], (prisma) =>
      prisma.student.findMany({
        where: studentWhere,
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          grade: true,
          school: { select: { name: true } },
          profile: {
            select: {
              learningStyle: true,
              diagnosticCompleted: true,
              strongSubjects: true,
              weakSubjects: true,
            },
          },
        },
      }),
    );
    const lessonPlanBySubject = await this.readDashboardValue<SubjectCountRow[]>(
      "lessonPlanBySubject",
      [],
      async (prisma) => {
        const rows = await prisma.lessonPlan.groupBy({
          by: ["subject"],
          where: lessonPlanWhere,
          _count: { _all: true },
          orderBy: { _count: { subject: "desc" } },
          take: 6,
        });

        return rows.map((row) => ({ subject: row.subject, _count: { _all: row._count._all } }));
      },
    );
    const handoffLogs = await this.readDashboardValue("handoffLogs", [], (prisma) =>
      prisma.auditLog.findMany({
        where: {
          tenantId: input.tenantId,
          action: HANDOFF_ACTION,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          createdAt: true,
          metadata: true,
        },
      }),
    );
    const recentSessions = await this.readDashboardValue("recentSessions", null, (prisma) =>
      prisma.learningSession.aggregate({
        where: {
          tenantId: input.tenantId,
          ...(input.schoolId ? { studentProfile: { student: { schoolId: input.schoolId } } } : {}),
          createdAt: { gte: this.startOfWeek() },
        },
        _sum: { durationMinutes: true },
      }),
    );

    const openHandoffs = handoffLogs.filter(
      (log) => this.getHandoffStatus(log.metadata) !== "closed",
    );
    const diagnosticRate =
      profileCount > 0 ? Math.round((diagnosticCompletedCount / profileCount) * 100) : 0;

    return {
      data: {
        scope: input.role === "TEACHER" ? "teacher" : "institution",
        metrics: {
          studentCount,
          lessonPlanCount: lessonPlanSummary.count,
          curriculumCount,
          openHandoffCount: openHandoffs.length,
          diagnosticCompletionRate: diagnosticRate,
          learningMinutesThisWeek: recentSessions?._sum.durationMinutes ?? 0,
        },
        recentStudents: recentStudents.map((student) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          grade: student.grade,
          schoolName: student.school?.name ?? null,
          diagnosticCompleted: student.profile?.diagnosticCompleted ?? false,
          learningStyle: student.profile?.learningStyle ?? null,
          strengths: student.profile?.strongSubjects ?? [],
          opportunities: student.profile?.weakSubjects ?? [],
        })),
        recentLessonPlans: lessonPlanSummary.recent.map((plan) => ({
          ...plan,
          createdAt: plan.createdAt.toISOString(),
        })),
        lessonPlanQuota,
        subjectMix: lessonPlanBySubject.map((item) => ({
          subject: item.subject,
          count: item._count._all,
        })),
      },
    };
  }

  private async enableRlsBypass(tx: PrismaTx): Promise<void> {
    await tx.$executeRawUnsafe("SELECT set_config('app.bypass_rls', 'true', true)");
  }

  private mapRecentStudents(students: RecentStudentRow[]) {
    return students.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      grade: student.grade,
      schoolName: student.school?.name ?? null,
      diagnosticCompleted: student.profile?.diagnosticCompleted ?? false,
      learningStyle: student.profile?.learningStyle ?? null,
      strengths: student.profile?.strongSubjects ?? [],
      opportunities: student.profile?.weakSubjects ?? [],
    }));
  }

  private async readDashboardValue<T>(
    label: string,
    fallback: T,
    callback: (prisma: PrismaTx) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.enableRlsBypass(tx);
        return callback(tx);
      });
    } catch (error) {
      this.logger.warn(
        `dashboard.${label}.failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      return fallback;
    }
  }

  private async getLessonPlanQuota(
    prisma: PrismaTx,
    input: InstitutionalInput,
  ): Promise<LessonPlanQuota> {
    const quota = this.resolveLessonPlanQuota(input.plan);
    if (!quota) {
      return {
        plan: normalizeEducAIPlan(input.plan),
        period: "unlimited",
        used: 0,
        baseLimit: null,
        extraCredits: 0,
        effectiveLimit: null,
        remaining: null,
      };
    }

    const [used, credits] = await Promise.all([
      prisma.lessonPlan.count({
        where: {
          tenantId: input.tenantId,
          deletedAt: null,
          ...(input.teacherId ? { teacherId: input.teacherId } : {}),
          ...(quota.periodStart ? { createdAt: { gte: quota.periodStart } } : {}),
        },
      }),
      prisma.usageCreditLedger.aggregate({
        _sum: { amount: true },
        where: {
          tenantId: input.tenantId,
          product: "EDUCAI",
          unit: "lesson_plan",
          OR: [...(input.teacherId ? [{ teacherId: input.teacherId }] : []), { teacherId: null }],
          AND: [
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          ],
        },
      }),
    ]);

    const extraCredits = Math.max(0, credits._sum.amount ?? 0);
    const effectiveLimit = quota.limit + extraCredits;
    return {
      plan: quota.plan,
      period: quota.period,
      used,
      baseLimit: quota.limit,
      extraCredits,
      effectiveLimit,
      remaining: Math.max(0, effectiveLimit - used),
    };
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

  async getMinistryOverview() {
    const [
      schoolCount,
      teacherCount,
      studentCount,
      curriculumCount,
      lessonPlanCount,
      schools,
      handoffLogs,
      lessonPlansBySubject,
      curriculaBySubject,
      auditActions,
      recentAudit,
    ] = await Promise.all([
      this.prisma.school.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.curriculum.count({ where: { deletedAt: null } }),
      this.prisma.lessonPlan.count({ where: { deletedAt: null } }),
      this.prisma.school.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          province: true,
          city: true,
          createdAt: true,
          _count: {
            select: {
              teachers: true,
              students: true,
              curricula: true,
            },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { action: HANDOFF_ACTION },
        orderBy: { createdAt: "desc" },
        take: 400,
        select: { id: true, metadata: true },
      }),
      this.prisma.lessonPlan.groupBy({
        by: ["subject"],
        where: { deletedAt: null },
        _count: { _all: true },
        orderBy: { _count: { subject: "desc" } },
        take: 8,
      }),
      this.prisma.curriculum.groupBy({
        by: ["subject"],
        where: { deletedAt: null },
        _count: { _all: true },
        orderBy: { _count: { subject: "desc" } },
        take: 8,
      }),
      this.prisma.auditLog.groupBy({
        by: ["action"],
        _count: { _all: true },
        orderBy: { _count: { action: "desc" } },
        take: 8,
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          action: true,
          entity: true,
          tenantId: true,
          createdAt: true,
        },
      }),
    ]);

    const openHandoffCount = handoffLogs.filter(
      (log) => this.getHandoffStatus(log.metadata) !== "closed",
    ).length;

    return {
      data: {
        metrics: {
          schoolCount,
          teacherCount,
          studentCount,
          curriculumCount,
          lessonPlanCount,
          openHandoffCount,
        },
        schools: schools.map((school) => ({
          id: school.id,
          name: school.name,
          province: school.province,
          city: school.city,
          createdAt: school.createdAt.toISOString(),
          teacherCount: school._count.teachers,
          studentCount: school._count.students,
          curriculumCount: school._count.curricula,
        })),
        lessonPlansBySubject: lessonPlansBySubject.map((item) => ({
          subject: item.subject,
          count: item._count._all,
        })),
        curriculaBySubject: curriculaBySubject.map((item) => ({
          subject: item.subject,
          count: item._count._all,
        })),
        auditActions: auditActions.map((item) => ({
          action: item.action,
          count: item._count._all,
        })),
        recentAudit: recentAudit.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    };
  }

  async getAdminConfigOverview() {
    const [
      tenantCount,
      userCount,
      roleCount,
      permissionCount,
      assignmentCount,
      recentUsers,
      tenantsByType,
      roles,
      recentTenants,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.role.count({ where: { deletedAt: null } }),
      this.prisma.permission.count({ where: { deletedAt: null } }),
      this.prisma.userRoleAssignment.count(),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      }),
      this.prisma.tenant.groupBy({
        by: ["type"],
        where: { deletedAt: null },
        _count: { _all: true },
        orderBy: { _count: { type: "desc" } },
      }),
      this.prisma.role.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        take: 20,
        select: {
          id: true,
          name: true,
          tenantId: true,
          _count: {
            select: {
              users: true,
              permissions: true,
            },
          },
        },
      }),
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: {
        metrics: {
          tenantCount,
          userCount,
          roleCount,
          permissionCount,
          assignmentCount,
        },
        tenantsByType: tenantsByType.map((item) => ({
          type: item.type,
          count: item._count._all,
        })),
        recentUsers: recentUsers.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        })),
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          tenantId: role.tenantId,
          userCount: role._count.users,
          permissionCount: role._count.permissions,
        })),
        recentTenants: recentTenants.map((tenant) => ({
          ...tenant,
          createdAt: tenant.createdAt.toISOString(),
        })),
      },
    };
  }

  private startOfWeek(reference: Date = new Date()): Date {
    const date = new Date(reference);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getHandoffStatus(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "open";
    }

    return ((value as HandoffMetadata).status ?? "open").toString();
  }
}
