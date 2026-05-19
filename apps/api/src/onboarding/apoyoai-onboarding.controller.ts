import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import { PublicThrottleGuard } from "../public-intake/public-throttle.guard.js";
import { ApoyoAiOnboardingService } from "./apoyoai-onboarding.service.js";
import { RegisterApoyoAiFamilyDto } from "./dto/register-apoyoai-family.dto.js";

@ApiTags("onboarding")
@Controller("onboarding/apoyoai")
export class ApoyoAiOnboardingController {
  constructor(private readonly onboarding: ApoyoAiOnboardingService) {}

  @Post("families")
  @UseGuards(PublicThrottleGuard)
  @ApiCreatedResponse({ description: "Familia ApoyoAI registrada con adulto e hijos" })
  registerFamily(@Body() dto: RegisterApoyoAiFamilyDto) {
    return this.onboarding.registerFamily(dto);
  }
}
