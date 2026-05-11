import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CreateStudentDto } from "./dto/create-student.dto.js";
import { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto.js";
import { UpdateStudentDto } from "./dto/update-student.dto.js";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentService } from "./student.service.js";

@ApiTags("students")
@ApiHeader({
  name: "x-family-id",
  description:
    "Identificador de la familia solicitante. Provisorio hasta que el módulo de auth lo provea por JWT.",
  required: true,
})
@Controller("students")
@UseGuards(FamilyScopeGuard)
export class StudentController {
  constructor(private readonly students: StudentService) {}

  @Post()
  @ApiCreatedResponse({ description: "Perfil de estudiante creado" })
  create(@Body() dto: CreateStudentDto, @Headers("x-family-id") familyId: string) {
    return this.students.create(dto, familyId);
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
