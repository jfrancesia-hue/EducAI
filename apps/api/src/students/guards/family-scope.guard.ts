import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  FamilyAccessDeniedError,
  FamilyContextMissingError,
  StudentNotFoundError,
} from "../errors/student.errors.js";

const FAMILY_HEADER = "x-family-id";

interface ScopedRequest {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
}

/**
 * Hasta que se integre auth real (JWT con payload {familyId}),
 * la familia solicitante se identifica por el header x-family-id.
 * Reemplazar este guard por uno basado en req.user.familyId
 * cuando se introduzca el módulo de auth.
 */
@Injectable()
export class FamilyScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const familyId = this.extractFamilyId(request);

    if (!familyId) {
      throw new FamilyContextMissingError();
    }

    const studentId = request.params?.id;
    if (!studentId) {
      return true;
    }

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, familyId: true },
    });

    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    if (student.familyId !== familyId) {
      throw new FamilyAccessDeniedError(studentId, familyId);
    }

    return true;
  }

  private extractFamilyId(request: ScopedRequest): string | undefined {
    const raw = request.headers[FAMILY_HEADER];
    if (Array.isArray(raw)) {
      return raw[0]?.trim() || undefined;
    }
    return raw?.trim() || undefined;
  }
}
