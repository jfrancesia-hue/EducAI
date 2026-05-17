import { ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";

export class TwilioMissingSignatureError extends UnauthorizedException {
  constructor() {
    super({
      code: "TWILIO_SIGNATURE_MISSING",
      message: "Falta el header X-Twilio-Signature en el request",
    });
  }
}

export class TwilioSignatureMismatchError extends ForbiddenException {
  constructor() {
    super({
      code: "TWILIO_SIGNATURE_MISMATCH",
      message: "La firma X-Twilio-Signature no coincide con el body recibido",
    });
  }
}

export class StudentNotEnrolledError extends NotFoundException {
  readonly whatsappPhone: string;

  constructor(whatsappPhone: string) {
    super({
      code: "STUDENT_NOT_ENROLLED",
      message: `No hay un alumno registrado con el telefono ${whatsappPhone}`,
      whatsappPhone,
    });
    this.whatsappPhone = whatsappPhone;
  }
}

export class StudentSelectionRequiredError extends ForbiddenException {
  readonly whatsappPhone: string;
  readonly studentNames: string[];

  constructor(whatsappPhone: string, studentNames: string[]) {
    super({
      code: "STUDENT_SELECTION_REQUIRED",
      message: `El telefono ${whatsappPhone} esta asociado a mas de un alumno`,
      whatsappPhone,
      studentNames,
    });
    this.whatsappPhone = whatsappPhone;
    this.studentNames = studentNames;
  }
}

export class SubscriptionInactiveError extends ForbiddenException {
  constructor(familyId: string, status: string) {
    super({
      code: "SUBSCRIPTION_INACTIVE",
      message: `La familia ${familyId} no tiene suscripcion activa (status=${status})`,
      familyId,
      status,
    });
  }
}

export class RateLimitExceededError extends ForbiddenException {
  constructor(plan: string, limit: number) {
    super({
      code: "RATE_LIMIT_EXCEEDED",
      message: `Limite del plan ${plan} alcanzado (${limit} mensajes por dia)`,
      plan,
      limit,
    });
  }
}
