import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { requireHeader } from "../common/http/required-header.js";
import { GenerateLessonPlanDto } from "./dto/generate-lesson-plan.dto.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@ApiTags("lesson-plans")
@ApiHeader({
  name: "x-tenant-id",
  description:
    "Identificador del tenant. Provisorio hasta que el contexto multi-tenant salga del JWT.",
  required: true,
})
@ApiHeader({
  name: "x-teacher-id",
  description:
    "Identificador del docente. Provisorio hasta que el contexto docente salga de la sesion.",
  required: true,
})
@Controller("lesson-plans")
export class LessonPlanController {
  constructor(private readonly lessonPlans: LessonPlanService) {}

  @Post("generate")
  generate(
    @Body() body: GenerateLessonPlanDto,
    @Headers("x-tenant-id") tenantId: string,
    @Headers("x-teacher-id") teacherId: string,
  ) {
    return this.lessonPlans.generate({
      ...body,
      tenantId: requireHeader(tenantId, "x-tenant-id"),
      teacherId: requireHeader(teacherId, "x-teacher-id"),
    });
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
    @Headers("x-tenant-id") tenantId: string,
    @Headers("x-teacher-id") teacherId: string,
  ) {
    return this.lessonPlans.findOne(id, {
      tenantId: requireHeader(tenantId, "x-tenant-id"),
      teacherId: requireHeader(teacherId, "x-teacher-id"),
    });
  }
}
