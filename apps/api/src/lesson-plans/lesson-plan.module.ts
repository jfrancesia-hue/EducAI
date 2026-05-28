import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { LessonPlanController } from "./lesson-plan.controller.js";
import { LessonPlanReaperService } from "./lesson-plan-reaper.service.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@Module({
  imports: [AuthModule],
  controllers: [LessonPlanController],
  providers: [LessonPlanService, LessonPlanReaperService],
})
export class LessonPlanModule {}
