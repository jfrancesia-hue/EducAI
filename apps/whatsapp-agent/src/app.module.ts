import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller.js";
import { TwilioWebhookController } from "./webhooks/twilio-webhook.controller.js";
import { TutorOrchestratorService } from "./tutor/tutor-orchestrator.service.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, TwilioWebhookController],
  providers: [TutorOrchestratorService],
})
export class AppModule {}
