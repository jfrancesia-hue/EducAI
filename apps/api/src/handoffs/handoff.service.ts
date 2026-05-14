import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@educai/database";
import { PrismaService } from "../prisma/prisma.service.js";

const HANDOFF_ACTION = "human_handoff.requested";

type HandoffMetadata = {
  status?: string;
  source?: string;
  reason?: string;
  studentId?: string;
  studentProfileId?: string;
  familyId?: string;
  whatsappPhone?: string;
  inboundMessage?: string;
  outboundMessage?: string;
  requestedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  [key: string]: unknown;
};

@Injectable()
export class HandoffService {
  constructor(private readonly prisma: PrismaService) {}

  async listOpen(tenantId: string) {
    const handoffs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: HANDOFF_ACTION,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      data: handoffs
        .map((handoff) => this.toRecord(handoff))
        .filter((handoff) => handoff.status !== "closed"),
    };
  }

  async close(input: {
    tenantId: string;
    handoffId: string;
    resolvedBy: string;
    resolutionNote?: string;
  }) {
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        id: input.handoffId,
        tenantId: input.tenantId,
        action: HANDOFF_ACTION,
      },
    });

    if (!existing) {
      throw new NotFoundException("Handoff no encontrado");
    }

    const metadata = this.toMetadata(existing.metadata);
    const nextMetadata: Prisma.InputJsonValue = {
      ...metadata,
      status: "closed",
      resolvedAt: new Date().toISOString(),
      resolvedBy: input.resolvedBy,
      resolutionNote: input.resolutionNote?.trim() || undefined,
    };

    const updated = await this.prisma.auditLog.update({
      where: { id: existing.id },
      data: { metadata: nextMetadata },
    });

    return { data: this.toRecord(updated) };
  }

  private toRecord(handoff: {
    id: string;
    tenantId: string | null;
    entityId: string | null;
    createdAt: Date;
    metadata: Prisma.JsonValue | null;
  }) {
    const metadata = this.toMetadata(handoff.metadata);

    return {
      id: handoff.id,
      tenantId: handoff.tenantId,
      conversationId: handoff.entityId,
      createdAt: handoff.createdAt,
      status: metadata.status ?? "open",
      source: metadata.source ?? null,
      reason: metadata.reason ?? null,
      studentId: metadata.studentId ?? null,
      studentProfileId: metadata.studentProfileId ?? null,
      familyId: metadata.familyId ?? null,
      whatsappPhone: metadata.whatsappPhone ?? null,
      inboundMessage: metadata.inboundMessage ?? null,
      outboundMessage: metadata.outboundMessage ?? null,
      requestedAt: metadata.requestedAt ?? null,
      resolvedAt: metadata.resolvedAt ?? null,
      resolvedBy: metadata.resolvedBy ?? null,
      resolutionNote: metadata.resolutionNote ?? null,
    };
  }

  private toMetadata(value: Prisma.JsonValue | null): HandoffMetadata {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return { ...value };
  }
}
