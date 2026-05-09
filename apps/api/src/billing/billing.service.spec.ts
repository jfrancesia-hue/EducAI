import type { ConfigService } from "@nestjs/config";
import { Prisma } from "@educai/database";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import type { AppLogger } from "../common/logger/app-logger.service.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { BillingService } from "./billing.service.js";
import {
  BillingFamilyScopeError,
  BillingNotConfiguredError,
  BillingWebhookSecretMissingError,
  BillingWebhookSignatureInvalidError,
} from "./errors/billing.errors.js";
import type { MercadoPagoClient, PaymentDetails, PreferenceResult } from "./mercadopago.client.js";

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

function configStub(values: Record<string, string | undefined> = {}): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

const PARENT: AuthenticatedUser = {
  sub: "usr_parent",
  tenantId: "tnt_1",
  role: "PARENT",
  familyId: "fam_1",
};

const ADMIN: AuthenticatedUser = {
  sub: "usr_admin",
  tenantId: "tnt_1",
  role: "SUPER_ADMIN",
};

interface PrismaTx {
  subscription: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  billingEvent: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

function buildPrismaMock() {
  const tx: PrismaTx = {
    subscription: {
      upsert: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    billingEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
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

type MpStub = {
  isConfigured?: ReturnType<typeof vi.fn>;
  createPreference?: ReturnType<typeof vi.fn>;
  fetchPayment?: ReturnType<typeof vi.fn>;
  verifyWebhookSignature?: ReturnType<typeof vi.fn>;
};

function buildMpClientMock(overrides: MpStub = {}): MercadoPagoClient {
  const defaults: PreferenceResult = {
    id: "pref_123",
    initPoint: "https://mp.test/checkout/pref_123",
    sandboxInitPoint: undefined,
  };
  const base: MpStub = {
    isConfigured: vi.fn().mockReturnValue(true),
    createPreference: vi.fn().mockResolvedValue(defaults),
    fetchPayment: vi.fn(),
    verifyWebhookSignature: vi.fn().mockReturnValue(true),
    ...overrides,
  };
  return base as unknown as MercadoPagoClient;
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("simulated", {
    code,
    clientVersion: "test",
  });
}

describe("BillingService.createPreference", () => {
  it("503 si MercadoPago no esta configurado", async () => {
    const { prisma } = buildPrismaMock();
    const mp = buildMpClientMock({
      isConfigured: vi.fn().mockReturnValue(false),
    });
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    await expect(service.createPreference("BASIC", "fam_1", PARENT)).rejects.toBeInstanceOf(
      BillingNotConfiguredError,
    );
  });

  it("403 si el padre quiere crear preferencia para otra familia", async () => {
    const { prisma } = buildPrismaMock();
    const mp = buildMpClientMock();
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    await expect(service.createPreference("BASIC", "fam_other", PARENT)).rejects.toBeInstanceOf(
      BillingFamilyScopeError,
    );
  });

  it("admin puede crear preferencia para cualquier familia", async () => {
    const { prisma } = buildPrismaMock();
    const mp = buildMpClientMock();
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    const result = await service.createPreference("FAMILY", "fam_X", ADMIN);

    expect(result.preferenceId).toBe("pref_123");
    expect(result.checkoutUrl).toContain("https://");
  });

  it("upsert de Subscription con status PAST_DUE hasta confirmar pago", async () => {
    const { tx, prisma } = buildPrismaMock();
    const mp = buildMpClientMock();
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    await service.createPreference("BASIC", "fam_1", PARENT);

    const upsertArgs = tx.subscription.upsert.mock.calls[0]![0] as {
      where: { familyId: string };
      create: { status: string; plan: string; provider: string };
    };
    expect(upsertArgs.where.familyId).toBe("fam_1");
    expect(upsertArgs.create.status).toBe("PAST_DUE");
    expect(upsertArgs.create.plan).toBe("BASIC");
    expect(upsertArgs.create.provider).toBe("mercadopago");
  });
});

describe("BillingService.processMercadoPagoWebhook", () => {
  function buildEvent(extra: Record<string, unknown> = {}) {
    return {
      headers: {
        "x-signature": "ts=1234,v1=abc",
        "x-request-id": "req_1",
      },
      body: { type: "payment", data: { id: "pay_123" }, id: "evt_1", ...extra },
      rawBody: JSON.stringify({ type: "payment", data: { id: "pay_123" } }),
    };
  }

  it("503 si secret falta en produccion", async () => {
    const { prisma } = buildPrismaMock();
    const mp = buildMpClientMock();
    const service = new BillingService(prisma, configStub(), mp, loggerStub());
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      await expect(service.processMercadoPagoWebhook(buildEvent())).rejects.toBeInstanceOf(
        BillingWebhookSecretMissingError,
      );
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it("401 si la firma es invalida", async () => {
    const { prisma } = buildPrismaMock();
    const mp = buildMpClientMock({
      verifyWebhookSignature: vi.fn().mockReturnValue(false),
    });
    const service = new BillingService(
      prisma,
      configStub({ MERCADOPAGO_WEBHOOK_SECRET: "shh" }),
      mp,
      loggerStub(),
    );

    await expect(service.processMercadoPagoWebhook(buildEvent())).rejects.toBeInstanceOf(
      BillingWebhookSignatureInvalidError,
    );
  });

  it("idempotente: segunda recepcion del mismo eventId retorna outcome previo", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.billingEvent.create.mockRejectedValue(knownRequestError("P2002"));
    tx.billingEvent.findUnique.mockResolvedValue({
      id: "be_1",
      provider: "mercadopago",
      providerEventId: "evt_1",
      outcome: "subscription_activated",
    });
    const mp = buildMpClientMock();
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    const result = await service.processMercadoPagoWebhook(buildEvent());

    expect(result.outcome).toBe("subscription_activated");
    expect(tx.subscription.update).not.toHaveBeenCalled();
  });

  it("activa suscripcion cuando payment.status=approved", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.billingEvent.create.mockResolvedValue({ id: "be_1", outcome: null });
    tx.subscription.findFirst.mockResolvedValue({
      id: "sub_1",
      familyId: "fam_1",
      plan: "BASIC",
      externalReference: "tnt_1:fam_1:BASIC:abc",
    });

    const payment: PaymentDetails = {
      id: "pay_123",
      status: "approved",
      externalReference: "tnt_1:fam_1:BASIC:abc",
      rawResponse: {},
    };
    const mp = buildMpClientMock({
      fetchPayment: vi.fn().mockResolvedValue(payment),
    });
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    const result = await service.processMercadoPagoWebhook(buildEvent());

    expect(result.outcome).toBe("subscription_activated");
    expect(tx.subscription.update).toHaveBeenCalledTimes(1);
    const updateArgs = tx.subscription.update.mock.calls[0]![0] as {
      where: { id: string };
      data: { status: string; providerSubId: string };
    };
    expect(updateArgs.where.id).toBe("sub_1");
    expect(updateArgs.data.status).toBe("ACTIVE");
    expect(updateArgs.data.providerSubId).toBe("pay_123");
  });

  it("ignora evento si externalReference no matchea ninguna Subscription", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.billingEvent.create.mockResolvedValue({ id: "be_1", outcome: null });
    tx.subscription.findFirst.mockResolvedValue(null);

    const payment: PaymentDetails = {
      id: "pay_123",
      status: "approved",
      externalReference: "ghost_ref",
      rawResponse: {},
    };
    const mp = buildMpClientMock({
      fetchPayment: vi.fn().mockResolvedValue(payment),
    });
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    const result = await service.processMercadoPagoWebhook(buildEvent());

    expect(result.outcome).toBe("subscription_not_found");
    expect(tx.subscription.update).not.toHaveBeenCalled();
  });

  it("eventos no-payment se ignoran sin fetchear", async () => {
    const { tx, prisma } = buildPrismaMock();
    tx.billingEvent.create.mockResolvedValue({ id: "be_1", outcome: null });
    const fetchPayment = vi.fn();
    const mp = buildMpClientMock({ fetchPayment });
    const service = new BillingService(prisma, configStub(), mp, loggerStub());

    const event = {
      headers: { "x-signature": "ts=1,v1=a", "x-request-id": "req_1" },
      body: { type: "merchant_order", data: { id: "mo_1" }, id: "evt_2" },
      rawBody: "{}",
    };

    const result = await service.processMercadoPagoWebhook(event);

    expect(result.outcome).toBe("ignored_non_payment");
    expect(fetchPayment).not.toHaveBeenCalled();
  });
});
