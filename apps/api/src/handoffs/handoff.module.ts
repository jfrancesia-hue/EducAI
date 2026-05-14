import { Module } from "@nestjs/common";
import { HandoffController } from "./handoff.controller.js";
import { HandoffService } from "./handoff.service.js";

@Module({
  controllers: [HandoffController],
  providers: [HandoffService],
})
export class HandoffModule {}
