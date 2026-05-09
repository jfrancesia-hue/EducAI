import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../../auth/types.js";

interface Bucket {
  resetAt: number;
  count: number;
}

interface RateLimitRequest extends Partial<AuthenticatedRequest> {
  ip?: string;
  method?: string;
  url?: string;
  route?: {
    path?: string;
  };
}

const buckets = new Map<string, Bucket>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  private readonly maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
  private readonly aiMaxRequests = Number(process.env.RATE_LIMIT_AI_MAX_REQUESTS ?? 20);
  private cleanupAt = Date.now() + this.windowMs;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const now = Date.now();
    this.cleanupExpiredBuckets(now);

    const path = request.route?.path ?? request.url ?? "unknown";
    const method = request.method ?? "GET";
    const userKey = request.user?.sub ?? request.ip ?? "anonymous";
    const limit = this.isExpensivePath(path) ? this.aiMaxRequests : this.maxRequests;
    const key = `${userKey}:${method}:${path}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      throw new HttpException(
        {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes. Intenta nuevamente en unos instantes.",
          retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private isExpensivePath(path: string): boolean {
    return path.includes("diagnostic") || path.includes("generate") || path.includes("analyze");
  }

  private cleanupExpiredBuckets(now: number): void {
    if (now < this.cleanupAt) {
      return;
    }

    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
    this.cleanupAt = now + this.windowMs;
  }
}
