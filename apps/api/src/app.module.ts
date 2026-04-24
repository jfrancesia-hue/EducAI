import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CurriculumModule } from "./curriculum/curriculum.module";
import { HealthController } from "./health.controller";
import { LessonPlanModule } from "./lesson-plans/lesson-plan.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StudentModule } from "./students/student.module";

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

