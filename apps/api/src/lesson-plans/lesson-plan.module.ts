import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { LessonPlanController } from "./lesson-plan.controller.js";
import { LessonPlanService } from "./lesson-plan.service.js";

@Module({
  imports: [AuthModule],
  controllers: [LessonPlanController],
  providers: [LessonPlanService],
})
export class LessonPlanModule {}
