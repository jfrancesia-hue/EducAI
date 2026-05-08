import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AgentModule } from "./agent/agent.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { AuditLogInterceptor } from "./common/audit/audit-log.interceptor.js";
import { AuditLogModule } from "./common/audit/audit-log.module.js";
import { LoggerModule } from "./common/logger/logger.module.js";
import { RateLimitGuard } from "./common/rate-limit/rate-limit.guard.js";
import { ConsentModule } from "./consent/consent.module.js";
import { CurriculumModule } from "./curriculum/curriculum.module.js";
import { HealthModule } from "./health/health.module.js";
import { LessonPlanModule } from "./lesson-plans/lesson-plan.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StudentModule } from "./students/student.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    PrismaModule,
    AuditLogModule,
    HealthModule,
    StudentModule,
    CurriculumModule,
    LessonPlanModule,
    AgentModule,
    ConsentModule,
    BillingModule,
  ],
  providers: [
    RateLimitGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
