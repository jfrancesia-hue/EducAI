import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { StudentNotEnrolledError } from "../webhooks/errors/webhook.errors.js";

export interface ResolvedStudent {
  studentId: string;
  studentName: string;
  grade: number;
  studentProfileId: string;
  whatsappPhone: string;
  preferredChannel: string;
  learningStyle: string | null;
  diagnosticCompleted: boolean;
  familyId: string;
  tenantId: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: Date;
  };
}

/**
 * Identifica al alumno solicitante por su número de WhatsApp y carga
 * el contexto mínimo para orquestar la respuesta del tutor.
 *
 * Twilio prefija el número con "whatsapp:" — el resolver normaliza a E.164
 * (ej. "+5493815550202") antes de buscar.
 */
@Injectable()
export class StudentResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveByWhatsapp(rawPhone: string): Promise<ResolvedStudent> {
    const phone = this.normalize(rawPhone);

    const profile = await this.prisma.studentProfile.findUnique({
      where: { whatsappPhone: phone },
      include: {
        student: {
          include: {
            family: {
              include: { subscription: true },
            },
          },
        },
      },
    });

    if (!profile || !profile.student || profile.student.deletedAt) {
      throw new StudentNotEnrolledError(phone);
    }

    const family = profile.student.family;
    if (!family || !family.subscription) {
      throw new StudentNotEnrolledError(phone);
    }

    return {
      studentId: profile.student.id,
      studentName: profile.student.firstName,
      grade: profile.grade,
      studentProfileId: profile.id,
      whatsappPhone: phone,
      preferredChannel: profile.preferredChannel,
      learningStyle: profile.learningStyle,
      diagnosticCompleted: profile.diagnosticCompleted,
      familyId: family.id,
      tenantId: profile.tenantId,
      subscription: {
        id: family.subscription.id,
        plan: family.subscription.plan,
        status: family.subscription.status,
        currentPeriodEnd: family.subscription.currentPeriodEnd,
      },
    };
  }

  normalize(rawPhone: string): string {
    if (!rawPhone) {
      return rawPhone;
    }
    return rawPhone.replace(/^whatsapp:/i, "").trim();
  }
}
