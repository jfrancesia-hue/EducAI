import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import twilio, { Twilio } from "twilio";
import { AppLogger } from "../common/logger/app-logger.service.js";

export interface SendOutboundInput {
  toWhatsappPhone: string;
  fromWhatsappPhone?: string;
  body: string;
  /**
   * SID de plantilla de WhatsApp aprobada (Content API de Twilio, formato HX...).
   * Si está presente se envía como template — necesario para mensajes iniciados por
   * el negocio fuera de la ventana de 24 hs. `body` queda como fallback (dry-run o
   * dentro de la ventana).
   */
  contentSid?: string;
  /** Variables de la plantilla, indexadas por número: { "1": ..., "2": ... }. */
  contentVariables?: Record<string, string>;
}

export interface SendOutboundResult {
  messageSid: string;
  status: string;
}

/**
 * Wrapper sobre Twilio Messages API para enviar respuestas del tutor por WhatsApp.
 *
 * Twilio espera el formato "whatsapp:+5493815550202" tanto en `From` como `To`.
 * Si TWILIO_DRY_RUN=true (tests, dev local) el envío se loggea sin llamar al API.
 */
@Injectable()
export class TwilioSenderService {
  private readonly client: Twilio | null;
  private readonly defaultFrom: string;
  private readonly dryRun: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.dryRun = this.config.get<string>("TWILIO_DRY_RUN") === "true";
    this.defaultFrom = this.formatWhatsappAddress(
      this.config.get<string>("TWILIO_WHATSAPP_FROM") ?? "",
    );

    const accountSid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    const apiKeySid = this.config.get<string>("TWILIO_API_KEY_SID");
    const apiKeySecret = this.config.get<string>("TWILIO_API_KEY_SECRET");

    this.client = this.buildClient({ accountSid, authToken, apiKeySid, apiKeySecret });
  }

  async send(input: SendOutboundInput): Promise<SendOutboundResult> {
    const to = this.formatWhatsappAddress(input.toWhatsappPhone);
    const from = input.fromWhatsappPhone
      ? this.formatWhatsappAddress(input.fromWhatsappPhone)
      : this.defaultFrom;

    if (!from) {
      throw new Error(
        "TWILIO_WHATSAPP_FROM no está configurado y no se pasó fromWhatsappPhone en el input",
      );
    }

    if (this.dryRun || !this.client) {
      this.logger.info(
        { mode: "dry-run", chars: input.body.length, template: input.contentSid ?? null },
        "twilio.outbound.dry_run",
      );
      return { messageSid: `DR-${Date.now()}`, status: "queued" };
    }

    // Plantilla aprobada: lo usamos para mensajes iniciados por el negocio (ej. alerta
    // de crisis) que pueden caer fuera de la ventana de 24 hs, donde el texto libre no
    // se entrega.
    if (input.contentSid) {
      const message = await this.client.messages.create({
        to,
        from,
        contentSid: input.contentSid,
        ...(input.contentVariables
          ? { contentVariables: JSON.stringify(input.contentVariables) }
          : {}),
      });
      return { messageSid: message.sid, status: message.status };
    }

    const message = await this.client.messages.create({ to, from, body: input.body });

    return { messageSid: message.sid, status: message.status };
  }

  private formatWhatsappAddress(value: string): string {
    if (!value) {
      return value;
    }
    const trimmed = value.trim();
    if (trimmed.toLowerCase().startsWith("whatsapp:")) {
      return trimmed;
    }
    return `whatsapp:${trimmed}`;
  }

  private buildClient(input: {
    accountSid?: string;
    authToken?: string;
    apiKeySid?: string;
    apiKeySecret?: string;
  }): Twilio | null {
    if (this.dryRun) {
      return null;
    }

    if (input.accountSid && input.apiKeySid && input.apiKeySecret) {
      return twilio(input.apiKeySid, input.apiKeySecret, { accountSid: input.accountSid });
    }

    if (input.accountSid && input.authToken) {
      return twilio(input.accountSid, input.authToken);
    }

    return null;
  }
}
