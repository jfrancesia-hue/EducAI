import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { TwilioSenderService } from "../tutor/twilio-sender.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";

export interface CrisisAlertInput {
  student: ResolvedStudent;
  conversationId: string;
  severity: "high" | "critical";
  signals: string[];
  inboundMessage: string;
  helplines?: string[];
}

export interface CrisisAlertResult {
  /** true si el envío del WhatsApp de alerta salió OK. */
  delivered: boolean;
  /** true si había un destinatario configurado (env o override de tenant). */
  recipientConfigured: boolean;
  /** Destinatario enmascarado, para auditar sin exponer el número completo. */
  recipientMasked?: string;
  messageSid?: string;
  reason?: string;
}

const SNIPPET_MAX = 240;

/**
 * Alerta de crisis en tiempo real para el equipo humano.
 *
 * Cuando el tutor detecta una señal de crisis (autolesión, suicidio, abuso,
 * violencia) hay que avisar YA a un adulto entrenado. Este servicio manda un
 * WhatsApp al destinatario de crisis configurado.
 *
 * Seguridad: el destino es el equipo/guardia de crisis, NUNCA la familia de forma
 * automática — en señales de abuso intrafamiliar el padre puede estar implicado.
 *
 * Es best-effort: si falla el envío NO rompe el flujo del alumno (que ya recibió
 * su mensaje con líneas de ayuda). La falla se loggea con nivel error y se reporta
 * en el resultado para quedar registrada en el handoff.
 */
@Injectable()
export class CrisisAlertService {
  constructor(
    private readonly config: ConfigService,
    private readonly sender: TwilioSenderService,
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async notifyCrisis(input: CrisisAlertInput): Promise<CrisisAlertResult> {
    const recipient = await this.resolveRecipient(input.student.tenantId);

    if (!recipient) {
      // Sin destinatario no hay a quién alertar: lo gritamos en logs (nivel error)
      // para que monitoreo lo levante. En producción require-production-env exige
      // CRISIS_ALERT_WHATSAPP_TO, así que esto no debería pasar en prod.
      this.logger.error(
        {
          event: "crisis_alert.no_recipient",
          tenantId: input.student.tenantId,
          studentId: input.student.studentId,
          severity: input.severity,
          signals: input.signals,
          conversationId: input.conversationId,
        },
        "crisis_alert.no_recipient",
      );
      return { delivered: false, recipientConfigured: false, reason: "no_recipient_configured" };
    }

    const body = this.buildMessage(input);
    const template = this.buildTemplate(input);

    try {
      const send = await this.sender.send({
        toWhatsappPhone: recipient,
        body,
        ...(template ?? {}),
      });
      this.logger.warn(
        {
          event: "crisis_alert.sent",
          tenantId: input.student.tenantId,
          studentId: input.student.studentId,
          severity: input.severity,
          recipient: this.mask(recipient),
          messageSid: send.messageSid,
        },
        "crisis_alert.sent",
      );
      return {
        delivered: true,
        recipientConfigured: true,
        recipientMasked: this.mask(recipient),
        messageSid: send.messageSid,
      };
    } catch (error) {
      this.logger.error(
        {
          event: "crisis_alert.send_failed",
          tenantId: input.student.tenantId,
          studentId: input.student.studentId,
          severity: input.severity,
          recipient: this.mask(recipient),
          err: error instanceof Error ? error.message : String(error),
        },
        "crisis_alert.send_failed",
      );
      return {
        delivered: false,
        recipientConfigured: true,
        recipientMasked: this.mask(recipient),
        reason: "send_failed",
      };
    }
  }

  /** Destinatario: override por tenant (tenant.metadata.crisisAlertWhatsappTo) o env global. */
  private async resolveRecipient(tenantId: string): Promise<string | null> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { metadata: true },
      });
      const override = this.asRecord(tenant?.metadata)?.crisisAlertWhatsappTo;
      if (typeof override === "string" && override.trim()) {
        return override.trim();
      }
    } catch (error) {
      this.logger.warn(
        {
          event: "crisis_alert.tenant_lookup_failed",
          tenantId,
          err: error instanceof Error ? error.message : String(error),
        },
        "crisis_alert.tenant_lookup_failed",
      );
    }

    const global = this.config.get<string>("CRISIS_ALERT_WHATSAPP_TO")?.trim();
    return global || null;
  }

  /**
   * Plantilla de WhatsApp aprobada (Content API) para la alerta. Es lo que permite que
   * el aviso salga aunque la ventana de 24 hs esté cerrada (mensaje iniciado por el
   * negocio). Si no hay `CRISIS_ALERT_TEMPLATE_SID`, se cae al texto libre — que solo
   * se entrega dentro de la ventana; por eso, en producción, avisamos por log.
   *
   * Variables: {{1}} alumno, {{2}} severidad, {{3}} link al panel.
   */
  private buildTemplate(input: CrisisAlertInput): {
    contentSid: string;
    contentVariables: Record<string, string>;
  } | null {
    const contentSid = this.config.get<string>("CRISIS_ALERT_TEMPLATE_SID")?.trim();
    if (!contentSid) {
      if (this.config.get<string>("NODE_ENV") === "production") {
        this.logger.warn(
          {
            event: "crisis_alert.no_template",
            tenantId: input.student.tenantId,
            severity: input.severity,
          },
          "crisis_alert.no_template",
        );
      }
      return null;
    }

    const sev = input.severity === "critical" ? "CRÍTICA" : "ALTA";
    return {
      contentSid,
      contentVariables: {
        "1": `${input.student.studentName} (${input.student.grade}° grado)`,
        "2": sev,
        "3": this.panelLink(),
      },
    };
  }

  /** Link al panel de EducAI para que el equipo entre y actúe. */
  private panelLink(): string {
    const base = this.config.get<string>("PUBLIC_APP_URL")?.trim();
    if (!base) {
      return "el panel de EducAI";
    }
    return `${base.replace(/\/+$/u, "")}/app`;
  }

  private buildMessage(input: CrisisAlertInput): string {
    const sev = input.severity === "critical" ? "CRÍTICA" : "ALTA";
    const snippet = input.inboundMessage.trim().slice(0, SNIPPET_MAX);
    const lines = [
      `🚨 ALERTA DE CRISIS (${sev})`,
      `Alumno: ${input.student.studentName} (${input.student.grade}° grado)`,
      `Tenant: ${input.student.tenantId}`,
      `Señales: ${input.signals.join(", ") || "n/d"}`,
      `Conversación: ${input.conversationId}`,
      `Mensaje del alumno: "${snippet}"`,
      "",
      "Activá el protocolo de crisis y derivá a un adulto/profesional AHORA.",
    ];
    if (input.helplines?.length) {
      lines.push("", "Líneas de ayuda:", ...input.helplines.map((h) => `• ${h}`));
    }
    return lines.join("\n");
  }

  private mask(value: string): string {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length <= 4) {
      return "***";
    }
    return `***${digits.slice(-4)}`;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }
}
