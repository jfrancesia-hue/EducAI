import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";

import { TutorOrchestratorService } from "../tutor/tutor-orchestrator.service.js";
import { TwilioIdempotencyService } from "./twilio-idempotency.service.js";
import { TwilioSignatureGuard } from "./twilio-signature.guard.js";

class TwilioInboundDto {
  @IsString()
  MessageSid!: string;

  @IsString()
  From!: string;

  @IsString()
  To!: string;

  @IsOptional()
  @IsString()
  Body?: string;

  @IsOptional()
  @IsString()
  MediaUrl0?: string;

  @IsOptional()
  @IsString()
  MediaContentType0?: string;

  @IsOptional()
  @IsString()
  NumMedia?: string;
}

/**
 * Webhook de entrada de Twilio WhatsApp.
 *
 * Espera body x-www-form-urlencoded — el AppModule configura el bodyParser de
 * Express para que Twilio funcione (también hay JSON parser para tests/health).
 *
 * Twilio reintenta el webhook hasta 3 veces si la respuesta tarda >15s.
 * Por eso se aplica idempotencia por MessageSid antes de cualquier procesamiento
 * que cueste tokens (Claude) o produzca side effects (Twilio outbound).
 */
@Controller("webhooks/twilio")
@UseGuards(TwilioSignatureGuard)
export class TwilioWebhookController {
  constructor(
    private readonly orchestrator: TutorOrchestratorService,
    private readonly idempotency: TwilioIdempotencyService,
  ) {}

  @Post("whatsapp")
  @HttpCode(204)
  async handleInbound(@Body() body: TwilioInboundDto): Promise<void> {
    const claim = await this.idempotency.claim(body.MessageSid);
    if (claim.alreadyProcessed) {
      return;
    }

    let outcome = "error";
    let tenantId: string | undefined;
    let studentId: string | undefined;

    try {
      const result = await this.orchestrator.enqueueInboundMessage({
        messageSid: body.MessageSid,
        fromWhatsappPhone: body.From,
        toWhatsappPhone: body.To,
        body: body.Body ?? "",
        mediaUrl: body.MediaUrl0,
        mediaType: body.MediaContentType0,
      });
      outcome = result.status;
      tenantId = result.tenantId;
      studentId = result.studentId;
    } finally {
      await this.idempotency.markCompleted(body.MessageSid, outcome, {
        tenantId,
        studentId,
      });
    }
  }
}
