import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/authenticated-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { CreateCurriculumDto } from "./dto/create-curriculum.dto.js";
import { CurriculumService } from "./curriculum.service.js";

@ApiTags("curricula")
@ApiBearerAuth()
@Controller("curricula")
@UseGuards(JwtAuthGuard)
export class CurriculumController {
  constructor(private readonly curricula: CurriculumService) {}

  @Post()
  create(@Body() body: CreateCurriculumDto, @CurrentUser() user: AuthenticatedUser) {
    return this.curricula.create({ ...body, tenantId: user.tenantId }, user);
  }

  @Post(":id/analyze")
  analyze(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.curricula.analyze(id, user);
  }

  @Get(":id/gaps")
  gaps(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.curricula.gaps(id, user);
  }
}
