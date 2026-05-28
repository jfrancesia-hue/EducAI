import { ForbiddenException, NotFoundException } from "@nestjs/common";

export class TeacherCourseNotFoundError extends NotFoundException {
  constructor(courseId: string) {
    super({
      code: "TEACHER_COURSE_NOT_FOUND",
      message: `Curso ${courseId} no encontrado`,
      courseId,
    });
  }
}

export class TeacherCourseAccessDeniedError extends ForbiddenException {
  constructor(courseId: string, teacherId: string) {
    super({
      code: "TEACHER_COURSE_ACCESS_DENIED",
      message: `El docente ${teacherId} no tiene acceso al curso ${courseId}`,
      courseId,
      teacherId,
    });
  }
}
