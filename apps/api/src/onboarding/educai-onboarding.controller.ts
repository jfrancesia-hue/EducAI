import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import { EducAiOnboardingService } from "./educai-onboarding.service.js";
import { RegisterEducAiTeacherDto } from "./dto/register-educai-teacher.dto.js";

@ApiTags("onboarding")
@Controller("onboarding/educai")
export class EducAiOnboardingController {
  constructor(private readonly onboarding: EducAiOnboardingService) {}

  @Post("teachers")
  @ApiCreatedResponse({ description: "Docente EducAI registrado con contexto pedagogico" })
  registerTeacher(@Body() dto: RegisterEducAiTeacherDto) {
    return this.onboarding.registerTeacher(dto);
  }
}
