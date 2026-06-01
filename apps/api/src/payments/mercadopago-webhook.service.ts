import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@educai/database";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "../prisma/tenant-context.service.js";
import { isValidMercadoPagoSignature } from "./mercadopago-signature.js";
import { resolveNextPlan, validatePaidAmount } from "./plan-catalog.js";

type QueryParams = Record<string, string | string[] | undefined>;

interface MercadoPagoWebhookBody {
  action?: string;
  data?: {
    id?: string | number;
  };
  id?: string | number;
  type?: string;
}

interface MercadoPagoPayment {
  id: string | number;
  external_reference?: string | null;
  transaction_amount?: number;
  payer?: {
    id?: string | number;
    email?: string;
  };
  status?: string;
  status_detail?: string;
}

interface MercadoPagoWebhookInput {
  body: MercadoPagoWebhookBody;
  query: QueryParams;
  requestId?: string;
  signature?: string;
}

interface WebhookResult {
  received: boolean;
  processed: boolean;
  reason?: string;
  paymentId?: string;
  subscriptionId?: string;
  tenantId?: string | null;
  status?: string;
  [key: string]: unknown;
}

@Injectable()
export class MercadoPagoWebhookService {
  private supabase?: SupabaseClient;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async handleWebhook(input: MercadoPagoWebhookInput) {
    // El webhook no tiene sesión: localiza la suscripción/tenant del pago de forma
    // cross-tenant a propósito (gated por firma HMAC de MercadoPago). Corre como
    // operación de sistema para no quedar bloqueado por el tenant-scoping fail-closed.
    return this.tenantContext.runAsSystem(() => this.processWebhook(input));
  }

  private async processWebhook(input: MercadoPagoWebhookInput): Promise<WebhookResult> {
    const dataIdFromQuery = this.firstQueryValue(input.query["data.id"]);
    this.assertValidSignature({
      dataId: dataIdFromQuery,
      requestId: input.requestId,
      signature: input.signature,
    });

    const eventType = input.body.type ?? this.firstQueryValue(input.query.type);
    const paymentId = dataIdFromQuery ?? this.extractPaymentId(input.body, input.query);
    if (eventType && eventType !== "payment") {
      return { received: true, processed: false, reason: "unsupported_event_type", eventType };
    }
    if (!paymentId) {
      return { received: true, processed: false, reason: "missing_payment_id" };
    }

    const payment = await this.fetchPayment(paymentId);

    // Idempotencia: reservamos el evento en BillingEvent (unique provider+providerEventId).
    // Si ya fue procesado en una entrega previa, no lo reprocesamos.
    const reservation = await this.reserveBillingEvent({
      providerEventId: this.providerEventId(input, paymentId, payment),
      eventType: eventType ?? "payment",
      status: payment.status ?? "received",
      payload: input.body,
    });
    if (reservation.alreadyDone) {
      return { received: true, processed: false, reason: "duplicate_event", paymentId };
    }

    const result = await this.applyPayment({ payment, paymentId });
    await this.completeBillingEvent(reservation.id, result);
    return result;
  }

