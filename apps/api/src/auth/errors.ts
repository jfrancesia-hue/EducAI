import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

export class AuthTokenMissingError extends UnauthorizedException {
  constructor() {
    super({
      code: "AUTH_TOKEN_MISSING",
      message: "Falta el token Bearer de autenticacion",
    });
  }
}

export class AuthTokenInvalidError extends UnauthorizedException {
  constructor() {
    super({
      code: "AUTH_TOKEN_INVALID",
      message: "El token de autenticacion es invalido o expiro",
    });
  }
}

export class TenantAccessDeniedError extends ForbiddenException {
  constructor(tenantId: string) {
    super({
      code: "TENANT_ACCESS_DENIED",
      message: `El usuario autenticado no tiene acceso al tenant ${tenantId}`,
      tenantId,
    });
  }
}
