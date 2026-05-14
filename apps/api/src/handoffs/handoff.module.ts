import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { HandoffController } from "./handoff.controller.js";
import { HandoffService } from "./handoff.service.js";

@Module({
  imports: [AuthModule],
  controllers: [HandoffController],
  providers: [HandoffService],
})
export class HandoffModule {}
