import { HttpException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { UserRateLimitGuard } from "./user-rate-limit.guard.js";

function ctxFor(request: unknown): ExecutionContext {
  return {
    getType: () => "http",
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("UserRateLimitGuard", () => {
  it("permite hasta `max` requests del mismo usuario y luego corta con 429", () => {
    const guard = new UserRateLimitGuard({ name: "test", windowMs: 60_000, max: 3 });
    const ctx = ctxFor({ user: { id: "u1" }, headers: {} });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it("usa buckets separados por usuario", () => {
    const guard = new UserRateLimitGuard({ name: "test", windowMs: 60_000, max: 1 });
    expect(guard.canActivate(ctxFor({ user: { id: "u1" }, headers: {} }))).toBe(true);
    // Otro usuario no se ve afectado por el límite del primero.
    expect(guard.canActivate(ctxFor({ user: { id: "u2" }, headers: {} }))).toBe(true);
    expect(() => guard.canActivate(ctxFor({ user: { id: "u1" }, headers: {} }))).toThrow();
  });

  it("cae a IP cuando no hay usuario autenticado", () => {
    const guard = new UserRateLimitGuard({ name: "test", windowMs: 60_000, max: 1 });
    const headers = { "x-forwarded-for": "203.0.113.7, 10.0.0.1" };
    expect(guard.canActivate(ctxFor({ headers }))).toBe(true);
    expect(() => guard.canActivate(ctxFor({ headers }))).toThrow();
  });
});
