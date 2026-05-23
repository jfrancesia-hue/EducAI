import { Injectable } from "@nestjs/common";
import type { Prisma } from "@educai/database";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

const ACTIVE_CONVERSATION_TTL_MS = 60 * 60 * 1000; // 1h sin nuevos mensajes → conversación nueva

export interface InboundMessageRecord {
  conversationId: string;
  messageId: string;
}

export interface InboundMessageInput {
  student: ResolvedStudent;
  subject: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
  twilioMessageSid: string;
  safetyStatus: string;
  channel?: "whatsapp" | "web";
}

export interface OutboundMessageInput {
  conversationId: string;
  tenantId: string;
  body: string;
  modelUsed: string;
  tokensUsed: number;
  safetyStatus: string;
}

@Injectable()
export class ConversationStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async appendInboundMessage(input: InboundMessageInput): Promise<InboundMessageRecord> {
    const conversation = await this.findOrCreateConversation(input.student, input.subject);

    const message = await this.prisma.message.create({
      data: {
        tenantId: input.student.tenantId,
        conversationId: conversation.id,
        role: input.channel === "web" ? "web_student" : "student",
        content: input.body,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        safetyStatus: input.safetyStatus,
      },
    });

    return { conversationId: conversation.id, messageId: message.id };
  }

  async appendOutboundMessage(input: OutboundMessageInput): Promise<string> {
    const message = await this.prisma.message.create({
      data: {
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        role: "tutor",
        content: input.body,
        modelUsed: input.modelUsed,
        tokensUsed: input.tokensUsed,
        safetyStatus: input.safetyStatus,
      },
    });
    return message.id;
  }

  async closeConversation(conversationId: string, summary?: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: "closed",
        endedAt: new Date(),
        summary,
      },
    });
  }

  private async findOrCreateConversation(
    student: ResolvedStudent,
    subject: string,
  ): Promise<{ id: string }> {
    const cutoff = new Date(Date.now() - ACTIVE_CONVERSATION_TTL_MS);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        studentProfileId: student.studentProfileId,
        subject,
        status: "active",
        startedAt: { gte: cutoff },
      },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      return existing;
    }

    const data: Prisma.ConversationUncheckedCreateInput = {
      tenantId: student.tenantId,
      studentProfileId: student.studentProfileId,
      subject,
      status: "active",
    };

    return this.prisma.conversation.create({ data, select: { id: true } });
  }
}
