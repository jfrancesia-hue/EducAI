import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller.js";
import { WeeklyReportProcessor } from "./queues/weekly-report.processor.js";
import { DiagnosticAnalysisProcessor } from "./queues/diagnostic-analysis.processor.js";

const QUEUE_PREFIX = process.env.BULL_QUEUE_PREFIX ?? "educai";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      prefix: QUEUE_PREFIX,
      connection: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
      },
    }),
    BullModule.registerQueue(
      { name: "weekly-report" },
      { name: "diagnostic-analysis" },
    ),
  ],
  controllers: [HealthController],
  providers: [WeeklyReportProcessor, DiagnosticAnalysisProcessor],
})
export class AppModule {}
