import { Prisma } from "@educai/database";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import type { AppLogger } from "../common/logger/app-logger.service.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { ConsentService } from "./consent.service.js";
import {
  ConsentAlreadyRevokedError,
  ConsentNetworkMetadataMissingError,
  ConsentNotFoundError,
  ConsentStudentScopeError,
  ConsentTermsRequiredError,
} from "./errors/consent.errors.js";

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

const PARENT_USER: AuthenticatedUser = {
  sub: "usr_parent",
  tenantId: "tnt_1",
  role: "PARENT",
  familyId: "fam_1",
};

const ELEVATED_USER: AuthenticatedUser = {
  sub: "usr_admin",
  tenantId: "tnt_1",
  role: "SUPER_ADMIN",
};

interface PrismaTx {
  parentalConsent: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  student: {
    findFirst: ReturnType<typeof vi.fn>;
  };
}

function buildPrismaMock() {
  const tx: PrismaTx = {
    parentalConsent: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
  };
  const withUser = vi.fn((_user: AuthenticatedUser, callback: (db: PrismaTx) => unknown) =>
    Promise.resolve(callback(tx)),
  );
  const withServiceRole = vi.fn((callback: (db: PrismaTx) => unknown) =>
    Promise.resolve(callback(tx)),
  );
  return { tx, prisma: { withUser, withServiceRole } as never };
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("simulated", {
    code,
    clientVersion: "test",
  });
}

const VALID_DTO = {
  studentId: "stu_1",
  documentVersion: "v1.0-2026-05-07",
  termsAccepted: true,
  privacyAccepted: true,
  aiProcessingAccepted: true,
};

describe("ConsentService.sign", () => {
  it("rechaza si falta cualquier flag de aceptacion", async () => {
    const { prisma } = buildPrismaMock();
    const service = new ConsentService(prisma, loggerStub());

    await expect(
      service.sign({
        dto: { ...VALID_DTO, privacyAccepted: false },
        user: PARENT_USER,
        ipAddress: "1.2.3.4",
        userAgent: "Chrome",
      }),
    ).rejects.toBeInstanceOf(ConsentTermsRequiredError);
  });

  it("rechaza si falta IP o user-agent", async () => {
    const { prisma } = buildPrismaMock();
    const service = new ConsentService(prisma, loggerStub());

    await expect(
      service.sign({ dto: VALID_DTO, user: PARENT_USER, ipAddress: undefined, userAgent: "x" }),
    ).rejects.toBeInstanceOf(ConsentNetworkMetadataMissingError);
  });

  it("rechaza si el padre no es de la familia del alumno", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.student.findFirst.mockResolvedValue({ id: "stu_1", familyId: "fam_other" });
    const service = new ConsentService(prisma, loggerStub());

    await expect(
      service.sign({
        dto: VALID_DTO,
        user: PARENT_USER,
        ipAddress: "1.2.3.4",
        userAgent: "Chrome",
      }),
    ).rejects.toBeInstanceOf(ConsentStudentScopeError);
  });

  it("permite firmar a SUPER_ADMIN sin verificar familia", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.parentalConsent.create.mockResolvedValue({
      id: "consent_1",
      studentId: "stu_1",
      tenantId: "tnt_1",
      parentUserId: "usr_admin",
      documentVersion: "v1.0",
    });
    const service = new ConsentService(prisma, loggerStub());

    const result = await service.sign({
      dto: VALID_DTO,
      user: ELEVATED_USER,
      ipAddress: "1.2.3.4",
      userAgent: "Chrome",
    });

    expect(result.id).toBe("consent_1");
    expect(tx.student.findFirst).not.toHaveBeenCalled();
  });

  it("firma persistiendo IP, user-agent (truncado a 512) y todas las flags", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.student.findFirst.mockResolvedValue({ id: "stu_1", familyId: "fam_1" });
    tx.parentalConsent.create.mockResolvedValue({ id: "consent_1" });
    const service = new ConsentService(prisma, loggerStub());

    const longUa = "x".repeat(1000);
    await service.sign({
      dto: VALID_DTO,
      user: PARENT_USER,
      ipAddress: "200.50.10.1",
      userAgent: longUa,
    });

    const call = tx.parentalConsent.create.mock.calls[0]![0] as {
      data: { ipAddress: string; userAgent: string; tenantId: string; parentUserId: string };
    };
    expect(call.data.ipAddress).toBe("200.50.10.1");
    expect(call.data.userAgent.length).toBe(512);
    expect(call.data.tenantId).toBe("tnt_1");
    expect(call.data.parentUserId).toBe("usr_parent");
  });

  it("ante P2002 (duplicado studentId+version+parent) retorna el consent existente", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.student.findFirst.mockResolvedValue({ id: "stu_1", familyId: "fam_1" });
    tx.parentalConsent.create.mockRejectedValue(knownRequestError("P2002"));
    tx.parentalConsent.findFirst.mockResolvedValue({ id: "consent_existing" });
    const service = new ConsentService(prisma, loggerStub());

    const result = await service.sign({
      dto: VALID_DTO,
      user: PARENT_USER,
      ipAddress: "1.2.3.4",
      userAgent: "Chrome",
    });

    expect(result.id).toBe("consent_existing");
  });
});

describe("ConsentService.revoke", () => {
  it("404 si el consent no existe", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.parentalConsent.findUnique.mockResolvedValue(null);
    const service = new ConsentService(prisma, loggerStub());

    await expect(
      service.revoke({ consentId: "ghost", user: ELEVATED_USER }),
    ).rejects.toBeInstanceOf(ConsentNotFoundError);
  });

  it("409 si el consent ya esta revocado", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.parentalConsent.findUnique.mockResolvedValue({
      id: "c1",
      studentId: "stu_1",
      revokedAt: new Date(),
    });
    const service = new ConsentService(prisma, loggerStub());

    await expect(service.revoke({ consentId: "c1", user: ELEVATED_USER })).rejects.toBeInstanceOf(
      ConsentAlreadyRevokedError,
    );
  });

  it("revoca seteando revokedAt, revokedByUserId y reason truncada", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.parentalConsent.findUnique.mockResolvedValue({
      id: "c1",
      studentId: "stu_1",
      revokedAt: null,
    });
    tx.student.findFirst.mockResolvedValue({ id: "stu_1", familyId: "fam_1" });
    tx.parentalConsent.update.mockResolvedValue({ id: "c1", revokedAt: new Date() });
    const service = new ConsentService(prisma, loggerStub());

    await service.revoke({
      consentId: "c1",
      reason: "z".repeat(1000),
      user: PARENT_USER,
    });

    const call = tx.parentalConsent.update.mock.calls[0]![0] as {
      data: { revokedAt: Date; revokedByUserId: string; revocationReason: string };
    };
    expect(call.data.revokedAt).toBeInstanceOf(Date);
    expect(call.data.revokedByUserId).toBe("usr_parent");
    expect(call.data.revocationReason.length).toBe(512);
  });
});

describe("ConsentService.hasActiveConsent", () => {
  it("true si count > 0 (usa service_role)", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.parentalConsent.count.mockResolvedValue(1);
    const service = new ConsentService(prisma, loggerStub());

    const result = await service.hasActiveConsent("stu_1");

    expect(result).toBe(true);
  });

  it("false si no hay consents activos", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.parentalConsent.count.mockResolvedValue(0);
    const service = new ConsentService(prisma, loggerStub());

    const result = await service.hasActiveConsent("stu_1");

    expect(result).toBe(false);
  });
});
