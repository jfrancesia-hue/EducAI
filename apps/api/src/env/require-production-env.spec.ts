import { describe, expect, it } from "vitest";

import { requireApiProductionEnv } from "./require-production-env.js";

function productionEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://educai_app:secret@db.example.com:5432/postgres?schema=educai",
    ALLOWED_ORIGINS: "https://educ-ai-web.vercel.app,https://educ-ai-gov-dashboard.vercel.app",
    PUBLIC_APP_URL: "https://educ-ai-web.vercel.app",
    SUPABASE_URL: "https://mfjpoaipjlimzdxkusav.supabase.co",
    SUPABASE_SECRET_KEY: "secret",
    ANTHROPIC_API_KEY: "sk-ant-test",
    OPENAI_API_KEY: "sk-openai-test",
    TWILIO_ACCOUNT_SID: "ACtest",
    TWILIO_AUTH_TOKEN: "twilio-auth-token",
    TWILIO_WHATSAPP_FROM: "whatsapp:+5493834023867",
    TWILIO_PUBLIC_WEBHOOK_URL: "https://educai-api-t4gf.onrender.com/webhooks/twilio",
    TWILIO_FORCE_PROTOCOL: "https",
    TWILIO_SKIP_SIGNATURE_VALIDATION: "false",
    TWILIO_DRY_RUN: "false",
    MERCADOPAGO_ACCESS_TOKEN: "APP_USR-test",
    MERCADOPAGO_WEBHOOK_SECRET: "mp-webhook-secret",
    ...overrides,
  };
}

describe("requireApiProductionEnv", () => {
  it("acepta un entorno productivo con rol app sin BYPASSRLS", () => {
    expect(() => requireApiProductionEnv(productionEnv())).not.toThrow();
  });

  it("acepta rol app por pooler Supabase", () => {
    expect(() =>
      requireApiProductionEnv(
        productionEnv({
          DATABASE_URL:
            "postgresql://educai_app.mfjpoaipjlimzdxkusav:secret@pooler.example.com:6543/postgres?schema=educai",
        }),
      ),
    ).not.toThrow();
  });

  it("rechaza origenes locales en produccion", () => {
    expect(() =>
      requireApiProductionEnv(
        productionEnv({ ALLOWED_ORIGINS: "https://educ-ai-web.vercel.app,http://localhost:3000" }),
      ),
    ).toThrow(/ALLOWED_ORIGINS/);
  });

  it("rechaza DATABASE_URL invalida en produccion", () => {
    expect(() => requireApiProductionEnv(productionEnv({ DATABASE_URL: "not-a-url" }))).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rechaza rol postgres directo porque bypassea RLS", () => {
    expect(() =>
      requireApiProductionEnv(
        productionEnv({
          DATABASE_URL: "postgresql://postgres:secret@db.example.com:5432/postgres",
        }),
      ),
    ).toThrow(/BYPASSRLS/);
  });

  it("rechaza rol postgres de pooler Supabase porque bypassea RLS", () => {
    expect(() =>
      requireApiProductionEnv(
        productionEnv({
          DATABASE_URL:
            "postgresql://postgres.mfjpoaipjlimzdxkusav:secret@pooler.example.com:6543/postgres?schema=educai",
        }),
      ),
    ).toThrow(/BYPASSRLS/);
  });

  it("rechaza produccion sin ANTHROPIC_API_KEY", () => {
    expect(() => requireApiProductionEnv(productionEnv({ ANTHROPIC_API_KEY: "" }))).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("rechaza webhook Twilio local en produccion", () => {
    expect(() =>
      requireApiProductionEnv(
        productionEnv({ TWILIO_PUBLIC_WEBHOOK_URL: "http://localhost:4000/webhooks/twilio" }),
      ),
    ).toThrow(/TWILIO_PUBLIC_WEBHOOK_URL/);
  });

  it("rechaza validacion de firma Twilio desactivada en produccion", () => {
    expect(() =>
      requireApiProductionEnv(productionEnv({ TWILIO_SKIP_SIGNATURE_VALIDATION: "true" })),
    ).toThrow(/TWILIO_SKIP_SIGNATURE_VALIDATION/);
  });

  it("rechaza DATABASE_URL sin schema educai en produccion", () => {
    expect(() =>
      requireApiProductionEnv(
        productionEnv({
          DATABASE_URL: "postgresql://educai_app:secret@db.example.com:5432/postgres",
        }),
      ),
    ).toThrow(/schema=educai/);
  });

  it("rechaza produccion sin MERCADOPAGO_WEBHOOK_SECRET", () => {
    expect(() =>
      requireApiProductionEnv(productionEnv({ MERCADOPAGO_WEBHOOK_SECRET: "" })),
    ).toThrow(/MERCADOPAGO_WEBHOOK_SECRET/);
  });
});
