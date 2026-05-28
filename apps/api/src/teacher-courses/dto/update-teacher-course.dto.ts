import { PartialType } from "@nestjs/swagger";
import { CreateTeacherCourseDto } from "./create-teacher-course.dto.js";

export class UpdateTeacherCourseDto extends PartialType(CreateTeacherCourseDto) {}
