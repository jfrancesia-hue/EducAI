import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/authenticated-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { isElevatedRole, type AuthenticatedUser } from "../auth/types.js";
import { CreateStudentDto } from "./dto/create-student.dto.js";
import { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto.js";
import { UpdateStudentDto } from "./dto/update-student.dto.js";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentService } from "./student.service.js";

@ApiTags("students")
@ApiBearerAuth()
@Controller("students")
@UseGuards(JwtAuthGuard, FamilyScopeGuard)
export class StudentController {
  constructor(private readonly students: StudentService) {}

  @Post()
  @ApiCreatedResponse({ description: "Perfil de estudiante creado" })
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.students.create(
      {
        ...dto,
        tenantId: isElevatedRole(user) ? dto.tenantId : user.tenantId,
        familyId: isElevatedRole(user) ? dto.familyId : user.familyId!,
      },
      user,
    );
  }

  @Get(":id")
  @ApiOkResponse({ description: "Perfil de estudiante" })
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.students.findOne(id, user);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Perfil actualizado" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.students.update(id, dto, user);
  }

  @Post(":id/diagnostic")
  @ApiCreatedResponse({ description: "Diagnostico iniciado" })
  startDiagnostic(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.students.startDiagnostic(id, user);
  }

  @Post(":id/diagnostic/answer")
  @ApiOkResponse({ description: "Respuesta diagnosticada" })
  answerDiagnostic(
    @Param("id") id: string,
    @Body() dto: DiagnosticAnswerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.students.answerDiagnostic(id, dto, user);
  }

  @Get(":id/progress")
  @ApiOkResponse({ description: "Progreso agregado" })
  progress(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.students.progress(id, user);
  }
}
