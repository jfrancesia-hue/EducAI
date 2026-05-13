import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { CreateStudentDto } from "./dto/create-student.dto.js";
import { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto.js";
import { UpdateStudentDto } from "./dto/update-student.dto.js";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentService } from "./student.service.js";

@ApiTags("students")
@ApiBearerAuth()
@Controller("students")
@UseGuards(SupabaseAuthGuard, FamilyScopeGuard)
export class StudentController {
  constructor(private readonly students: StudentService) {}

  @Post()
  @ApiCreatedResponse({ description: "Perfil de estudiante creado" })
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.students.create(dto, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Get(":id")
  @ApiOkResponse({ description: "Perfil de estudiante" })
  findOne(@Param("id") id: string) {
    return this.students.findOne(id);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Perfil actualizado" })
  update(@Param("id") id: string, @Body() dto: UpdateStudentDto) {
    return this.students.update(id, dto);
  }

  @Post(":id/diagnostic")
  @ApiCreatedResponse({ description: "Diagnostico iniciado" })
  startDiagnostic(@Param("id") id: string) {
    return this.students.startDiagnostic(id);
  }

  @Post(":id/diagnostic/answer")
  @ApiOkResponse({ description: "Respuesta diagnosticada" })
  answerDiagnostic(@Param("id") id: string, @Body() dto: DiagnosticAnswerDto) {
    return this.students.answerDiagnostic(id, dto);
  }

  @Get(":id/progress")
  @ApiOkResponse({ description: "Progreso agregado" })
  progress(@Param("id") id: string) {
    return this.students.progress(id);
  }
}
