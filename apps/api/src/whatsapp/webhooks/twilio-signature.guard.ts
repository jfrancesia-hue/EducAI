import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import twilio from "twilio";
import { AppLogger } from "../common/logger/app-logger.service.js";
import {
  TwilioMissingSignatureError,
  TwilioSignatureMismatchError,
} from "./errors/webhook.errors.js";

interface TwilioRequest {
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, string>;
  protocol?: string;
  originalUrl?: string;
  url?: string;
  get?(name: string): string | undefined;
}

/**
 * Valida la firma X-Twilio-Signature usando twilio.validateRequest.
 *
 * Twilio firma con HMAC-SHA1(authToken, fullUrl + sortedFormParams). Requiere
 * el body ya parseado como x-www-form-urlencoded (lo provee Express por default).
 *
 * En desarrollo se puede saltar con TWILIO_SKIP_SIGNATURE_VALIDATION=true,
 * útil para tests manuales con curl. NUNCA setear en producción.
 */
@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get<string>("TWILIO_SKIP_SIGNATURE_VALIDATION") === "true") {
      this.logger.warn({ feature: "twilio-signature" }, "twilio.signature.skipped_via_env");
      return true;
    }

    const request = context.switchToHttp().getRequest<TwilioRequest>();
    const signature = this.extractSignature(request);

    if (!signature) {
      throw new TwilioMissingSignatureError();
    }

    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN no está configurado");
    }

    const url = this.buildPublicUrl(request);
    const params = request.body ?? {};

    const valid = twilio.validateRequest(authToken, signature, url, params);

    if (!valid) {
      this.logger.warn({ url, hasSignature: true }, "twilio.signature.invalid");
      throw new TwilioSignatureMismatchError();
    }

    return true;
  }

  private extractSignature(request: TwilioRequest): string | undefined {
    const raw = request.headers["x-twilio-signature"];
    if (Array.isArray(raw)) {
      return raw[0]?.trim() || undefined;
    }
    return raw?.trim() || undefined;
  }

  private buildPublicUrl(request: TwilioRequest): string {
    const explicit = this.config.get<string>("TWILIO_PUBLIC_WEBHOOK_URL");
    if (explicit) {
      return explicit;
    }

    const proto = this.config.get<string>("TWILIO_FORCE_PROTOCOL") ?? request.protocol ?? "https";
    const host = request.get?.("host") ?? request.headers["host"];
    const path = request.originalUrl ?? request.url ?? "";
    if (!host) {
      throw new Error(
        "No se pudo construir la URL pública del webhook (falta header host y TWILIO_PUBLIC_WEBHOOK_URL)",
      );
    }
    return `${proto}://${String(host)}${path}`;
  }
}