  private async applyPayment(args: {
    payment: MercadoPagoPayment;
    paymentId: string;
  }): Promise<WebhookResult> {
    const { payment, paymentId } = args;
    const externalReference = payment.external_reference?.trim();
    if (!externalReference) {
      return { received: true, processed: false, reason: "missing_external_reference", paymentId };
    }

    const reference = this.parseExternalReference(externalReference);
    if (!reference) {
      return {
        received: true,
        processed: false,
        reason: "unsupported_external_reference",
        externalReference,
        paymentId,
      };
    }

    if (reference.product === "educai") {
      return this.handleEducAiPayment({ externalReference, payment, paymentId, reference });
    }

    if (reference.product !== "apoyoai") {
      return {
        received: true,
        processed: false,
        reason: "unsupported_external_reference",
        externalReference,
        paymentId,
      };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        provider: "mercadopago",
        OR: [{ externalReference }, { familyId: reference.resourceId, product: "APOYOAI" }],
      },
    });

    if (!subscription) {
      this.logger.warn(
        { externalReference, paymentId },
        "mercadopago.webhook.subscription_not_found",
      );
      return { received: true, processed: false, reason: "subscription_not_found", paymentId };
    }

    const mappedStatus = this.mapPaymentStatus(payment.status);
    if (!mappedStatus) {
      return {
        received: true,
        processed: false,
        reason: "unsupported_payment_status",
        paymentId,
        status: payment.status,
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
      };
    }

    // Validación de monto: NO confiamos en el planCode del external_reference para
    // activar; verificamos que lo cobrado cubra el precio real del plan. Evita pagar
    // barato por un plan caro. Solo al activar (los estados no-ACTIVE no otorgan acceso).
    if (mappedStatus === "ACTIVE") {
      const amount = validatePaidAmount("apoyoai", reference.planCode, payment.transaction_amount);
      if (!amount.ok) {
        this.logger.warn(
          {
            externalReference,
            paymentId,
            planCode: reference.planCode,
            expected: amount.expected,
            paid: amount.paid,
            reason: amount.reason,
          },
          "mercadopago.webhook.amount_mismatch",
        );
        return {
          received: true,
          processed: false,
          reason: "amount_mismatch",
          expected: amount.expected,
          paid: amount.paid,
          paymentId,
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
        };
      }
    }

    const now = new Date();
    const currentPeriodEnd =
      mappedStatus === "ACTIVE" && subscription.currentPeriodEnd <= now
        ? this.addDays(now, 30)
        : subscription.currentPeriodEnd;

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: mappedStatus,
          providerSubId: String(payment.id),
          providerCustomerId: payment.payer?.id
            ? String(payment.payer.id)
            : subscription.providerCustomerId,
          externalReference,
          planCode: reference.planCode,
          currentPeriodEnd,
          canceledAt: mappedStatus === "CANCELED" ? now : null,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: saved.tenantId,
          action: "mercadopago.webhook.payment.updated",
          entity: "Subscription",
          entityId: saved.id,
          metadata: {
            paymentId: String(payment.id),
            status: payment.status,
            statusDetail: payment.status_detail,
            externalReference,
          },
        },
      });

      return saved;
    });

    return {
      received: true,
      processed: true,
      paymentId: String(payment.id),
      subscriptionId: updated.id,
      status: updated.status,
      tenantId: updated.tenantId,
    };
  }

  private providerEventId(
    input: MercadoPagoWebhookInput,
    paymentId: string,
    payment: MercadoPagoPayment,
  ): string {
    const fromBody = input.body.id != null ? String(input.body.id) : undefined;
    const fromQuery = this.firstQueryValue(input.query.id);
    // Fallback: paymentId + status, así un cambio de estado (pending -> approved) se
    // procesa como evento distinto, pero una re-entrega del mismo evento se deduplica.
    return fromBody ?? fromQuery ?? `${paymentId}:${payment.status ?? "unknown"}`;
  }

  private async reserveBillingEvent(args: {
    providerEventId: string;
    eventType: string;
    status: string;
    payload: unknown;
  }): Promise<{ id: string; alreadyDone: boolean }> {
    try {
      const created = await this.prisma.billingEvent.create({
        data: {
          id: randomUUID(),
          provider: "mercadopago",
          providerEventId: args.providerEventId,
          eventType: args.eventType,
          status: args.status,
          payload: args.payload ?? {},
        },
      });
      return { id: created.id, alreadyDone: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.prisma.billingEvent.findUnique({
          where: {
            provider_providerEventId: {
              provider: "mercadopago",
              providerEventId: args.providerEventId,
            },
          },
        });
        if (existing) {
          // Si el evento previo ya quedó procesado, se deduplica; si no (fallo transitorio),
          // se permite reprocesar reusando la misma fila.
          return { id: existing.id, alreadyDone: existing.processedAt != null };
        }
      }
      throw error;
    }
  }

  private async completeBillingEvent(id: string, result: WebhookResult): Promise<void> {
    // subscription_not_found es transitorio (la suscripción puede aparecer en un retry):
    // no lo marcamos como procesado, para permitir reprocesar.
    const retryable = result.reason === "subscription_not_found";
    await this.prisma.billingEvent.update({
      where: { id },
      data: {
        processedAt: retryable ? null : new Date(),
        outcome: result.processed ? "processed" : (result.reason ?? "ignored"),
        tenantId: typeof result.tenantId === "string" ? result.tenantId : undefined,
        subscriptionId:
          typeof result.subscriptionId === "string" ? result.subscriptionId : undefined,
      },
    });
  }

  private async handleEducAiPayment(input: {
    externalReference: string;
    payment: MercadoPagoPayment;
    paymentId: string;
    reference: {
      product: string;
      resourceId: string;
      planCode: string;
    };
  }): Promise<WebhookResult> {
    const mappedStatus = this.mapPaymentStatus(input.payment.status);
    if (!mappedStatus) {
      return {
        received: true,
        processed: false,
        reason: "unsupported_payment_status",
        paymentId: input.paymentId,
        status: input.payment.status,
      };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.reference.resourceId },
      select: {
        id: true,
        metadata: true,
        school: {
          select: {
            id: true,
            settings: true,
          },
        },
        users: {
          where: {
            deletedAt: null,
            role: {
              in: ["TEACHER", "SCHOOL_ADMIN"],
            },
          },
          select: {
            email: true,
            role: true,
            teacher: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!tenant || !tenant.school) {
      this.logger.warn(
        { externalReference: input.externalReference, paymentId: input.paymentId },
        "mercadopago.webhook.educai_tenant_not_found",
      );
      return { received: true, processed: false, reason: "educai_tenant_not_found" };
    }

    // Validación de monto al activar: lo cobrado debe cubrir el precio del plan.
    if (mappedStatus === "ACTIVE") {
      const amount = validatePaidAmount(
        "educai",
        input.reference.planCode,
        input.payment.transaction_amount,
      );
      if (!amount.ok) {
        this.logger.warn(
          {
            externalReference: input.externalReference,
            paymentId: input.paymentId,
            planCode: input.reference.planCode,
            expected: amount.expected,
            paid: amount.paid,
            reason: amount.reason,
          },
          "mercadopago.webhook.amount_mismatch",
        );
        return {
          received: true,
          processed: false,
          reason: "amount_mismatch",
          expected: amount.expected,
          paid: amount.paid,
          paymentId: input.paymentId,
          tenantId: tenant.id,
        };
      }
    }

    const now = new Date();
    // Estado terminal vs transitorio:
    // - ACTIVE  -> activa el plan pagado.
    // - CANCELED (refund/chargeback/cancelación) -> degrada a free.
    // - PAST_DUE (pending/authorized/rejected) -> NO degradar: conserva el plan vigente.
    //   Esto evita que una notificación tardía (MP no garantiza orden) deje sin acceso a
    //   un cliente que ya pagó.
    const currentMetadata = this.asRecord(tenant.metadata) ?? {};
    const currentPlan = typeof currentMetadata.plan === "string" ? currentMetadata.plan : "free";
    const nextPlan = resolveNextPlan(mappedStatus, currentPlan, input.reference.planCode);
    const paymentStatus = this.paymentStatusLabel(mappedStatus);
    const billingState = {
      provider: "mercadopago",
      externalReference: input.externalReference,
      paymentId: String(input.payment.id),
      payerEmail: input.payment.payer?.email ?? null,
      payerId: input.payment.payer?.id ? String(input.payment.payer.id) : null,
      status: input.payment.status ?? null,
      statusDetail: input.payment.status_detail ?? null,
      approvedAt: mappedStatus === "ACTIVE" ? now.toISOString() : null,
      updatedAt: now.toISOString(),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          metadata: {
            ...(this.asRecord(tenant.metadata) ?? {}),
            product: "educai",
            plan: nextPlan,
            requestedPlan: input.reference.planCode,
            paymentStatus,
            billing: billingState,
          },
        },
      });

      await tx.school.update({
        where: { id: tenant.school!.id },
        data: {
          settings: {
            ...(this.asRecord(tenant.school!.settings) ?? {}),
            product: "educai",
            plan: nextPlan,
            requestedPlan: input.reference.planCode,
            paymentStatus,
            billing: billingState,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "mercadopago.webhook.educai.payment.updated",
          entity: "Tenant",
          entityId: tenant.id,
          metadata: {
            paymentId: String(input.payment.id),
            status: input.payment.status,
            statusDetail: input.payment.status_detail,
            externalReference: input.externalReference,
            plan: nextPlan,
            requestedPlan: input.reference.planCode,
            paymentStatus,
          },
        },
      });
    });

    // Sincronización de claims en Supabase. La DB ya quedó commiteada como fuente de
    // verdad del plan; acá propagamos a los JWT. Intentamos TODOS los usuarios (no
    // abortamos en el primero que falla) y dejamos un AuditLog durable de los que
    // fallaron para poder reconciliar aunque MercadoPago agote los reintentos.
    const failedSyncEmails: string[] = [];
    for (const user of tenant.users) {
      try {
        await this.updateSupabaseUserPlanByEmail(user.email, {
          role: user.role,
          tenantId: tenant.id,
          schoolId: tenant.school.id,
          teacherId: user.teacher?.id,
          product: "educai",
          plan: nextPlan,
          requestedPlan: input.reference.planCode,
          paymentStatus,
        });
      } catch (error) {
        failedSyncEmails.push(user.email);
        this.logger.warn(
          {
            tenantId: tenant.id,
            errorMessage: error instanceof Error ? error.message : "unknown",
          },
          "mercadopago.webhook.supabase_sync_failed",
        );
      }
    }

    if (failedSyncEmails.length > 0) {
      // Registro durable para reconciliación (no incluye PII más allá del recuento).
      await this.recordSupabaseSyncFailure(tenant.id, nextPlan, paymentStatus, failedSyncEmails);
      // Relanzamos: MercadoPago reintenta y, como el BillingEvent no se marca procesado,
      // el evento se reprocesa hasta que la sincronización quede consistente.
      throw new ServiceUnavailableException(
        `No se pudo sincronizar el plan en Supabase para ${failedSyncEmails.length} usuario(s) del tenant ${tenant.id}`,
      );
    }

    return {
      received: true,
      processed: true,
      paymentId: String(input.payment.id),
      tenantId: tenant.id,
      plan: nextPlan,
      paymentStatus,
    };
  }

  private async recordSupabaseSyncFailure(
    tenantId: string,
    plan: string,
    paymentStatus: string,
    failedEmails: string[],
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: "mercadopago.webhook.supabase_sync_failed",
          entity: "Tenant",
          entityId: tenantId,
          metadata: {
            plan,
            paymentStatus,
            failedUserCount: failedEmails.length,
            // emails redactados por el logger; aquí los guardamos para reconciliación operativa.
            failedEmails,
          },
        },
      });
    } catch (error) {
      // El audit trail es best-effort: si falla, ya quedó el log estructurado.
      this.logger.warn(
        { tenantId, errorMessage: error instanceof Error ? error.message : "unknown" },
        "mercadopago.webhook.supabase_sync_failure_audit_failed",
      );
    }
  }

  private assertValidSignature(input: {
    dataId?: string;
    requestId?: string;
    signature?: string;
  }): void {
    const secret = this.config.get<string>("MERCADOPAGO_WEBHOOK_SECRET")?.trim();
    if (!secret) {
      throw new ServiceUnavailableException("MERCADOPAGO_WEBHOOK_SECRET no esta configurado");
    }
    if (!input.signature || !input.requestId) {
      throw new UnauthorizedException("Falta firma de Mercado Pago");
    }
    if (!input.dataId) {
      // Sin data.id firmado no podemos atar la firma al pago: rechazamos.
      this.logger.warn({ reason: "missing_signed_data_id" }, "mercadopago.signature.invalid");
      throw new UnauthorizedException("Falta data.id firmado de Mercado Pago");
    }

    const valid = isValidMercadoPagoSignature({
      dataId: input.dataId,
      requestId: input.requestId,
      secret,
      signature: input.signature,
      toleranceMs: this.signatureToleranceMs(),
    });
    if (!valid) {
      this.logger.warn({ hasSignature: true }, "mercadopago.signature.invalid");
      throw new UnauthorizedException("Firma de Mercado Pago invalida");
    }
  }

  private signatureToleranceMs(): number | undefined {
    const raw = this.config.get<string>("MERCADOPAGO_SIGNATURE_TOLERANCE_MS")?.trim();
    if (!raw) {
      return undefined;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }

  private async fetchPayment(paymentId: string): Promise<MercadoPagoPayment> {
    const accessToken = this.config.get<string>("MERCADOPAGO_ACCESS_TOKEN")?.trim();
    if (!accessToken) {
      throw new ServiceUnavailableException("MERCADOPAGO_ACCESS_TOKEN no esta configurado");
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      this.logger.warn({ paymentId, status: response.status }, "mercadopago.payment.fetch_failed");
      throw new ServiceUnavailableException("No se pudo consultar el pago en Mercado Pago");
    }

    return (await response.json()) as MercadoPagoPayment;
  }

  private extractPaymentId(body: MercadoPagoWebhookBody, query: QueryParams): string | undefined {
    return (
      this.firstQueryValue(query.id) ??
      (body.data?.id ? String(body.data.id) : undefined) ??
      (body.id ? String(body.id) : undefined)
    );
  }

  private firstQueryValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private parseExternalReference(reference: string):
    | {
        product: string;
        resourceId: string;
        planCode: string;
      }
    | undefined {
    const [product, resourceId, planCode] = reference.split(":");
    if (!product || !resourceId || !planCode) {
      return undefined;
    }
    return { product: product.toLowerCase(), resourceId, planCode };
  }

  private mapPaymentStatus(
    status: string | undefined,
  ): "ACTIVE" | "PAST_DUE" | "CANCELED" | undefined {
    switch (status) {
      case "approved":
        return "ACTIVE";
      case "pending":
      case "in_process":
      case "authorized":
      case "rejected":
        return "PAST_DUE";
      case "cancelled":
      case "refunded":
      case "charged_back":
        return "CANCELED";
      default:
        return undefined;
    }
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private paymentStatusLabel(status: "ACTIVE" | "PAST_DUE" | "CANCELED") {
    switch (status) {
      case "ACTIVE":
        return "active";
      case "PAST_DUE":
        return "pending";
      case "CANCELED":
        return "canceled";
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private getSupabase(): SupabaseClient {
    if (this.supabase) {
      return this.supabase;
    }

    const url = this.config.get<string>("SUPABASE_URL")?.trim();
    const secretKey =
      this.config.get<string>("SUPABASE_SECRET_KEY")?.trim() ??
      this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!url || !secretKey) {
      throw new ServiceUnavailableException("Supabase admin no esta configurado");
    }

    this.supabase = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.supabase;
  }

  private async updateSupabaseUserPlanByEmail(
    email: string,
    appMetadata: {
      role: string;
      tenantId: string;
      schoolId: string;
      teacherId?: string;
      product: string;
      plan: string;
      requestedPlan: string;
      paymentStatus: string;
    },
  ) {
    const user = await this.findSupabaseUserByEmail(email);
    if (!user) {
      this.logger.warn({ email }, "mercadopago.webhook.supabase_user_not_found");
      return;
    }

    const nextMetadata: Record<string, string> = {
      role: appMetadata.role,
      tenantId: appMetadata.tenantId,
      schoolId: appMetadata.schoolId,
      product: appMetadata.product,
      plan: appMetadata.plan,
      requestedPlan: appMetadata.requestedPlan,
      paymentStatus: appMetadata.paymentStatus,
    };
    if (appMetadata.teacherId) {
      nextMetadata.teacherId = appMetadata.teacherId;
    }

    const { error } = await this.getSupabase().auth.admin.updateUserById(user.id, {
      app_metadata: nextMetadata,
    });
    if (error) {
      throw new ServiceUnavailableException(
        `No se pudo actualizar metadata de Supabase: ${error.message}`,
      );
    }
  }

  private async findSupabaseUserByEmail(email: string) {
    let page = 1;

    while (true) {
      const { data, error } = await this.getSupabase().auth.admin.listUsers({
        page,
        perPage: 200,
      });

      if (error) {
        throw new ServiceUnavailableException(
          `No se pudo listar usuarios de Supabase: ${error.message}`,
        );
      }

      const user = data.users.find(
        (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
      );
      if (user) {
        return user;
      }

      if (data.users.length < 200) {
        return null;
      }

      page += 1;
    }
  }
}
