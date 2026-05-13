import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AuthenticatedRequest, AuthenticatedUser } from "./authenticated-user.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new Error("CurrentUser requires SupabaseAuthGuard before controller access");
    }

    return request.user;
  },
);
