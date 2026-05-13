import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import type { AuthenticatedRequest } from "../../auth/authenticated-user.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  FamilyAccessDeniedError,
  FamilyContextMissingError,
  StudentNotFoundError,
  TenantAccessDeniedError,
  TenantContextMissingError,
} from "../errors/student.errors.js";

@Injectable()
export class FamilyScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const familyId = request.user?.familyId;
    const tenantId = request.user?.tenantId;

    if (!familyId) {
      throw new FamilyContextMissingError();
    }
    if (!tenantId) {
      throw new TenantContextMissingError();
    }

    const studentId = request.params?.id;
    if (!studentId) {
      return true;
    }

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, familyId: true, tenantId: true },
    });

    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    if (student.familyId !== familyId) {
      throw new FamilyAccessDeniedError(studentId, familyId);
    }
    if (student.tenantId !== tenantId) {
      throw new TenantAccessDeniedError(studentId, tenantId);
    }

    return true;
  }
}
