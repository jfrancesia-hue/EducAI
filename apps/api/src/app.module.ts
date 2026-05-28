import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module.js";
import { LoggerModule } from "./common/logger/logger.module.js";
import { CurriculumModule } from "./curriculum/curriculum.module.js";
import { DashboardModule } from "./dashboard/dashboard.module.js";
import { HandoffModule } from "./handoffs/handoff.module.js";
import { HealthController } from "./health.controller.js";
import { LessonPlanModule } from "./lesson-plans/lesson-plan.module.js";
import { OnboardingModule } from "./onboarding/onboarding.module.js";
import { ParentReportModule } from "./parent-reports/parent-report.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { TenantContextInterceptor } from "./prisma/tenant-context.interceptor.js";
import { PublicIntakeModule } from "./public-intake/public-intake.module.js";
import { StudentModule } from "./students/student.module.js";
import { WhatsappModule } from "./whatsapp/whatsapp.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    LoggerModule,
    PrismaModule,
    DashboardModule,
    StudentModule,
    CurriculumModule,
    LessonPlanModule,
    HandoffModule,
    OnboardingModule,
    ParentReportModule,
    PaymentsModule,
    PublicIntakeModule,
    WhatsappModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {}
