import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TenantAccessDeniedError } from "../../auth/errors.js";
import { isElevatedRole, type AuthenticatedRequest } from "../../auth/types.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  FamilyAccessDeniedError,
  FamilyContextMissingError,
  StudentNotFoundError,
} from "../errors/student.errors.js";

interface ScopedRequest extends AuthenticatedRequest {
  params?: Record<string, string | undefined>;
  body?: {
    tenantId?: string;
    familyId?: string;
  };
}

@Injectable()
export class FamilyScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;

    if (
      request.body?.tenantId &&
      user.role !== "SUPER_ADMIN" &&
      request.body.tenantId !== user.tenantId
    ) {
      throw new TenantAccessDeniedError(request.body.tenantId);
    }

    if (isElevatedRole(user)) {
      return true;
    }

    const familyId = user.familyId;
    if (!familyId) {
      throw new FamilyContextMissingError();
    }

    const studentId = request.params?.id;
    if (!studentId) {
      if (request.body?.familyId && request.body.familyId !== familyId) {
        throw new FamilyAccessDeniedError("new", familyId);
      }
      return true;
    }

    const student = await this.prisma.withUser(user, (db) =>
      db.student.findFirst({
        where: { id: studentId, deletedAt: null },
        select: { id: true, tenantId: true, familyId: true },
      }),
    );

    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    if (student.tenantId !== user.tenantId) {
      throw new TenantAccessDeniedError(student.tenantId);
    }

    if (student.familyId !== familyId) {
      throw new FamilyAccessDeniedError(studentId, familyId);
    }

    return true;
  }
}
