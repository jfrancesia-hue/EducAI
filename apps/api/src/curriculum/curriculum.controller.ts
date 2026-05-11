import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { requireHeader } from "../common/http/required-header.js";
import { CreateCurriculumDto } from "./dto/create-curriculum.dto.js";
import { CurriculumService } from "./curriculum.service.js";

@ApiTags("curricula")
@ApiHeader({
  name: "x-tenant-id",
  description:
    "Identificador del tenant. Provisorio hasta que el contexto multi-tenant salga del JWT.",
  required: true,
})
@ApiHeader({
  name: "x-school-id",
  description:
    "Identificador de la escuela. Provisorio hasta que el contexto institucional salga del JWT.",
  required: true,
})
@Controller("curricula")
export class CurriculumController {
  constructor(private readonly curricula: CurriculumService) {}

  @Post()
  create(
    @Body() body: CreateCurriculumDto,
    @Headers("x-tenant-id") tenantId: string,
    @Headers("x-school-id") schoolId: string,
  ) {
    return this.curricula.create({
      ...body,
      tenantId: requireHeader(tenantId, "x-tenant-id"),
      schoolId: requireHeader(schoolId, "x-school-id"),
    });
  }

  @Post(":id/analyze")
  analyze(@Param("id") id: string) {
    return this.curricula.analyze(id);
  }

  @Get(":id/gaps")
  gaps(@Param("id") id: string) {
    return this.curricula.gaps(id);
  }
}
