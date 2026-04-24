import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurriculumService } from "./curriculum.service.js";

@ApiTags("curricula")
@Controller("curricula")
export class CurriculumController {
  constructor(private readonly curricula: CurriculumService) {}

  @Post()
  create(@Body() body: { tenantId: string; schoolId: string; name: string; grade: number; subject: string; content: unknown }) {
    return this.curricula.create(body);
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

