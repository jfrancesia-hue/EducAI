import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import type { AppLogger } from "../logger/app-logger.service.js";
import { AuditLogService } from "./audit-log.service.js";

const SILENT = pino({ enabled: false });

function loggerStub(): AppLogger {
  return {
    child: () => SILENT,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  } as unknown as AppLogger;
}

describe("AuditLogService", () => {
  it("escribe via service_role para evitar bloqueos RLS", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit_1" });
    const withServiceRole = vi.fn(
      async (cb: (tx: { auditLog: { create: typeof create } }) => Promise<unknown>) => {
        return cb({ auditLog: { create } });
      },
    );

    const prisma = { withServiceRole } as never;
    const service = new AuditLogService(prisma, loggerStub());

    await service.write({
      tenantId: "tnt_1",
      actorId: "usr_1",
      action: "student.read",
      entity: "Student",
      entityId: "stu_1",
      metadata: { method: "GET" },
    });

    expect(withServiceRole).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: "tnt_1",
        actorId: "usr_1",
        action: "student.read",
        entity: "Student",
        entityId: "stu_1",
        metadata: { method: "GET" },
      },
    });
  });

  it("loguea warning y no propaga el error si la escritura falla", async () => {
    const withServiceRole = vi.fn().mockRejectedValue(new Error("db down"));
    const prisma = { withServiceRole } as never;
    const service = new AuditLogService(prisma, loggerStub());

    await expect(
      service.write({ action: "student.read", entity: "Student" }),
    ).resolves.toBeUndefined();
  });

  it("normaliza tenantId/actorId/entityId/metadata ausentes", async () => {
    const create = vi.fn().mockResolvedValue({});
    const withServiceRole = vi.fn(
      async (cb: (tx: { auditLog: { create: typeof create } }) => Promise<unknown>) => {
        return cb({ auditLog: { create } });
      },
    );

    const prisma = { withServiceRole } as never;
    const service = new AuditLogService(prisma, loggerStub());

    await service.write({ action: "agent.run", entity: "Agent" });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: null,
        actorId: null,
        action: "agent.run",
        entity: "Agent",
        entityId: null,
        metadata: {},
      },
    });
  });
});
