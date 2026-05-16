import { describe, expect, it } from "vitest";

import { requireApiProductionEnv } from "./require-production-env.js";

function productionEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://educai_app:secret@db.example.com:5432/postgres",
    ALLOWED_ORIGINS: "https://educ-ai-web.vercel.app,https://educ-ai-gov-dashboard.vercel.app",
    SUPABASE_URL: "https://mfjpoaipjlimzdxkusav.supabase.co",
    SUPABASE_SECRET_KEY: "secret",
    ANTHROPIC_API_KEY: "sk-ant-test",
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
            "postgresql://educai_app.mfjpoaipjlimzdxkusav:secret@pooler.example.com:6543/postgres",
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
            "postgresql://postgres.mfjpoaipjlimzdxkusav:secret@pooler.example.com:6543/postgres",
        }),
      ),
    ).toThrow(/BYPASSRLS/);
  });

  it("rechaza produccion sin ANTHROPIC_API_KEY", () => {
    expect(() => requireApiProductionEnv(productionEnv({ ANTHROPIC_API_KEY: "" }))).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });
});
