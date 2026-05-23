import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { DiagnosticModule } from "./diagnostic.module.js";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentController } from "./student.controller.js";
import { StudentService } from "./student.service.js";
import { WhatsappModule } from "../whatsapp/whatsapp.module.js";

@Module({
  imports: [AuthModule, DiagnosticModule, WhatsappModule],
  controllers: [StudentController],
  providers: [StudentService, FamilyScopeGuard],
  exports: [StudentService],
})
export class StudentModule {}
