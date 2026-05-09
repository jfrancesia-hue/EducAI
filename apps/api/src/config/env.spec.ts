import { afterEach, describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "./env.js";

const ORIGINAL_ENV = { ...process.env };

describe("validateRuntimeEnv", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("rechaza DATABASE_URL de produccion con rol postgres porque bypassea RLS", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://postgres:secret@db.mfjpoaipjlimzdxkusav.supabase.co:5432/postgres?schema=public";
    process.env.JWT_SECRET = "x".repeat(32);
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.ALLOWED_ORIGINS = "https://app.educai.test";

    expect(() => validateRuntimeEnv()).toThrow(/BYPASSRLS/);
  });

  it("acepta DATABASE_URL de produccion con rol app NOBYPASSRLS", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://educai_app:secret@db.mfjpoaipjlimzdxkusav.supabase.co:5432/postgres?schema=public";
    process.env.JWT_SECRET = "x".repeat(32);
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.ALLOWED_ORIGINS = "https://app.educai.test";

    expect(() => validateRuntimeEnv()).not.toThrow();
  });
});
