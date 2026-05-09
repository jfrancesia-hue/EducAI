import { Injectable } from "@nestjs/common";
import { Prisma } from "@educai/database";
import type { Logger } from "pino";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

export interface ClaimResult {
  alreadyProcessed: boolean;
  previousOutcome?: string;
}

/**
 * Idempotencia para webhooks de Twilio.
 *
 * Twilio reintenta cada webhook hasta 3 veces si la respuesta tarda >15s.
 * Sin idempotencia, esto causaria:
 *   - Doble cobro de tokens al modelo Claude
 *   - Doble respuesta enviada al alumno por WhatsApp
 *   - Mensajes duplicados en Conversation
 *
 * Patron: INSERT-first con manejo de Prisma P2002 (unique constraint).
 * Si el INSERT tuvo exito → procesamos. Si fallo por duplicado → short-circuit.
 * No usamos SELECT-then-INSERT por race conditions entre instancias.
 */
@Injectable()
export class TwilioIdempotencyService {
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "TwilioIdempotency" });
  }

  /**
   * Reclama el messageSid antes de procesar. Si retorna alreadyProcessed=true,
   * el handler debe retornar inmediatamente sin invocar al orchestrator.
   */
  async claim(messageSid: string): Promise<ClaimResult> {
    try {
      await this.prisma.processedTwilioMessage.create({
        data: {
          messageSid,
          outcome: "received",
        },
      });
      return { alreadyProcessed: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.prisma.processedTwilioMessage.findUnique({
          where: { messageSid },
          select: { outcome: true, completedAt: true, receivedAt: true },
        });

        this.log.info(
          {
            messageSid,
            previousOutcome: existing?.outcome,
            previousReceivedAt: existing?.receivedAt?.toISOString(),
            previousCompletedAt: existing?.completedAt?.toISOString(),
          },
          "twilio.idempotency.duplicate_detected",
        );

        return {
          alreadyProcessed: true,
          previousOutcome: existing?.outcome,
        };
      }
      throw error;
    }
  }

  /**
   * Marca el resultado final del procesamiento. No falla si la fila no existe
   * (por ejemplo si claim() lanzo error antes del INSERT) — en ese caso solo
   * loguea warning.
   */
  async markCompleted(
    messageSid: string,
    outcome: string,
    metadata?: { tenantId?: string | null; studentId?: string | null },
  ): Promise<void> {
    try {
      await this.prisma.processedTwilioMessage.update({
        where: { messageSid },
        data: {
          outcome,
          completedAt: new Date(),
          tenantId: metadata?.tenantId ?? undefined,
          studentId: metadata?.studentId ?? undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        this.log.warn({ messageSid, outcome }, "twilio.idempotency.completion_record_missing");
        return;
      }
      throw error;
    }
  }
}
