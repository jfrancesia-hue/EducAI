import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import { ApoyoAiOnboardingService } from "./apoyoai-onboarding.service.js";
import { RegisterApoyoAiFamilyDto } from "./dto/register-apoyoai-family.dto.js";

@ApiTags("onboarding")
@Controller("onboarding/apoyoai")
export class ApoyoAiOnboardingController {
  constructor(private readonly onboarding: ApoyoAiOnboardingService) {}

  @Post("families")
  @ApiCreatedResponse({ description: "Familia ApoyoAI registrada con adulto e hijos" })
  registerFamily(@Body() dto: RegisterApoyoAiFamilyDto) {
    return this.onboarding.registerFamily(dto);
  }
}
