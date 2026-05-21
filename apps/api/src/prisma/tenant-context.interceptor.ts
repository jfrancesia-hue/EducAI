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
          bypass: user?.role === "SUPER_ADMIN" || !tenantId,
        },
        () => next.handle(),
      ),
    );
  }
}
