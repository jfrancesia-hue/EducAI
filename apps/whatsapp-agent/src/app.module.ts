import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  AnthropicLlmClient,
  AudioService,
  DeterministicLlmClient,
  DiagnosticService,
  type LlmClient,
  OcrService,
} from "@educai/ai";
import { LoggerModule } from "./common/logger/logger.module.js";
import { HealthController } from "./health.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { CommandHandlerService } from "./tutor/command-handler.service.js";
import { ConversationStoreService } from "./tutor/conversation-store.service.js";
import { DiagnosticHandlerService } from "./tutor/diagnostic-handler.service.js";
import { RateLimiterService } from "./tutor/rate-limiter.service.js";
import { StudentResolverService } from "./tutor/student-resolver.service.js";
import { TutorOrchestratorService } from "./tutor/tutor-orchestrator.service.js";
import { TwilioSenderService } from "./tutor/twilio-sender.service.js";
import { TwilioSignatureGuard } from "./webhooks/twilio-signature.guard.js";
import { TwilioWebhookController } from "./webhooks/twilio-webhook.controller.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule, PrismaModule],
  controllers: [HealthController, TwilioWebhookController],
  providers: [
    StudentResolverService,
    RateLimiterService,
    CommandHandlerService,
    ConversationStoreService,
    DiagnosticHandlerService,
    TwilioSenderService,
    TwilioSignatureGuard,
    TutorOrchestratorService,
    {
      provide: OcrService,
      useFactory: () => new OcrService({ apiKey: process.env.ANTHROPIC_API_KEY }),
    },
    {
      provide: AudioService,
      useFactory: () => new AudioService({ apiKey: process.env.OPENAI_API_KEY }),
    },
    {
      provide: AnthropicLlmClient,
      useFactory: () => new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY }),
    },
    {
      provide: DiagnosticService,
      useFactory: (): DiagnosticService => {
        const llm: LlmClient = process.env.ANTHROPIC_API_KEY
          ? new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY })
          : new DeterministicLlmClient();
        return new DiagnosticService({ llm });
      },
    },
  ],
})
export class AppModule {}
