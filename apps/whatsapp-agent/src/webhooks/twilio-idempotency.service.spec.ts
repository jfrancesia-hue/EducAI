import { Prisma } from "@educai/database";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import { TwilioIdempotencyService } from "./twilio-idempotency.service.js";
import type { AppLogger } from "../common/logger/app-logger.service.js";

const SILENT_LOGGER = pino({ enabled: false });

function fakeLogger(): AppLogger {
  return {
    child: () => SILENT_LOGGER,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  } as unknown as AppLogger;
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("simulated", {
    code,
    clientVersion: "test",
  });
}

describe("TwilioIdempotencyService", () => {
  it("primer claim() crea la fila y reporta no procesado", async () => {
    const create = vi.fn().mockResolvedValue({});
    const findUnique = vi.fn();
    const prisma = {
      processedTwilioMessage: { create, findUnique, update: vi.fn() },
    };

    const service = new TwilioIdempotencyService(prisma as never, fakeLogger());
    const result = await service.claim("SM_first");

    expect(result.alreadyProcessed).toBe(false);
    expect(create).toHaveBeenCalledWith({
      data: { messageSid: "SM_first", outcome: "received" },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("segundo claim() detecta duplicado por P2002 y short-circuita", async () => {
    const create = vi.fn().mockRejectedValue(knownRequestError("P2002"));
    const findUnique = vi.fn().mockResolvedValue({
      outcome: "answered",
      receivedAt: new Date(),
      completedAt: new Date(),
    });
    const prisma = {
      processedTwilioMessage: { create, findUnique, update: vi.fn() },
    };

    const service = new TwilioIdempotencyService(prisma as never, fakeLogger());
    const result = await service.claim("SM_dup");

    expect(result.alreadyProcessed).toBe(true);
    expect(result.previousOutcome).toBe("answered");
    expect(findUnique).toHaveBeenCalledWith({
      where: { messageSid: "SM_dup" },
      select: { outcome: true, completedAt: true, receivedAt: true },
    });
  });

  it("propaga errores que no son P2002", async () => {
    const create = vi.fn().mockRejectedValue(new Error("db down"));
    const prisma = {
      processedTwilioMessage: { create, findUnique: vi.fn(), update: vi.fn() },
    };

    const service = new TwilioIdempotencyService(prisma as never, fakeLogger());

    await expect(service.claim("SM_err")).rejects.toThrow("db down");
  });

  it("markCompleted actualiza outcome + completedAt + tenantId/studentId", async () => {
    interface UpdateArgs {
      where: { messageSid: string };
      data: {
        outcome: string;
        completedAt: Date;
        tenantId?: string;
        studentId?: string;
      };
    }
    const update = vi.fn<(args: UpdateArgs) => Promise<unknown>>().mockResolvedValue({});
    const prisma = {
      processedTwilioMessage: { create: vi.fn(), findUnique: vi.fn(), update },
    };

    const service = new TwilioIdempotencyService(prisma as never, fakeLogger());
    await service.markCompleted("SM_done", "answered", {
      tenantId: "tnt_a",
      studentId: "stu_1",
    });

    expect(update).toHaveBeenCalledTimes(1);
    const call = update.mock.calls[0]![0];
    expect(call.where).toEqual({ messageSid: "SM_done" });
    expect(call.data.outcome).toBe("answered");
    expect(call.data.tenantId).toBe("tnt_a");
    expect(call.data.studentId).toBe("stu_1");
    expect(call.data.completedAt).toBeInstanceOf(Date);
  });

  it("markCompleted ignora P2025 (fila no encontrada) sin tirar excepcion", async () => {
    const update = vi.fn().mockRejectedValue(knownRequestError("P2025"));
    const prisma = {
      processedTwilioMessage: { create: vi.fn(), findUnique: vi.fn(), update },
    };

    const service = new TwilioIdempotencyService(prisma as never, fakeLogger());

    await expect(service.markCompleted("SM_missing", "error")).resolves.toBeUndefined();
  });
});
