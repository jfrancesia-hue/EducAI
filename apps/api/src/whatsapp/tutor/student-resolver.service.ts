import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  ParentalConsentMissingError,
  StudentNotEnrolledError,
  StudentSelectionRequiredError,
} from "../webhooks/errors/webhook.errors.js";

export interface ResolvedStudent {
  studentId: string;
  studentName: string;
  grade: number;
  studentProfileId: string;
  whatsappPhone: string;
  replyWhatsappPhone?: string;
  contactRole?: "STUDENT" | "PARENT" | "GUARDIAN";
  preferredChannel: string;
  learningStyle: string | null;
  diagnosticCompleted: boolean;
  familyId: string;
  tenantId: string;
  subscription: {
    id: string;
    product?: string;
    plan: string;
    planCode?: string | null;
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

  async resolveByWhatsapp(rawPhone: string, body?: string): Promise<ResolvedStudent> {
    const phone = this.normalize(rawPhone);
    const contacts = await this.prisma.educaiWhatsappContact.findMany({
      where: {
        phone,
        canReceiveTutor: true,
        deletedAt: null,
      },
      include: {
        studentProfile: {
          include: {
            student: {
              include: {
                family: {
                  include: { subscription: true },
                },
              },
            },
          },
        },
      },
    });

    const activeContacts = contacts.filter(
      (contact) => contact.studentProfile.student && !contact.studentProfile.student.deletedAt,
    );

    if (activeContacts.length === 1) {
      const contact = activeContacts[0]!;
      const resolved = this.fromProfile(contact.studentProfile, phone, contact.role);
      await this.assertActiveParentalConsent(resolved.studentId, resolved.tenantId);
      return resolved;
    }

    if (activeContacts.length > 1) {
      const selected = this.selectByStudentName(activeContacts, body);
      if (selected) {
        const resolved = this.fromProfile(selected.studentProfile, phone, selected.role);
        await this.assertActiveParentalConsent(resolved.studentId, resolved.tenantId);
        return resolved;
      }

      const names = activeContacts.map((contact) => contact.studentProfile.student.firstName);
      throw new StudentSelectionRequiredError(phone, names);
    }

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

    const resolved = this.fromProfile(profile, phone, "STUDENT");
    await this.assertActiveParentalConsent(resolved.studentId, resolved.tenantId);
    return resolved;
  }

  async resolveByStudentForFamily(input: {
    studentId: string;
    tenantId: string;
    familyId: string;
  }): Promise<ResolvedStudent> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: {
        studentId: input.studentId,
        tenantId: input.tenantId,
        student: {
          familyId: input.familyId,
          deletedAt: null,
        },
      },
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
      throw new StudentNotEnrolledError(input.studentId);
    }

    const resolved = this.fromProfile(profile, profile.whatsappPhone ?? "", "STUDENT");
    await this.assertActiveParentalConsent(resolved.studentId, resolved.tenantId);
    return resolved;
  }

  /**
   * Verifica que exista un ParentalConsent activo para el estudiante:
   * no revocado y con los 3 flags requeridos en true (términos, privacidad
   * y procesamiento por IA). Sin esto no podemos responder a un menor
   * por las leyes de protección de menores (Ley 26.061 AR, LGPD BR, COPPA).
   *
   * Fail-closed: si no hay registro O fue revocado O algún flag está en
   * false, lanzamos ParentalConsentMissingError y el orquestador devuelve
   * un mensaje pidiendo que un adulto active la familia.
   */
  async assertActiveParentalConsent(studentId: string, tenantId: string): Promise<void> {
    if (process.env.APOYOAI_PARENTAL_CONSENT_ENFORCEMENT === "off") {
      // Escape hatch para tests internos y entornos de desarrollo. No se
      // debería usar en producción; el secrets matrix la marca como ausente.
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

  private fromProfile(
    profile: {
      id: string;
      tenantId: string;
      grade: number;
      preferredChannel: string;
      learningStyle: string | null;
      diagnosticCompleted: boolean;
      whatsappPhone: string | null;
      student: {
        id: string;
        firstName: string;
        family: {
          id: string;
          subscription: {
            id: string;
            product?: string;
            plan: string;
            planCode?: string | null;
            status: string;
            currentPeriodEnd: Date;
          } | null;
        };
      };
    },
    replyPhone: string,
    contactRole: "STUDENT" | "PARENT" | "GUARDIAN",
  ): ResolvedStudent {
    const family = profile.student.family;
    if (!family || !family.subscription) {
      throw new StudentNotEnrolledError(replyPhone);
    }

    return {
      studentId: profile.student.id,
      studentName: profile.student.firstName,
      grade: profile.grade,
      studentProfileId: profile.id,
      whatsappPhone: profile.whatsappPhone ?? replyPhone,
      replyWhatsappPhone: replyPhone,
      contactRole,
      preferredChannel: profile.preferredChannel,
      learningStyle: profile.learningStyle,
      diagnosticCompleted: profile.diagnosticCompleted,
      familyId: family.id,
      tenantId: profile.tenantId,
      subscription: {
        id: family.subscription.id,
        product: family.subscription.product,
        plan: family.subscription.planCode ?? family.subscription.plan,
        planCode: family.subscription.planCode,
        status: family.subscription.status,
        currentPeriodEnd: family.subscription.currentPeriodEnd,
      },
    };
  }

  private selectByStudentName<
    T extends { studentProfile: { student: { firstName: string; lastName?: string | null } } },
  >(contacts: T[], body?: string): T | null {
    const normalized = this.normalizeText(body ?? "");
    if (!normalized) {
      return null;
    }

    return (
      contacts.find((contact) => {
        const firstName = this.normalizeText(contact.studentProfile.student.firstName);
        const lastName = this.normalizeText(contact.studentProfile.student.lastName ?? "");
        return (
          Boolean(firstName && normalized.includes(firstName)) ||
          Boolean(lastName && normalized.includes(lastName))
        );
      }) ?? null
    );
  }

  private normalizeText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  normalize(rawPhone: string): string {
    if (!rawPhone) {
      return rawPhone;
    }
    return rawPhone.replace(/^whatsapp:/i, "").trim();
  }
}
