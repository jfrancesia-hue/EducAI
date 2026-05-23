import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
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
      return this.fromProfile(contact.studentProfile, phone, contact.role);
    }

    if (activeContacts.length > 1) {
      const selected = this.selectByStudentName(activeContacts, body);
      if (selected) {
        return this.fromProfile(selected.studentProfile, phone, selected.role);
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

    return this.fromProfile(profile, phone, "STUDENT");
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

    return this.fromProfile(profile, profile.whatsappPhone ?? "", "STUDENT");
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
