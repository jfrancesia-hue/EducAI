import { Injectable } from "@nestjs/common";

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
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getInstitutionalOverview(input: InstitutionalInput) {
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

    const [
      studentCount,
      profileCount,
      diagnosticCompletedCount,
      lessonPlanCount,
      curriculumCount,
      recentStudents,
      recentLessonPlans,
      lessonPlanBySubject,
      handoffLogs,
      recentSessions,
    ] = await Promise.all([
      this.prisma.student.count({ where: studentWhere }),
      this.prisma.studentProfile.count({ where: profileWhere }),
      this.prisma.studentProfile.count({
        where: {
          ...profileWhere,
          diagnosticCompleted: true,
        },
      }),
      this.prisma.lessonPlan.count({ where: lessonPlanWhere }),
      this.prisma.curriculum.count({ where: curriculumWhere }),
      this.prisma.student.findMany({
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
      this.prisma.lessonPlan.findMany({
        where: lessonPlanWhere,
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
      }),
      this.prisma.lessonPlan.groupBy({
        by: ["subject"],
        where: lessonPlanWhere,
        _count: { _all: true },
        orderBy: { _count: { subject: "desc" } },
        take: 6,
      }),
      this.prisma.auditLog.findMany({
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
      this.prisma.learningSession.aggregate({
        where: {
          tenantId: input.tenantId,
          ...(input.schoolId ? { studentProfile: { student: { schoolId: input.schoolId } } } : {}),
          createdAt: { gte: this.startOfWeek() },
        },
        _sum: { durationMinutes: true },
      }),
    ]);

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
          learningMinutesThisWeek: recentSessions._sum.durationMinutes ?? 0,
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
        recentLessonPlans: recentLessonPlans.map((plan) => ({
          ...plan,
          createdAt: plan.createdAt.toISOString(),
        })),
        subjectMix: lessonPlanBySubject.map((item) => ({
          subject: item.subject,
          count: item._count._all,
        })),
      },
    };
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
