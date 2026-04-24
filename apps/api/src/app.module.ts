import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CurriculumModule } from "./curriculum/curriculum.module.js";
import { HealthController } from "./health.controller.js";
import { LessonPlanModule } from "./lesson-plans/lesson-plan.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StudentModule } from "./students/student.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StudentModule,
    CurriculumModule,
    LessonPlanModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

