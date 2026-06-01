import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { UserRateLimitGuard } from "../common/guards/user-rate-limit.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { CreateStudentDto } from "./dto/create-student.dto.js";
import { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto.js";
import { UpdateStudentDto } from "./dto/update-student.dto.js";
import { WebTutorMessageDto } from "./dto/web-tutor-message.dto.js";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentService } from "./student.service.js";
import { WebTutorService } from "../whatsapp/tutor/web-tutor.service.js";

@ApiTags("students")
@ApiBearerAuth()
@Controller("students")
@UseGuards(SupabaseAuthGuard, RolesGuard, FamilyScopeGuard)
@Roles("PARENT", "SUPER_ADMIN")
export class StudentController {
  constructor(
    private readonly students: StudentService,
    private readonly webTutor: WebTutorService,
  ) {}

  @Post()
  @ApiCreatedResponse({ description: "Perfil de estudiante creado" })
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.students.create(dto, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Get()
  @ApiOkResponse({ description: "Perfiles de estudiantes de la familia" })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.students.findByFamily({
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Get(":id")
  @ApiOkResponse({ description: "Perfil de estudiante" })
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.students.findOne(id, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Perfil actualizado" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.students.update(id, dto, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Post(":id/diagnostic")
  @ApiCreatedResponse({ description: "Diagnostico iniciado" })
  startDiagnostic(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.students.startDiagnostic(id, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Post(":id/diagnostic/answer")
  @ApiOkResponse({ description: "Respuesta diagnosticada" })
  answerDiagnostic(
    @Param("id") id: string,
    @Body() dto: DiagnosticAnswerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.students.answerDiagnostic(id, dto, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Get(":id/progress")
  @ApiOkResponse({ description: "Progreso agregado" })
  progress(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.students.progress(id, {
      familyId: user.familyId!,
      tenantId: user.tenantId!,
    });
  }

  @Post(":id/tutor")
  @UseGuards(
    new UserRateLimitGuard({
      name: "web-tutor",
      windowMs: 60_000,
      max: Number(process.env.WEB_TUTOR_RATE_LIMIT_PER_MIN ?? 20),
    }),
  )
  @ApiCreatedResponse({ description: "Respuesta del tutor ApoyoAI por web" })
  askTutor(
    @Param("id") id: string,
    @Body() dto: WebTutorMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.webTutor.ask({
      studentId: id,
      familyId: user.familyId!,
      tenantId: user.tenantId!,
      message: dto.message,
      subject: dto.subject,
    });
  }
}
