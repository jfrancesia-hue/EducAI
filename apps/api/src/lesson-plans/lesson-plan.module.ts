import { Module } from "@nestjs/common";
import { LessonPlanController } from "./lesson-plan.controller";
import { LessonPlanService } from "./lesson-plan.service";

@Module({
  controllers: [LessonPlanController],
  providers: [LessonPlanService],
})
export class LessonPlanModule {}

