import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";

export type InstitutionalToolName =
  | "student_summary"
  | "subscription_status"
  | "schedule_overview"
  | "recent_activity";

export interface InstitutionalToolResult {
  tool: InstitutionalToolName;
  summary: string;
  payload: Record<string, unknown>;
}

const PAYMENT_PATTERN =
  /\b(cuota|cuotas|pago|pagos|factura|facturas|abono|vencimiento|deuda|arancel)\b/i;
const SCHEDULE_PATTERN =
  /\b(horario|horarios|clase|clases|turno|cronograma|agenda|materia|materias)\b/i;
const PROGRESS_PATTERN =
  /\b(bolet[ií]n|nota|notas|asistencia|inasistencia|diagn[oó]stico|progreso|reporte)\b/i;

@Injectable()
export class InstitutionalToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async collectForMessage(
    student: ResolvedStudent,
    message: string,
  ): Promise<InstitutionalToolResult[]> {
    const tools = this.selectTools(message);
    const results: InstitutionalToolResult[] = [];

    for (const tool of tools) {
      switch (tool) {
        case "student_summary":
          results.push(await this.getStudentSummary(student));
          break;
        case "subscription_status":
          results.push(this.getSubscriptionStatus(student));
          break;
        case "schedule_overview":
          results.push(await this.getScheduleOverview(student));
          break;
        case "recent_activity":
          results.push(await this.getRecentActivity(student));
          break;
      }
    }

    return results;
  }

  private selectTools(message: string): InstitutionalToolName[] {
    const selected = new Set<InstitutionalToolName>(["student_summary"]);

    if (PAYMENT_PATTERN.test(message)) {
      selected.add("subscription_status");
    }

    if (SCHEDULE_PATTERN.test(message)) {
      selected.add("schedule_overview");
    }

    if (PROGRESS_PATTERN.test(message)) {
      selected.add("recent_activity");
    }

    return [...selected];
  }

  private async getStudentSummary(student: ResolvedStudent): Promise<InstitutionalToolResult> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: student.studentProfileId },
      include: {
        student: {
          include: {
            school: { select: { id: true, name: true } },
          },
        },
      },
    });

    const schoolName = profile?.student?.school?.name ?? "Sin escuela asociada";

    return {
      tool: "student_summary",
      summary: `${student.studentName} cursa ${student.grade} grado y figura en ${schoolName}.`,
      payload: {
        studentName: student.studentName,
        grade: student.grade,
        schoolName,
        learningStyle: student.learningStyle,
        diagnosticCompleted: student.diagnosticCompleted,
      },
    };
  }

  private getSubscriptionStatus(student: ResolvedStudent): InstitutionalToolResult {
    return {
      tool: "subscription_status",
      summary: `La familia tiene plan ${student.subscription.plan} con estado ${student.subscription.status}.`,
      payload: {
        plan: student.subscription.plan,
        status: student.subscription.status,
        currentPeriodEnd: student.subscription.currentPeriodEnd.toISOString(),
      },
    };
  }

  private async getScheduleOverview(student: ResolvedStudent): Promise<InstitutionalToolResult> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.studentId,
        status: "active",
        deletedAt: null,
      },
      include: {
        classroom: {
          select: {
            name: true,
            grade: true,
            shift: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      take: 6,
    });

    return {
      tool: "schedule_overview",
      summary:
        enrollments.length > 0
          ? `Tiene ${enrollments.length} cursadas activas registradas.`
          : "No hay cursadas activas registradas.",
      payload: {
        enrollments: enrollments.map((enrollment) => ({
          classroom: enrollment.classroom.name,
          grade: enrollment.classroom.grade,
          shift: enrollment.classroom.shift,
          subject: enrollment.subject?.name ?? null,
          subjectCode: enrollment.subject?.code ?? null,
        })),
      },
    };
  }

  private async getRecentActivity(student: ResolvedStudent): Promise<InstitutionalToolResult> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversation: {
          studentProfileId: student.studentProfileId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        role: true,
        createdAt: true,
      },
    });

    // Privacidad del menor: el padre tiene derecho a saber QUE su hijo está
    // usando el tutor (cuándo, cuánto, con qué frecuencia) pero NO a leer
    // las transcripciones de la conversación. El tool sólo expone metadata
    // agregada — nunca el contenido textual de los mensajes.
    const studentRoles = new Set(["student", "user", "web_student"]);
    const tutorRoles = new Set(["tutor", "assistant", "system"]);

    let studentMessages = 0;
    let tutorMessages = 0;
    for (const message of messages) {
      const role = message.role.toLowerCase();
      if (studentRoles.has(role)) {
        studentMessages += 1;
      } else if (tutorRoles.has(role)) {
        tutorMessages += 1;
      }
    }

    const last = messages[0]?.createdAt ?? null;
    const first = messages[messages.length - 1]?.createdAt ?? null;

    return {
      tool: "recent_activity",
      summary:
        messages.length > 0
          ? `Hay ${messages.length} mensajes recientes vinculados al alumno (${studentMessages} del alumno, ${tutorMessages} del tutor).`
          : "No hay mensajes recientes registrados.",
      payload: {
        totalMessages: messages.length,
        studentMessages,
        tutorMessages,
        lastInteractionAt: last?.toISOString() ?? null,
        firstInteractionAt: first?.toISOString() ?? null,
      },
    };
  }
}
