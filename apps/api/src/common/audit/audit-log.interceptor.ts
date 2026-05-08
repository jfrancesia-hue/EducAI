import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import type { AuthenticatedRequest } from "../../auth/types.js";
import { AuditLogService } from "./audit-log.service.js";
import { AUDIT_METADATA_KEY, type AuditMetadata } from "./audited.decorator.js";

interface RequestWithRoute extends AuthenticatedRequest {
  params?: Record<string, string | undefined>;
  method?: string;
  originalUrl?: string;
  url?: string;
}

/**
 * Interceptor que escribe AuditLog cuando el handler tiene @Audited(...).
 *
 * Solo escribe en respuestas exitosas: errores ya van por el logger global.
 * El interceptor falla silencioso si AuditLogService rompe — auditoria no
 * debe romper el flujo de usuario, pero su ausencia se registra en logs.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<AuditMetadata | undefined>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithRoute>();
    const user = request.user;

    return next.handle().pipe(
      tap((response: unknown) => {
        const entityId = this.resolveEntityId(metadata, request, response);
        void this.audit.write({
          tenantId: user?.tenantId,
          actorId: user?.sub,
          action: metadata.action,
          entity: metadata.entity,
          entityId,
          metadata: {
            method: request.method,
            path: request.originalUrl ?? request.url,
            role: user?.role,
          },
        });
      }),
    );
  }

  private resolveEntityId(
    metadata: AuditMetadata,
    request: RequestWithRoute,
    response: unknown,
  ): string | null {
    if (metadata.skipEntityId) {
      return null;
    }
    const paramKey = metadata.paramKey ?? "id";
    const fromParam = request.params?.[paramKey];
    if (fromParam) {
      return fromParam;
    }
    if (response && typeof response === "object" && "id" in response) {
      const value = (response as { id?: unknown }).id;
      if (typeof value === "string") {
        return value;
      }
    }
    return null;
  }
}
