import { Injectable } from "@nestjs/common";
import pino, { Logger } from "pino";

@Injectable()
export class AppLogger {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      name: "educai-whatsapp-agent",
      level: process.env.LOG_LEVEL ?? "info",
      base: {
        service: "educai-whatsapp-agent",
        env: process.env.NODE_ENV ?? "development",
      },
      redact: {
        paths: [
          "req.headers.authorization",
          "*.password",
          "*.whatsappPhone",
          "*.fromWhatsappPhone",
          "*.toWhatsappPhone",
          "*.From",
          "*.To",
        ],
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
