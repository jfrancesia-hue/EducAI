import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { isValidMercadoPagoSignature } from "./mercadopago-signature.js";

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

@Injectable()
export class MercadoPagoWebhookService {
  private supabase?: SupabaseClient;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
  ) {}

  async handleWebhook(input: MercadoPagoWebhookInput) {
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
      };
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
    };
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
  }) {
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

    const now = new Date();
    const nextPlan = mappedStatus === "ACTIVE" ? input.reference.planCode : "free";
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

    for (const user of tenant.users) {
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

    const valid = isValidMercadoPagoSignature({
      dataId: input.dataId,
      requestId: input.requestId,
      secret,
      signature: input.signature,
    });
    if (!valid) {
      this.logger.warn({ hasSignature: true }, "mercadopago.signature.invalid");
      throw new UnauthorizedException("Firma de Mercado Pago invalida");
    }
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
