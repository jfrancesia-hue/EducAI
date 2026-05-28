import { Injectable } from "@nestjs/common";
import { Prisma } from "@educai/database";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type IdempotencyOutcome =
  | { kind: "first_time" }
  | { kind: "duplicate"; previousReceivedAt: Date };

/**
 * Idempotencia de webhooks Twilio.
 *
 * Twilio reintenta automáticamente cualquier webhook que no responda con 2xx
 * en menos de 15s. Sin esta guard, un MessageSid repetido se procesa varias
 * veces: doble llamada al LLM (costo), doble persistencia (Conversation +
 * Message duplicados) y doble envío del mensaje al alumno por WhatsApp.
 *
 * Usa la tabla `ProcessedTwilioMessage` (PK = messageSid) para reservar
 * el SID de forma atómica. Si ya existía, devolvemos `duplicate` y el
 * orquestador corta antes de hacer cualquier side effect.
 *
 * Nota: la inserción ocurre ANTES de procesar — si el procesamiento crashea,
 * el SID queda registrado y Twilio no podrá reintentar. Es el trade-off
 * estándar para "at-most-once": preferimos perder un mensaje (el alumno
 * puede reenviar) antes que cobrar/responder dos veces.
 */
@Injectable()
export class InboundIdempotencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async reserve(messageSid: string): Promise<IdempotencyOutcome> {
    if (!messageSid?.trim()) {
      // Si Twilio no mandó SID, no podemos garantizar idempotencia.
      // Lo dejamos pasar y loggeamos; class-validator del DTO debería
      // haberlo rechazado antes.
      this.logger.warn({ messageSid }, "twilio.idempotency.missing_sid");
      return { kind: "first_time" };
    }

    try {
      await this.prisma.processedTwilioMessage.create({
        data: {
          messageSid,
          outcome: "received",
        },
      });
      return { kind: "first_time" };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existing = await this.prisma.processedTwilioMessage.findUnique({
          where: { messageSid },
          select: { receivedAt: true },
        });
        this.logger.warn(
          { messageSid, previousReceivedAt: existing?.receivedAt },
          "twilio.idempotency.duplicate",
        );
        return {
          kind: "duplicate",
          previousReceivedAt: existing?.receivedAt ?? new Date(),
        };
      }
      // No es duplicate-key — propagar para que el orquestador maneje el error.
      throw error;
    }
  }

  async markCompleted(
    messageSid: string,
    outcome: string,
    metadata?: { tenantId?: string; studentId?: string },
  ): Promise<void> {
    if (!messageSid?.trim()) {
      return;
    }
    try {
      await this.prisma.processedTwilioMessage.update({
        where: { messageSid },
        data: {
          completedAt: new Date(),
          outcome,
          tenantId: metadata?.tenantId,
          studentId: metadata?.studentId,
        },
      });
    } catch (error) {
      // Best-effort: si la actualización falla, no afecta el flujo del alumno.
      this.logger.warn(
        {
          messageSid,
          err: error instanceof Error ? error.message : String(error),
        },
        "twilio.idempotency.mark_completed_failed",
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
