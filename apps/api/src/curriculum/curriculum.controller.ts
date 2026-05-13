import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { requireUserClaim } from "../auth/require-user-claim.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { CreateCurriculumDto } from "./dto/create-curriculum.dto.js";
import { CurriculumService } from "./curriculum.service.js";

@ApiTags("curricula")
@ApiBearerAuth()
@Controller("curricula")
@UseGuards(SupabaseAuthGuard)
export class CurriculumController {
  constructor(private readonly curricula: CurriculumService) {}

  @Post()
  create(@Body() body: CreateCurriculumDto, @CurrentUser() user: AuthenticatedUser) {
    return this.curricula.create({
      ...body,
      tenantId: requireUserClaim(user, "tenantId"),
      schoolId: requireUserClaim(user, "schoolId"),
    });
  }

  @Post(":id/analyze")
  analyze(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.curricula.analyze(id, {
      tenantId: requireUserClaim(user, "tenantId"),
      schoolId: requireUserClaim(user, "schoolId"),
    });
  }

  @Get(":id/gaps")
  gaps(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.curricula.gaps(id, {
      tenantId: requireUserClaim(user, "tenantId"),
      schoolId: requireUserClaim(user, "schoolId"),
    });
  }
}
