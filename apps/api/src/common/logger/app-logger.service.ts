import { Injectable } from "@nestjs/common";
import pino, { Logger } from "pino";

/** Para cada clave sensible genera el match en raíz y hasta 2 niveles de anidación. */
function redactPaths(keys: string[]): string[] {
  return keys.flatMap((key) => [key, `*.${key}`, `*.*.${key}`]);
}

@Injectable()
export class AppLogger {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      name: "educai-api",
      level: process.env.LOG_LEVEL ?? "info",
      base: {
        service: "educai-api",
        env: process.env.NODE_ENV ?? "development",
      },
      redact: {
        // PII y secretos: cubrimos raíz y hasta 2 niveles de anidación. No redactamos
        // identificadores opacos (studentId/familyId/tenantId) porque sirven para trazar
        // y no son PII directa.
        paths: redactPaths([
          "password",
          "whatsappPhone",
          "phone",
          "email",
          "payerEmail",
          "ip",
          "ipAddress",
          "userAgent",
          "token",
          "accessToken",
          "refreshToken",
          "apiKey",
          "secret",
        ]).concat("req.headers.authorization", "req.headers.cookie"),
        censor: "[REDACTED]",
      },
    });
  }

  child(context: Record<string, unknown>): Logger {
    return this.logger.child(context);
  }

  info(payload: Record<string, unknown>, message: string): void {
    this.logger.info(payload, message);
  }

  warn(payload: Record<string, unknown>, message: string): void {
    this.logger.warn(payload, message);
  }

  error(payload: Record<string, unknown>, message: string): void {
    this.logger.error(payload, message);
  }
}
