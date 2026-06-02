import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";

import type { AuthenticatedUser } from "../../auth/authenticated-user.js";

export interface UserRateLimitOptions {
  /** Etiqueta para separar buckets de distintos endpoints. */
  name: string;
  /** Ventana de tiempo en ms. */
  windowMs: number;
  /** Máximo de requests por (usuario|ip) dentro de la ventana. */
  max: number;
}

type Bucket = {
  count: number;
  expiresAt: number;
};

/**
 * Rate limit por usuario autenticado (fallback a IP) para endpoints costosos
 * (p. ej. el tutor IA, que consume tokens de LLM por request).
 *
 * Limitación conocida: el store es in-memory y por-instancia. Con varias réplicas
 * el límite efectivo se multiplica por la cantidad de instancias y se reinicia en
 * cada deploy. El follow-up productivo es un store compartido (Redis, ya usado por
 * el worker / BullMQ). Aun así, in-memory frena el abuso desde un único cliente.
 */
@Injectable()
export class UserRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly options: UserRateLimitOptions) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== "http") {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
    }>();

    const now = Date.now();
    const subject = request.user?.id ?? `ip:${this.extractIp(request)}`;
    const key = `${this.options.name}:${subject}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + this.options.windowMs });
      this.prune(now);
      return true;
    }

    if (bucket.count >= this.options.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000));
      throw new HttpException(
        {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.",
          retryAfter,
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
