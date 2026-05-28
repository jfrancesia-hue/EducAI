import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { CreateTeacherCourseDto } from "./dto/create-teacher-course.dto.js";
import { UpdateTeacherCourseDto } from "./dto/update-teacher-course.dto.js";
import { TeacherCourseService } from "./teacher-course.service.js";

@ApiTags("teacher-courses")
@ApiBearerAuth()
@Controller("teacher-courses")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("TEACHER", "SCHOOL_ADMIN")
export class TeacherCourseController {
  constructor(private readonly courses: TeacherCourseService) {}

  @Get()
  @ApiOkResponse({ description: "Cursos del docente" })
  async list(@CurrentUser() user: AuthenticatedUser) {
    const ctx = await this.courses.resolveTeacherContext(user);
    return this.courses.list({ tenantId: ctx.tenantId, teacherId: ctx.teacherId });
  }

  @Get(":id")
  @ApiOkResponse({ description: "Detalle de un curso del docente" })
  async findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    const ctx = await this.courses.resolveTeacherContext(user);
    return this.courses.findOne(id, { tenantId: ctx.tenantId, teacherId: ctx.teacherId });
  }

  @Post()
  @ApiCreatedResponse({ description: "Curso creado" })
  async create(@Body() dto: CreateTeacherCourseDto, @CurrentUser() user: AuthenticatedUser) {
    const ctx = await this.courses.resolveTeacherContext(user);
    return this.courses.create(dto, ctx);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Curso actualizado" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTeacherCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const ctx = await this.courses.resolveTeacherContext(user);
    return this.courses.update(id, dto, { tenantId: ctx.tenantId, teacherId: ctx.teacherId });
  }

  @Delete(":id")
  @ApiOkResponse({ description: "Curso archivado (soft delete)" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    const ctx = await this.courses.resolveTeacherContext(user);
    return this.courses.remove(id, { tenantId: ctx.tenantId, teacherId: ctx.teacherId });
  }
}
