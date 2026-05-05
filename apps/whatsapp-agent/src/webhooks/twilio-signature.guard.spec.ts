import { describe, expect, it, vi } from "vitest";
import twilio from "twilio";
import { TwilioSignatureGuard } from "./twilio-signature.guard.js";
import {
  TwilioMissingSignatureError,
  TwilioSignatureMismatchError,
} from "./errors/webhook.errors.js";

const FAKE_TOKEN = "test_auth_token_123";
const PUBLIC_URL = "https://educai.test/webhooks/twilio/whatsapp";

function buildContext(headers: Record<string, string>, body: Record<string, string>) {
  const request = {
    headers,
    body,
    protocol: "https",
    originalUrl: "/webhooks/twilio/whatsapp",
    url: "/webhooks/twilio/whatsapp",
    get: (name: string) => (name === "host" ? "educai.test" : undefined),
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

function buildConfig(values: Record<string, string | undefined>) {
  return {
    get: (key: string) => values[key],
  } as never;
}

const loggerStub = {
  child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as never;

describe("TwilioSignatureGuard", () => {
  it("acepta una firma válida calculada por el SDK de Twilio", () => {
    const params = { From: "whatsapp:+549", Body: "hola" };
    const signature = twilio.getExpectedTwilioSignature(FAKE_TOKEN, PUBLIC_URL, params);
    const config = buildConfig({
      TWILIO_AUTH_TOKEN: FAKE_TOKEN,
      TWILIO_PUBLIC_WEBHOOK_URL: PUBLIC_URL,
    });
    const guard = new TwilioSignatureGuard(config, loggerStub);

    const ctx = buildContext({ "x-twilio-signature": signature }, params);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("rechaza con UnauthorizedException si falta el header", () => {
    const config = buildConfig({
      TWILIO_AUTH_TOKEN: FAKE_TOKEN,
      TWILIO_PUBLIC_WEBHOOK_URL: PUBLIC_URL,
    });
    const guard = new TwilioSignatureGuard(config, loggerStub);

    const ctx = buildContext({}, { From: "whatsapp:+549" });

    expect(() => guard.canActivate(ctx)).toThrow(TwilioMissingSignatureError);
  });

  it("rechaza con ForbiddenException si la firma no matchea", () => {
    const config = buildConfig({
      TWILIO_AUTH_TOKEN: FAKE_TOKEN,
      TWILIO_PUBLIC_WEBHOOK_URL: PUBLIC_URL,
    });
    const guard = new TwilioSignatureGuard(config, loggerStub);

    const ctx = buildContext(
      { "x-twilio-signature": "firma-fabricada-incorrecta" },
      { From: "whatsapp:+549" },
    );

    expect(() => guard.canActivate(ctx)).toThrow(TwilioSignatureMismatchError);
  });

  it("salta validación si TWILIO_SKIP_SIGNATURE_VALIDATION=true", () => {
    const config = buildConfig({
      TWILIO_SKIP_SIGNATURE_VALIDATION: "true",
    });
    const guard = new TwilioSignatureGuard(config, loggerStub);

    const ctx = buildContext({}, {});

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("construye URL pública desde host header si no hay TWILIO_PUBLIC_WEBHOOK_URL", () => {
    const params = { From: "whatsapp:+549" };
    const fullUrl = "https://educai.test/webhooks/twilio/whatsapp";
    const signature = twilio.getExpectedTwilioSignature(FAKE_TOKEN, fullUrl, params);
    const config = buildConfig({
      TWILIO_AUTH_TOKEN: FAKE_TOKEN,
    });
    const guard = new TwilioSignatureGuard(config, loggerStub);

    const ctx = buildContext({ "x-twilio-signature": signature }, params);

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
