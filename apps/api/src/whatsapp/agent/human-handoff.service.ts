import { Injectable } from "@nestjs/common";
import { Prisma, type AuditLog } from "@educai/database";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";

export interface HumanHandoffRequest {
  student: ResolvedStudent;
  conversationId: string;
  source: "institutional" | "academic";
  reason: string;
  inboundMessage: string;
  outboundMessage: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class HumanHandoffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async create(request: HumanHandoffRequest): Promise<AuditLog> {
    const metadata: Prisma.InputJsonValue = {
      status: "open",
      source: request.source,
      reason: request.reason,
      studentId: request.student.studentId,
      studentProfileId: request.student.studentProfileId,
      familyId: request.student.familyId,
      whatsappPhone: request.student.whatsappPhone,
      inboundMessage: request.inboundMessage,
      outboundMessage: request.outboundMessage,
      requestedAt: new Date().toISOString(),
      ...(request.metadata ?? {}),
    };

    const auditLog = await this.prisma.auditLog.create({
      data: {
        tenantId: request.student.tenantId,
        action: "human_handoff.requested",
        entity: "conversation",
        entityId: request.conversationId,
        metadata,
      },
    });

    this.logger.warn(
      {
        auditLogId: auditLog.id,
        conversationId: request.conversationId,
        studentId: request.student.studentId,
        source: request.source,
        reason: request.reason,
      },
      "human_handoff.created",
    );

    return auditLog;
  }
}
