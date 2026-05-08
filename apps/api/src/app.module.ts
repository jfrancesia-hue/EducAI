import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AgentModule } from "./agent/agent.module.js";
import { LoggerModule } from "./common/logger/logger.module.js";
import { RateLimitGuard } from "./common/rate-limit/rate-limit.guard.js";
import { CurriculumModule } from "./curriculum/curriculum.module.js";
import { HealthController } from "./health.controller.js";
import { LessonPlanModule } from "./lesson-plans/lesson-plan.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StudentModule } from "./students/student.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    PrismaModule,
    StudentModule,
    CurriculumModule,
    LessonPlanModule,
    AgentModule,
  ],
  controllers: [HealthController],
  providers: [RateLimitGuard],
})
export class AppModule {}
