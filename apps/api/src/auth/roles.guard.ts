import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedRequest, EducAiRole } from "./authenticated-user.js";
import { ROLES_KEY } from "./roles.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<EducAiRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenException({
        code: "ROLE_CONTEXT_MISSING",
        message: "Falta el claim role en la sesion autenticada",
      });
    }

    if (!roles.includes(userRole)) {
      throw new ForbiddenException({
        code: "ROLE_ACCESS_DENIED",
        message: `El rol ${userRole} no tiene permiso para este recurso`,
        role: userRole,
        allowedRoles: roles,
      });
    }

    return true;
  }
}
