import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";

import { TutorOrchestratorService } from "../tutor/tutor-orchestrator.service.js";
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
 * Twilio espera respuesta < 15s; encolamos asíncrono para no bloquear el TwiML.
 * En MVP procesamos sincrónico pero devolvemos 204 sin contenido (la respuesta
 * al alumno se envía vía Messages API, no como TwiML).
 */
@Controller("webhooks/twilio")
@UseGuards(TwilioSignatureGuard)
export class TwilioWebhookController {
  constructor(private readonly orchestrator: TutorOrchestratorService) {}

  @Post(["", "whatsapp"])
  @HttpCode(204)
  async handleInbound(@Body() body: TwilioInboundDto): Promise<void> {
    await this.orchestrator.enqueueInboundMessage({
      messageSid: body.MessageSid,
      fromWhatsappPhone: body.From,
      toWhatsappPhone: body.To,
      body: body.Body ?? "",
      mediaUrl: body.MediaUrl0,
      mediaType: body.MediaContentType0,
    });
  }
}
