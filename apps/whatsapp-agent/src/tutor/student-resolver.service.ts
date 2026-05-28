import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  ParentalConsentMissingError,
  StudentNotEnrolledError,
} from "../webhooks/errors/webhook.errors.js";

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

    await this.assertActiveParentalConsent(profile.student.id, profile.tenantId);

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

  /**
   * Verifica que exista un ParentalConsent activo para el estudiante:
   * no revocado y con los 3 flags requeridos en true (términos, privacidad
   * y procesamiento por IA). Sin esto no podemos responder a un menor
   * por las leyes de protección de menores (Ley 26.061 AR, LGPD BR, COPPA).
   */
  async assertActiveParentalConsent(studentId: string, tenantId: string): Promise<void> {
    if (process.env.APOYOAI_PARENTAL_CONSENT_ENFORCEMENT === "off") {
      return;
    }

    const consent = await this.prisma.parentalConsent.findFirst({
      where: {
        studentId,
        tenantId,
        revokedAt: null,
      },
      orderBy: { signedAt: "desc" },
      select: {
        termsAccepted: true,
        privacyAccepted: true,
        aiProcessingAccepted: true,
      },
    });

    if (!consent) {
      throw new ParentalConsentMissingError(studentId, "no_consent_record");
    }

    if (!consent.termsAccepted || !consent.privacyAccepted || !consent.aiProcessingAccepted) {
      throw new ParentalConsentMissingError(studentId, "consent_incomplete");
    }
  }

  normalize(rawPhone: string): string {
    if (!rawPhone) {
      return rawPhone;
    }
    return rawPhone.replace(/^whatsapp:/i, "").trim();
  }
}
