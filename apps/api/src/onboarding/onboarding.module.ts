import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { ApoyoAiOnboardingController } from "./apoyoai-onboarding.controller.js";
import { ApoyoAiOnboardingService } from "./apoyoai-onboarding.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [ApoyoAiOnboardingController],
  providers: [ApoyoAiOnboardingService],
})
export class OnboardingModule {}
