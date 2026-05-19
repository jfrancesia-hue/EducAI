import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import { PublicThrottleGuard } from "../public-intake/public-throttle.guard.js";
import { EducAiOnboardingService } from "./educai-onboarding.service.js";
import { RegisterEducAiTeacherDto } from "./dto/register-educai-teacher.dto.js";

@ApiTags("onboarding")
@Controller("onboarding/educai")
export class EducAiOnboardingController {
  constructor(private readonly onboarding: EducAiOnboardingService) {}

  @Post("teachers")
  @UseGuards(PublicThrottleGuard)
  @ApiCreatedResponse({ description: "Docente EducAI registrado con contexto pedagogico" })
  registerTeacher(@Body() dto: RegisterEducAiTeacherDto) {
    return this.onboarding.registerTeacher(dto);
  }
}
