import { Reflector } from "@nestjs/core";
import { firstValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { AuditLogInterceptor } from "./audit-log.interceptor.js";
import type { AuditLogService } from "./audit-log.service.js";
import type { AuditMetadata } from "./audited.decorator.js";

interface FakeRequest {
  user?: { sub?: string; tenantId?: string; role?: string };
  params?: Record<string, string>;
  method?: string;
  originalUrl?: string;
}

function buildContext(metadata: AuditMetadata | undefined, request: FakeRequest): ExecutionContext {
  const handler = () => undefined;
  if (metadata) {
    Reflect.defineMetadata("educai:audit", metadata, handler);
  }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
    getClass: () => class FakeController {},
  } as unknown as ExecutionContext;
}

function buildHandler(value: unknown): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

describe("AuditLogInterceptor", () => {
  it("no escribe si el handler no tiene @Audited", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const audit = { write } as unknown as AuditLogService;
    const reflector = new Reflector();
    const interceptor = new AuditLogInterceptor(reflector, audit);

    const ctx = buildContext(undefined, { user: { sub: "u1", tenantId: "t1", role: "TEACHER" } });
    const result = await firstValueFrom(interceptor.intercept(ctx, buildHandler({ ok: true })));

    expect(result).toEqual({ ok: true });
    expect(write).not.toHaveBeenCalled();
  });

  it("escribe AuditLog con entityId desde request.params[id] cuando esta presente", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const audit = { write } as unknown as AuditLogService;
    const reflector = new Reflector();
    const interceptor = new AuditLogInterceptor(reflector, audit);

    const ctx = buildContext(
      { action: "student.read", entity: "Student" },
      {
        user: { sub: "u1", tenantId: "t1", role: "PARENT" },
        params: { id: "stu_99" },
        method: "GET",
        originalUrl: "/students/stu_99",
      },
    );

    await firstValueFrom(interceptor.intercept(ctx, buildHandler({ id: "stu_99" })));
    await new Promise((r) => setImmediate(r));

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith({
      tenantId: "t1",
      actorId: "u1",
      action: "student.read",
      entity: "Student",
      entityId: "stu_99",
      metadata: { method: "GET", path: "/students/stu_99", role: "PARENT" },
    });
  });

  it("usa response.id como entityId si no hay param[id]", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const audit = { write } as unknown as AuditLogService;
    const reflector = new Reflector();
    const interceptor = new AuditLogInterceptor(reflector, audit);

    const ctx = buildContext(
      { action: "student.created", entity: "Student" },
      {
        user: { sub: "u1", tenantId: "t1", role: "PARENT" },
        method: "POST",
        originalUrl: "/students",
      },
    );

    await firstValueFrom(interceptor.intercept(ctx, buildHandler({ id: "stu_new" })));
    await new Promise((r) => setImmediate(r));

    expect(write.mock.calls[0]![0].entityId).toBe("stu_new");
  });

  it("respeta skipEntityId=true", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const audit = { write } as unknown as AuditLogService;
    const reflector = new Reflector();
    const interceptor = new AuditLogInterceptor(reflector, audit);

    const ctx = buildContext(
      { action: "agent.run", entity: "Agent", skipEntityId: true },
      {
        user: { sub: "u1", tenantId: "t1", role: "TEACHER" },
        params: { id: "should_be_ignored" },
        method: "POST",
        originalUrl: "/agent/run",
      },
    );

    await firstValueFrom(interceptor.intercept(ctx, buildHandler({ id: "should_be_ignored" })));
    await new Promise((r) => setImmediate(r));

    expect(write.mock.calls[0]![0].entityId).toBeNull();
  });
});
