import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import type { ExecutionContext } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

const SECRET = "test-secret-with-enough-length-for-auth";

function signToken(payload: Record<string, unknown>, secret = SECRET): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function contextFor(auth?: string): ExecutionContext {
  const request = { headers: auth ? { authorization: auth } : {} };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  it("rechaza requests sin Bearer token", () => {
    process.env.JWT_SECRET = SECRET;
    const guard = new JwtAuthGuard();

    expect(() => guard.canActivate(contextFor())).toThrow("Falta el token Bearer");
  });

  it("rechaza token con firma invalida", () => {
    process.env.JWT_SECRET = SECRET;
    const guard = new JwtAuthGuard();
    const token = signToken(
      { sub: "usr_1", tenantId: "tnt_1", role: "PARENT", exp: Math.floor(Date.now() / 1000) + 60 },
      "wrong-secret",
    );

    expect(() => guard.canActivate(contextFor(`Bearer ${token}`))).toThrow(
      "El token de autenticacion es invalido",
    );
  });

  it("rechaza token con role desconocido", () => {
    process.env.JWT_SECRET = SECRET;
    const guard = new JwtAuthGuard();
    const token = signToken({
      sub: "usr_1",
      tenantId: "tnt_1",
      role: "ROOT",
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    expect(() => guard.canActivate(contextFor(`Bearer ${token}`))).toThrow(
      "El token de autenticacion es invalido",
    );
  });

  it("adjunta usuario autenticado cuando el token es valido", () => {
    process.env.JWT_SECRET = SECRET;
    const guard = new JwtAuthGuard();
    const request = {
      headers: {
        authorization: `Bearer ${signToken({
          sub: "usr_1",
          tenantId: "tnt_1",
          role: "PARENT",
          familyId: "fam_1",
          exp: Math.floor(Date.now() / 1000) + 60,
        })}`,
      },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: vi.fn(() => request),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(request).toMatchObject({
      user: { sub: "usr_1", tenantId: "tnt_1", role: "PARENT", familyId: "fam_1" },
    });
  });
});
