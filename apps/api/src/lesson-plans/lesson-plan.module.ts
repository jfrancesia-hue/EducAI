import { Module } from "@nestjs/common";
import { LessonPlanController } from "./lesson-plan.controller.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@Module({
  controllers: [LessonPlanController],
  providers: [LessonPlanService],
})
export class LessonPlanModule {}

