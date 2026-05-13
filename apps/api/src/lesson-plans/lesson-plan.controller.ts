import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { requireUserClaim } from "../auth/require-user-claim.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { GenerateLessonPlanDto } from "./dto/generate-lesson-plan.dto.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@ApiTags("lesson-plans")
@ApiBearerAuth()
@Controller("lesson-plans")
@UseGuards(SupabaseAuthGuard)
export class LessonPlanController {
  constructor(private readonly lessonPlans: LessonPlanService) {}

  @Post("generate")
  generate(@Body() body: GenerateLessonPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonPlans.generate({
      ...body,
      tenantId: requireUserClaim(user, "tenantId"),
      teacherId: requireUserClaim(user, "teacherId"),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonPlans.findOne(id, {
      tenantId: requireUserClaim(user, "tenantId"),
      teacherId: requireUserClaim(user, "teacherId"),
    });
  }
}
