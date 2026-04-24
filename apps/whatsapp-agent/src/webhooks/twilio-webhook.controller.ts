import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";

import { TutorOrchestratorService } from "../tutor/tutor-orchestrator.service.js";

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
}

/**
 * Webhook de entrada de Twilio WhatsApp.
 * Fase 1 implementara: validacion de firma, rate limiting por plan,
 * orquestacion OCR/Whisper/Tutor, respuesta async via Messages API.
 */
@Controller("webhooks/twilio")
export class TwilioWebhookController {
  constructor(private readonly orchestrator: TutorOrchestratorService) {}

  @Post("whatsapp")
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
