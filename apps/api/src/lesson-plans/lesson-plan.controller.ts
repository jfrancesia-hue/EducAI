import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/authenticated-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { GenerateLessonPlanDto } from "./dto/generate-lesson-plan.dto.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@ApiTags("lesson-plans")
@ApiBearerAuth()
@Controller("lesson-plans")
@UseGuards(JwtAuthGuard)
export class LessonPlanController {
  constructor(private readonly lessonPlans: LessonPlanService) {}

  @Post("generate")
  generate(@Body() body: GenerateLessonPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonPlans.generate({ ...body, tenantId: user.tenantId }, user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonPlans.findOne(id, user);
  }
}
