import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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
    if (!reference || reference.product !== "apoyoai") {
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
        OR: [{ externalReference }, { familyId: reference.familyId, product: "APOYOAI" }],
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
        familyId: string;
        planCode: string;
      }
    | undefined {
    const [product, familyId, planCode] = reference.split(":");
    if (!product || !familyId || !planCode) {
      return undefined;
    }
    return { product: product.toLowerCase(), familyId, planCode };
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
}
