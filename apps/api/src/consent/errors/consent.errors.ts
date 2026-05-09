import { HttpException, HttpStatus } from "@nestjs/common";

export class ConsentTermsRequiredError extends HttpException {
  constructor() {
    super(
      {
        code: "CONSENT_TERMS_REQUIRED",
        message: "Para firmar el consentimiento debes aceptar terminos, privacidad e IA",
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ConsentStudentScopeError extends HttpException {
  constructor() {
    super(
      {
        code: "CONSENT_STUDENT_SCOPE_DENIED",
        message: "No tenes permiso para firmar consentimiento de este alumno",
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ConsentNotFoundError extends HttpException {
  constructor() {
    super(
      { code: "CONSENT_NOT_FOUND", message: "Consentimiento no encontrado" },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ConsentAlreadyRevokedError extends HttpException {
  constructor() {
    super(
      {
        code: "CONSENT_ALREADY_REVOKED",
        message: "El consentimiento ya fue revocado previamente",
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ConsentNetworkMetadataMissingError extends HttpException {
  constructor() {
    super(
      {
        code: "CONSENT_NETWORK_METADATA_MISSING",
        message:
          "No se pudo registrar IP o user-agent del cliente; el consentimiento requiere ambos",
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
