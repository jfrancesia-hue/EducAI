import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import type { AuthenticatedRequest } from "./authenticated-user.js";
import { SupabaseAuthService } from "./supabase-auth.service.js";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly auth: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Falta Authorization: Bearer <token>");
    }

    request.user = await this.auth.authenticate(token);
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | undefined {
    const raw = request.headers.authorization;
    const header = Array.isArray(raw) ? raw[0] : raw;

    if (!header) {
      return undefined;
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token?.trim()) {
      return undefined;
    }

    return token.trim();
  }
}
