import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";

type Bucket = {
  count: number;
  expiresAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 12;

@Injectable()
export class PublicThrottleGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
      path?: string;
      route?: { path?: string };
    }>();

    const now = Date.now();
    const ip = this.extractIp(request);
    const routeKey = request.route?.path ?? request.path ?? "public";
    const key = `${routeKey}:${ip}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + WINDOW_MS });
      this.prune(now);
      return true;
    }

    if (bucket.count >= MAX_REQUESTS) {
      throw new HttpException(
        {
          code: "PUBLIC_RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);
    return true;
  }

  private extractIp(request: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
  }): string {
    const forwarded = request.headers["x-forwarded-for"];
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = value?.split(",")[0]?.trim() || request.ip || "unknown";
    return ip.slice(0, 128);
  }

  private prune(now: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.expiresAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
