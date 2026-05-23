import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { requireUserClaim } from "../auth/require-user-claim.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { GenerateLessonPlanDto } from "./dto/generate-lesson-plan.dto.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@ApiTags("lesson-plans")
@ApiBearerAuth()
@Controller("lesson-plans")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("SCHOOL_ADMIN", "TEACHER")
export class LessonPlanController {
  constructor(private readonly lessonPlans: LessonPlanService) {}

  @Post("generate")
  async generate(@Body() body: GenerateLessonPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonPlans.generate({
      ...body,
      tenantId: requireUserClaim(user, "tenantId"),
      teacherId: await this.lessonPlans.resolveTeacherIdForPlanning(user),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === "SCHOOL_ADMIN") {
      return this.lessonPlans.findOne(id, {
        tenantId: requireUserClaim(user, "tenantId"),
        schoolId: requireUserClaim(user, "schoolId"),
      });
    }

    return this.lessonPlans.findOne(id, {
      tenantId: requireUserClaim(user, "tenantId"),
      teacherId: requireUserClaim(user, "teacherId"),
    });
  }
}
