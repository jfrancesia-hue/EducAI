import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ApoyoAiOnboardingController } from "./apoyoai-onboarding.controller.js";
import { ApoyoAiOnboardingService } from "./apoyoai-onboarding.service.js";
import { EducAiOnboardingController } from "./educai-onboarding.controller.js";
import { EducAiOnboardingService } from "./educai-onboarding.service.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ApoyoAiOnboardingController, EducAiOnboardingController],
  providers: [ApoyoAiOnboardingService, EducAiOnboardingService],
})
export class OnboardingModule {}
