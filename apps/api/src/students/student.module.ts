import { Module } from "@nestjs/common";
import { FamilyScopeGuard } from "./guards/family-scope.guard.js";
import { StudentController } from "./student.controller.js";
import { StudentService } from "./student.service.js";

@Module({
  controllers: [StudentController],
  providers: [StudentService, FamilyScopeGuard],
  exports: [StudentService],
})
export class StudentModule {}
