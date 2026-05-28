import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TeacherCourseController } from "./teacher-course.controller.js";
import { TeacherCourseService } from "./teacher-course.service.js";

@Module({
  imports: [AuthModule],
  controllers: [TeacherCourseController],
  providers: [TeacherCourseService],
  exports: [TeacherCourseService],
})
export class TeacherCourseModule {}
