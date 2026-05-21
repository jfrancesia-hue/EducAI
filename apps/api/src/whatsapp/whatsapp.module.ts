import { Module } from "@nestjs/common";
import {
  AnthropicLlmClient,
  AudioService,
  DeterministicLlmClient,
  DiagnosticService,
  type LlmClient,
  OcrService,
} from "@educai/ai";
import { WHATSAPP_AGENT_LLM } from "./agent/agent-llm.token.js";
import { HumanHandoffService } from "./agent/human-handoff.service.js";
import { InstitutionalAgentService } from "./agent/institutional-agent.service.js";
import { InstitutionalAgentAuditService } from "./agent/institutional-agent-audit.service.js";
import { InstitutionalIntentService } from "./agent/institutional-intent.service.js";
import { InstitutionalResponsePolicyService } from "./agent/institutional-response-policy.service.js";
import { InstitutionalToolsService } from "./agent/institutional-tools.service.js";
import { OpenAiLlmClient } from "./agent/providers/openai-llm.client.js";
import { LoggerModule } from "./common/logger/logger.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
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
  imports: [LoggerModule, PrismaModule],
  controllers: [TwilioWebhookController],
  providers: [
    StudentResolverService,
    RateLimiterService,
    CommandHandlerService,
    ConversationStoreService,
    DiagnosticHandlerService,
    TwilioSenderService,
    TwilioSignatureGuard,
    TutorOrchestratorService,
    InstitutionalIntentService,
    InstitutionalToolsService,
    InstitutionalResponsePolicyService,
    InstitutionalAgentService,
    InstitutionalAgentAuditService,
    HumanHandoffService,
    {
      provide: OcrService,
      useFactory: () => new OcrService({ apiKey: process.env.ANTHROPIC_API_KEY }),
    },
    {
      provide: AudioService,
      useFactory: () => new AudioService({ apiKey: process.env.OPENAI_API_KEY }),
    },
    {
      provide: WHATSAPP_AGENT_LLM,
      useFactory: (): LlmClient => {
        const provider = process.env.EDUCAI_AGENT_PROVIDER?.trim().toLowerCase();

        if (provider === "openai") {
          return new OpenAiLlmClient({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.EDUCAI_AGENT_MODEL,
          });
        }

        if (process.env.ANTHROPIC_API_KEY?.trim()) {
          return new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY });
        }

        if (process.env.OPENAI_API_KEY?.trim()) {
          return new OpenAiLlmClient({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.EDUCAI_AGENT_MODEL,
          });
        }

        return new DeterministicLlmClient();
      },
    },
    {
      provide: DiagnosticService,
      useFactory: (llm: LlmClient): DiagnosticService => new DiagnosticService({ llm }),
      inject: [WHATSAPP_AGENT_LLM],
    },
  ],
})
export class WhatsappModule {}
