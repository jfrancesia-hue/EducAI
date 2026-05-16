import { describe, expect, it } from "vitest";

import { requireWhatsappProductionEnv } from "./require-production-env.js";

function productionEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://educai_app:secret@db.example.com:5432/postgres",
    TWILIO_AUTH_TOKEN: "twilio-token",
    TWILIO_ACCOUNT_SID: "AC123",
    TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886",
    ANTHROPIC_API_KEY: "sk-ant-test",
    OPENAI_API_KEY: "sk-openai-test",
    ...overrides,
  };
}

describe("requireWhatsappProductionEnv", () => {
  it("acepta entorno productivo completo", () => {
    expect(() => requireWhatsappProductionEnv(productionEnv())).not.toThrow();
  });

  it("acepta API Key de Twilio en lugar de Auth Token", () => {
    expect(() =>
      requireWhatsappProductionEnv(
        productionEnv({
          TWILIO_AUTH_TOKEN: "",
          TWILIO_API_KEY_SID: "SK123",
          TWILIO_API_KEY_SECRET: "twilio-api-secret",
        }),
      ),
    ).not.toThrow();
  });

  it("rechaza produccion sin credenciales completas de Twilio", () => {
    expect(() =>
      requireWhatsappProductionEnv(
        productionEnv({
          TWILIO_AUTH_TOKEN: "",
          TWILIO_API_KEY_SID: "SK123",
          TWILIO_API_KEY_SECRET: "",
        }),
      ),
    ).toThrow(/Twilio/);
  });

  it("rechaza produccion sin Anthropic", () => {
    expect(() => requireWhatsappProductionEnv(productionEnv({ ANTHROPIC_API_KEY: "" }))).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("rechaza produccion sin OpenAI para audio", () => {
    expect(() => requireWhatsappProductionEnv(productionEnv({ OPENAI_API_KEY: "" }))).toThrow(
      /OPENAI_API_KEY/,
    );
  });
});
