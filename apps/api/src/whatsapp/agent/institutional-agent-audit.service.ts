import { Injectable } from "@nestjs/common";
import { Prisma } from "@educai/database";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";

export interface InstitutionalAgentAuditInput {
  student: ResolvedStudent;
  conversationId: string;
  inboundMessage: string;
  outboundMessage: string;
  modelUsed: string;
  tokensUsed: number;
  shouldEscalate: boolean;
  toolEvents: Array<{ tool: string; ok: boolean; summary: string }>;
}

@Injectable()
export class InstitutionalAgentAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async record(input: InstitutionalAgentAuditInput): Promise<void> {
    const metadata: Prisma.InputJsonValue = {
      channel: "institutional",
      studentId: input.student.studentId,
      studentProfileId: input.student.studentProfileId,
      familyId: input.student.familyId,
      inboundMessage: input.inboundMessage.slice(0, 1000),
      outboundMessage: input.outboundMessage.slice(0, 2000),
      modelUsed: input.modelUsed,
      tokensUsed: input.tokensUsed,
      shouldEscalate: input.shouldEscalate,
      toolEvents: input.toolEvents,
      recordedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        tenantId: input.student.tenantId,
        action: "whatsapp.institutional.response.recorded",
        entity: "conversation",
        entityId: input.conversationId,
        metadata,
      },
    });

    this.logger.info(
      {
        studentId: input.student.studentId,
        conversationId: input.conversationId,
        modelUsed: input.modelUsed,
        shouldEscalate: input.shouldEscalate,
      },
      "institutional_agent.audit_recorded",
    );
  }
}
