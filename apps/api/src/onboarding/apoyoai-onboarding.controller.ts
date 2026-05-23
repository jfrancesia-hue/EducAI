import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/authenticated-user.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { PublicThrottleGuard } from "../public-intake/public-throttle.guard.js";
import { ApoyoAiOnboardingService } from "./apoyoai-onboarding.service.js";
import {
  RegisterApoyoAiFamilyDto,
  RegisterApoyoAiFamilyWithGoogleDto,
} from "./dto/register-apoyoai-family.dto.js";

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

  @Post("families/google")
  @UseGuards(SupabaseAuthGuard)
  @ApiCreatedResponse({ description: "Familia ApoyoAI registrada con identidad Google" })
  registerFamilyWithGoogle(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RegisterApoyoAiFamilyWithGoogleDto,
  ) {
    return this.onboarding.registerFamilyWithGoogle(dto, request.user);
  }
}
