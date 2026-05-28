import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { WhatsappModule } from "../whatsapp/whatsapp.module.js";
import { ParentReportController } from "./parent-report.controller.js";
import { WeeklyReportService } from "./parent-report.service.js";

@Module({
  imports: [AuthModule, WhatsappModule],
  controllers: [ParentReportController],
  providers: [WeeklyReportService],
  exports: [WeeklyReportService],
})
export class ParentReportModule {}
