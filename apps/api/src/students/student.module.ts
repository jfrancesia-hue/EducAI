import { Module } from "@nestjs/common";
import { DiagnosticModule } from "./diagnostic.module.js";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentController } from "./student.controller.js";
import { StudentService } from "./student.service.js";

@Module({
  imports: [DiagnosticModule],
  controllers: [StudentController],
  providers: [StudentService, FamilyScopeGuard],
  exports: [StudentService],
})
export class StudentModule {}
