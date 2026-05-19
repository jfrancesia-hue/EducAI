import { Module } from "@nestjs/common";

import { LoggerModule } from "../common/logger/logger.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ContactLeadController } from "./contact-lead.controller.js";
import { ContactLeadService } from "./contact-lead.service.js";
import { PublicThrottleGuard } from "./public-throttle.guard.js";

@Module({
  imports: [LoggerModule, PrismaModule],
  controllers: [ContactLeadController],
  providers: [ContactLeadService, PublicThrottleGuard],
})
export class PublicIntakeModule {}
