import { Injectable } from "@nestjs/common";
import { Prisma } from "@educai/database";
import type { Logger } from "pino";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { isElevatedRole } from "../auth/types.js";
import {
  ConsentAlreadyRevokedError,
  ConsentNetworkMetadataMissingError,
  ConsentNotFoundError,
  ConsentStudentScopeError,
  ConsentTermsRequiredError,
} from "./errors/consent.errors.js";
import type { SignConsentDto } from "./dto/sign-consent.dto.js";

export interface SignConsentInput {
  dto: SignConsentDto;
  user: AuthenticatedUser;
  ipAddress?: string;
  userAgent?: string;
}

export interface RevokeConsentInput {
  consentId: string;
  reason?: string;
  user: AuthenticatedUser;
}

@Injectable()
export class ConsentService {
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "ConsentService" });
  }

  async sign(input: SignConsentInput) {
    const { dto, user, ipAddress, userAgent } = input;

    if (!dto.termsAccepted || !dto.privacyAccepted || !dto.aiProcessingAccepted) {
      throw new ConsentTermsRequiredError();
    }
    if (!ipAddress || !userAgent) {
      throw new ConsentNetworkMetadataMissingError();
    }

    await this.assertStudentInScope(dto.studentId, user);

    try {
      const consent = await this.prisma.withUser(user, (tx) =>
        tx.parentalConsent.create({
          data: {
            tenantId: user.tenantId,
            studentId: dto.studentId,
            parentUserId: user.sub,
            documentVersion: dto.documentVersion,
            termsAccepted: dto.termsAccepted,
            privacyAccepted: dto.privacyAccepted,
            aiProcessingAccepted: dto.aiProcessingAccepted,
            ipAddress,
            userAgent: userAgent.slice(0, 512),
          },
        }),
      );

      this.log.info(
        {
          tenantId: consent.tenantId,
          studentId: consent.studentId,
          parentUserId: consent.parentUserId,
          documentVersion: consent.documentVersion,
          consentId: consent.id,
        },
        "consent.signed",
      );

      return consent;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.prisma.withUser(user, (tx) =>
          tx.parentalConsent.findFirst({
            where: {
              studentId: dto.studentId,
              parentUserId: user.sub,
              documentVersion: dto.documentVersion,
            },
          }),
        );
        if (existing) {
          this.log.info(
            { consentId: existing.id, studentId: existing.studentId },
            "consent.signed.idempotent",
          );
          return existing;
        }
      }
      throw error;
    }
  }

  async getActiveForStudent(studentId: string, user: AuthenticatedUser) {
    await this.assertStudentInScope(studentId, user);
    return this.prisma.withUser(user, (tx) =>
      tx.parentalConsent.findFirst({
        where: { studentId, revokedAt: null },
        orderBy: { signedAt: "desc" },
      }),
    );
  }

  async listForStudent(studentId: string, user: AuthenticatedUser) {
    await this.assertStudentInScope(studentId, user);
    return this.prisma.withUser(user, (tx) =>
      tx.parentalConsent.findMany({
        where: { studentId },
        orderBy: { signedAt: "desc" },
      }),
    );
  }

  async revoke(input: RevokeConsentInput) {
    const { consentId, reason, user } = input;

    const consent = await this.prisma.withUser(user, (tx) =>
      tx.parentalConsent.findUnique({ where: { id: consentId } }),
    );
    if (!consent) {
      throw new ConsentNotFoundError();
    }
    if (consent.revokedAt) {
      throw new ConsentAlreadyRevokedError();
    }

    await this.assertStudentInScope(consent.studentId, user);

    const updated = await this.prisma.withUser(user, (tx) =>
      tx.parentalConsent.update({
        where: { id: consent.id },
        data: {
          revokedAt: new Date(),
          revokedByUserId: user.sub,
          revocationReason: reason?.slice(0, 512),
        },
      }),
    );

    this.log.warn(
      {
        consentId: updated.id,
        studentId: updated.studentId,
        revokedByUserId: user.sub,
      },
      "consent.revoked",
    );

    return updated;
  }

  /**
   * Permite consultar si un alumno tiene consentimiento activo. Util como
   * gating de servicios sensibles. Usa service_role porque puede ser invocado
   * antes de que el actor tenga claims (ej: WhatsApp agent).
   */
  async hasActiveConsent(studentId: string): Promise<boolean> {
    const result = await this.prisma.withServiceRole((tx) =>
      tx.parentalConsent.count({
        where: { studentId, revokedAt: null },
      }),
    );
    return result > 0;
  }

  private async assertStudentInScope(studentId: string, user: AuthenticatedUser): Promise<void> {
    if (isElevatedRole(user)) {
      return;
    }

    const student = await this.prisma.withUser(user, (tx) =>
      tx.student.findFirst({
        where: { id: studentId },
        select: { id: true, familyId: true },
      }),
    );

    if (!student) {
      throw new ConsentStudentScopeError();
    }

    if (user.role === "PARENT" && user.familyId && student.familyId !== user.familyId) {
      throw new ConsentStudentScopeError();
    }
  }
}
