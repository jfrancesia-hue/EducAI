import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentService } from "./student.service";

@ApiTags("students")
@Controller("students")
export class StudentController {
  constructor(private readonly students: StudentService) {}

  @Post()
  @ApiCreatedResponse({ description: "Perfil de estudiante creado" })
  create(@Body() dto: CreateStudentDto) {
    return this.students.create(dto);
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

