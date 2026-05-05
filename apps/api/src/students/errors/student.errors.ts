import { ForbiddenException, NotFoundException } from "@nestjs/common";

export class StudentNotFoundError extends NotFoundException {
  constructor(studentId: string) {
    super({
      code: "STUDENT_NOT_FOUND",
      message: `Estudiante ${studentId} no encontrado`,
      studentId,
    });
  }
}

export class StudentProfileNotFoundError extends NotFoundException {
  constructor(studentId: string) {
    super({
      code: "STUDENT_PROFILE_NOT_FOUND",
      message: `Perfil ApoyoAI del estudiante ${studentId} no encontrado`,
      studentId,
    });
  }
}

export class FamilyAccessDeniedError extends ForbiddenException {
  constructor(studentId: string, familyId: string) {
    super({
      code: "FAMILY_ACCESS_DENIED",
      message: `La familia ${familyId} no tiene acceso al estudiante ${studentId}`,
      studentId,
      familyId,
    });
  }
}

export class FamilyContextMissingError extends ForbiddenException {
  constructor() {
    super({
      code: "FAMILY_CONTEXT_MISSING",
      message: "Falta el header x-family-id que identifica a la familia solicitante",
    });
  }
}
