import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/authenticated-user.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { PublicThrottleGuard } from "../public-intake/public-throttle.guard.js";
import { EducAiOnboardingService } from "./educai-onboarding.service.js";
import {
  RegisterEducAiTeacherDto,
  RegisterEducAiTeacherWithGoogleDto,
} from "./dto/register-educai-teacher.dto.js";

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

  @Post("teachers/google")
  @UseGuards(SupabaseAuthGuard)
  @ApiCreatedResponse({ description: "Docente EducAI registrado con identidad Google" })
  registerTeacherWithGoogle(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RegisterEducAiTeacherWithGoogleDto,
  ) {
    return this.onboarding.registerTeacherWithGoogle(dto, request.user);
  }
}
