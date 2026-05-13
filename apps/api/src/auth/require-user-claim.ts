import { ForbiddenException } from "@nestjs/common";

import type { AuthenticatedUser } from "./authenticated-user.js";

export function requireUserClaim(
  user: AuthenticatedUser,
  key: "tenantId" | "familyId" | "schoolId" | "teacherId",
): string {
  const value = user[key];

  if (!value) {
    throw new ForbiddenException({
      code: `${key.toUpperCase()}_CONTEXT_MISSING`,
      message: `Falta el claim ${key} en la sesion autenticada`,
    });
  }

  return value;
}
