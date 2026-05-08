import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@educai/database";
import { nanoid } from "nanoid";
import type { Logger } from "pino";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { isElevatedRole } from "../auth/types.js";
import {
  BillingFamilyScopeError,
  BillingNotConfiguredError,
  BillingPlanInvalidError,
  BillingWebhookSecretMissingError,
  BillingWebhookSignatureInvalidError,
} from "./errors/billing.errors.js";
import { MercadoPagoClient } from "./mercadopago.client.js";
import type { BillingPlan } from "./dto/create-preference.dto.js";

const PROVIDER_MERCADOPAGO = "mercadopago";

interface PlanConfig {
  title: string;
  amountARS: number;
}

const DEFAULT_PLAN_PRICES_ARS: Record<BillingPlan, number> = {
  BASIC: 4500,
  PREMIUM: 9000,
  FAMILY: 14000,
};

@Injectable()
export class BillingService {
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mercadopago: MercadoPagoClient,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "BillingService" });
  }

  async createPreference(
    plan: BillingPlan,
    familyId: string,
    user: AuthenticatedUser,
  ): Promise<{ preferenceId: string; checkoutUrl: string }> {
    if (!this.mercadopago.isConfigured()) {
      throw new BillingNotConfiguredError();
    }

    if (!isElevatedRole(user) && user.familyId !== familyId) {
      throw new BillingFamilyScopeError();
    }

    const planConfig = this.resolvePlan(plan);
    const externalReference = `${user.tenantId}:${familyId}:${plan}:${nanoid(8)}`;

    const publicAppUrl = this.config.get<string>("PUBLIC_APP_URL") ?? "http://localhost:3000";
    const apiPublicUrl = this.config.get<string>("API_PUBLIC_URL") ?? "";

    const result = await this.mercadopago.createPreference({
      externalReference,
      items: [
        {
          title: planConfig.title,
          quantity: 1,
          unit_price: planConfig.amountARS,
          currency_id: "ARS",
        },
      ],
      successUrl: `${publicAppUrl}/billing/success`,
      failureUrl: `${publicAppUrl}/billing/failure`,
      pendingUrl: `${publicAppUrl}/billing/pending`,
      notificationUrl: apiPublicUrl
        ? `${apiPublicUrl}/api/v1/billing/webhook/mercadopago`
        : undefined,
    });

    await this.prisma.withUser(user, (tx) =>
      tx.subscription.upsert({
        where: { familyId },
        create: {
          tenantId: user.tenantId,
          familyId,
          plan,
          status: "PAST_DUE",
          provider: PROVIDER_MERCADOPAGO,
          externalReference,
          currentPeriodEnd: new Date(),
        },
        update: {
          plan,
          provider: PROVIDER_MERCADOPAGO,
          externalReference,
        },
      }),
    );

    this.log.info(
      {
        tenantId: user.tenantId,
        familyId,
        plan,
        externalReference,
        preferenceId: result.id,
      },
      "billing.preference_created",
    );

    return {
      preferenceId: result.id,
      checkoutUrl: result.initPoint,
    };
  }

  async getActiveSubscription(familyId: string, user: AuthenticatedUser) {
    if (!isElevatedRole(user) && user.familyId !== familyId) {
      throw new BillingFamilyScopeError();
    }
    return this.prisma.withUser(user, (tx) => tx.subscription.findUnique({ where: { familyId } }));
  }

  /**
   * Procesa una notificacion de MercadoPago.
   *
   * Flujo:
   *   1. Verifica firma (fail-closed en produccion).
   *   2. Persiste BillingEvent (idempotente por provider+providerEventId).
   *   3. Si es payment, consulta /v1/payments/:id y actualiza Subscription.
   */
  async processMercadoPagoWebhook(args: {
    headers: Record<string, string | string[] | undefined>;
    body: Record<string, unknown>;
    rawBody: string;
  }): Promise<{ outcome: string }> {
    const isProduction = process.env.NODE_ENV === "production";
    const secret = this.config.get<string>("MERCADOPAGO_WEBHOOK_SECRET");
    const signature = pickHeader(args.headers, "x-signature");
    const requestId = pickHeader(args.headers, "x-request-id") ?? "";

    if (!secret) {
      if (isProduction) {
        throw new BillingWebhookSecretMissingError();
      }
      this.log.warn({ feature: "mercadopago-webhook" }, "billing.webhook.signature_skipped_dev");
    }

    const dataIdRaw = (args.body.data as { id?: unknown } | undefined)?.id ?? args.body.id;
    let dataId = "";
    if (typeof dataIdRaw === "string") {
      dataId = dataIdRaw;
    } else if (typeof dataIdRaw === "number") {
      dataId = String(dataIdRaw);
    }

    if (secret) {
      if (!signature || !dataId) {
        throw new BillingWebhookSignatureInvalidError();
      }
      const valid = this.mercadopago.verifyWebhookSignature({
        signature,
        requestId,
        dataId,
        secret,
      });
      if (!valid) {
        throw new BillingWebhookSignatureInvalidError();
      }
    }

    const typeRaw = args.body.type ?? args.body.topic;
    const eventType = typeof typeRaw === "string" ? typeRaw : "unknown";
    const idRaw = args.body.id;
    const providerEventId =
      typeof idRaw === "string" ? idRaw : `${eventType}-${dataId}-${requestId}`;

    const billingEvent = await this.upsertBillingEvent({
      provider: PROVIDER_MERCADOPAGO,
      providerEventId,
      eventType,
      status: "received",
      payload: args.body,
    });

    if (billingEvent.outcome) {
      this.log.info(
        { providerEventId, previousOutcome: billingEvent.outcome },
        "billing.webhook.duplicate_ignored",
      );
      return { outcome: billingEvent.outcome };
    }

    if (eventType !== "payment" && !eventType.startsWith("payment")) {
      const outcome = "ignored_non_payment";
      await this.markEventProcessed(billingEvent.id, outcome);
      return { outcome };
    }

    if (!dataId) {
      const outcome = "ignored_missing_data_id";
      await this.markEventProcessed(billingEvent.id, outcome);
      return { outcome };
    }

    return this.applyPayment(billingEvent.id, dataId);
  }

  private async applyPayment(billingEventId: string, paymentId: string) {
    let payment;
    try {
      payment = await this.mercadopago.fetchPayment(paymentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markEventProcessed(billingEventId, "fetch_payment_failed", message);
      throw error;
    }

    if (!payment.externalReference) {
      const outcome = "ignored_missing_external_reference";
      await this.markEventProcessed(billingEventId, outcome);
      return { outcome };
    }

    const subscription = await this.prisma.withServiceRole((tx) =>
      tx.subscription.findFirst({
        where: { externalReference: payment.externalReference },
      }),
    );

    if (!subscription) {
      const outcome = "subscription_not_found";
      await this.markEventProcessed(billingEventId, outcome);
      return { outcome };
    }

    if (payment.status === "approved") {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await this.prisma.withServiceRole((tx) =>
        tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            providerSubId: payment.id,
            currentPeriodEnd: periodEnd,
            canceledAt: null,
          },
        }),
      );
      const outcome = "subscription_activated";
      await this.markEventProcessed(billingEventId, outcome, undefined, subscription.id);
      this.log.info(
        { subscriptionId: subscription.id, paymentId, plan: subscription.plan },
        "billing.subscription_activated",
      );
      return { outcome };
    }

    if (payment.status === "rejected" || payment.status === "cancelled") {
      await this.prisma.withServiceRole((tx) =>
        tx.subscription.update({
          where: { id: subscription.id },
          data: { status: "PAST_DUE", providerSubId: payment.id },
        }),
      );
      const outcome = `payment_${payment.status}`;
      await this.markEventProcessed(billingEventId, outcome, undefined, subscription.id);
      return { outcome };
    }

    const outcome = `payment_${payment.status}`;
    await this.markEventProcessed(billingEventId, outcome, undefined, subscription.id);
    return { outcome };
  }

  private async upsertBillingEvent(args: {
    provider: string;
    providerEventId: string;
    eventType: string;
    status: string;
    payload: Record<string, unknown>;
  }) {
    try {
      return await this.prisma.withServiceRole((tx) =>
        tx.billingEvent.create({
          data: {
            provider: args.provider,
            providerEventId: args.providerEventId,
            eventType: args.eventType,
            status: args.status,
            payload: args.payload as Prisma.InputJsonValue,
          },
        }),
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.prisma.withServiceRole((tx) =>
          tx.billingEvent.findUnique({
            where: {
              provider_providerEventId: {
                provider: args.provider,
                providerEventId: args.providerEventId,
              },
            },
          }),
        );
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  private async markEventProcessed(
    eventId: string,
    outcome: string,
    errorMessage?: string,
    subscriptionId?: string,
  ): Promise<void> {
    await this.prisma.withServiceRole((tx) =>
      tx.billingEvent.update({
        where: { id: eventId },
        data: {
          processedAt: new Date(),
          outcome,
          errorMessage: errorMessage ?? null,
          subscriptionId: subscriptionId ?? undefined,
        },
      }),
    );
  }

  private resolvePlan(plan: BillingPlan): PlanConfig {
    const priceFromEnv = this.config.get<string>(`MERCADOPAGO_PRICE_${plan}`);
    const amountARS = priceFromEnv ? Number(priceFromEnv) : DEFAULT_PLAN_PRICES_ARS[plan];

    if (!amountARS || Number.isNaN(amountARS)) {
      throw new BillingPlanInvalidError(plan);
    }

    return {
      title: `EducAI ${plan}`,
      amountARS,
    };
  }
}

function pickHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const raw = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === "string" ? raw : undefined;
}
