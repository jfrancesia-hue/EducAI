import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LessonPlanService } from "./lesson-plan.service";

@ApiTags("lesson-plans")
@Controller("lesson-plans")
export class LessonPlanController {
  constructor(private readonly lessonPlans: LessonPlanService) {}

  @Post("generate")
  generate(
    @Body()
    body: {
      tenantId: string;
      teacherId: string;
      grade: number;
      subject: string;
      topic: string;
      sessionCount: number;
      totalDurationMinutes: number;
    },
  ) {
    return this.lessonPlans.generate(body);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.lessonPlans.findOne(id);
  }
}

