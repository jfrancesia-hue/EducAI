import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CurriculumController } from "./curriculum.controller.js";
import { CurriculumService } from "./curriculum.service.js";

@Module({
  imports: [AuthModule],
  controllers: [CurriculumController],
  providers: [CurriculumService],
})
export class CurriculumModule {}
