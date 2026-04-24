import { Injectable, Logger } from "@nestjs/common";

export interface InboundMessage {
  messageSid: string;
  fromWhatsappPhone: string;
  toWhatsappPhone: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
}

/**
 * Stub del orquestador del tutor. Fase 1 conectara:
 *  - identificacion de alumno por whatsappPhone
 *  - validacion de suscripcion activa + rate limit por plan
 *  - OCR de imagen (Claude Vision) / Whisper de audio
 *  - TutorAgent socratico (packages/ai)
 *  - persistencia Conversation + Message en DB
 *  - respuesta via Twilio Messages API
 */
@Injectable()
export class TutorOrchestratorService {
  private readonly logger = new Logger(TutorOrchestratorService.name);

  async enqueueInboundMessage(message: InboundMessage): Promise<void> {
    this.logger.log(
      `inbound whatsapp ${message.messageSid} from ${message.fromWhatsappPhone}`,
    );
    // Implementacion completa en Fase 1.
  }
}
