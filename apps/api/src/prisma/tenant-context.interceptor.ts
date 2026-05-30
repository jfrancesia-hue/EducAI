import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { defer, type Observable } from "rxjs";

import type { AuthenticatedRequest } from "../auth/authenticated-user.js";
import { TenantContextService } from "./tenant-context.service.js";

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const tenantId = user?.tenantId?.trim();

    return defer(() =>
      this.tenantContext.run(
        {
          tenantId: tenantId || undefined,
          role: user?.role,
          // Solo SUPER_ADMIN tiene bypass por rol. Un usuario autenticado SIN tenantId
          // YA NO hace bypass (antes fallaba abierto y veía todos los tenants): ahora el
          // middleware de Prisma bloquea cualquier acceso a modelos tenant-scoped hasta
          // que la sesión traiga un tenantId válido. Los flujos de sistema legítimos
          // (webhooks, onboarding, jobs) declaran su bypass con runAsSystem().
          bypass: user?.role === "SUPER_ADMIN",
        },
        () => next.handle(),
      ),
    );
  }
}
