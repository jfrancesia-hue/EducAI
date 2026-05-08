import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import type { Logger } from "pino";
import { AppLogger } from "../common/logger/app-logger.service.js";

export interface PreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface CreatePreferenceArgs {
  externalReference: string;
  payerEmail?: string;
  items: PreferenceItem[];
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl?: string;
}

export interface PreferenceResult {
  id: string;
  initPoint: string;
  sandboxInitPoint?: string;
}

export interface PaymentDetails {
  id: string;
  status: string;
  externalReference?: string;
  payerEmail?: string;
  amount?: number;
  currency?: string;
  rawResponse: Record<string, unknown>;
}

@Injectable()
export class MercadoPagoClient {
  private readonly log: Logger;
  private client: MercadoPagoConfig | null = null;

  constructor(
    private readonly config: ConfigService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "MercadoPagoClient" });
  }

  isConfigured(): boolean {
    return Boolean(this.config.get<string>("MERCADOPAGO_ACCESS_TOKEN"));
  }

  async createPreference(args: CreatePreferenceArgs): Promise<PreferenceResult> {
    const client = this.getClient();
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        external_reference: args.externalReference,
        items: args.items.map((item, index) => ({
          id: `item_${index + 1}`,
          ...item,
        })),
        payer: args.payerEmail ? { email: args.payerEmail } : undefined,
        back_urls: {
          success: args.successUrl,
          failure: args.failureUrl,
          pending: args.pendingUrl,
        },
        auto_return: "approved",
        notification_url: args.notificationUrl,
      },
    });

    if (!response.id || !response.init_point) {
      throw new Error("MercadoPago no retorno id o init_point");
    }

    return {
      id: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point ?? undefined,
    };
  }

  async fetchPayment(paymentId: string): Promise<PaymentDetails> {
    const client = this.getClient();
    const payment = new Payment(client);
    const raw = (await payment.get({ id: paymentId })) as unknown;
    const result = (raw ?? {}) as Record<string, unknown>;

    const idRaw = result.id;
    const statusRaw = result.status;
    return {
      id: typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : paymentId,
      status: typeof statusRaw === "string" ? statusRaw : "unknown",
      externalReference:
        typeof result.external_reference === "string" ? result.external_reference : undefined,
      payerEmail: this.extractPayerEmail(result),
      amount: typeof result.transaction_amount === "number" ? result.transaction_amount : undefined,
      currency: typeof result.currency_id === "string" ? result.currency_id : undefined,
      rawResponse: result,
    };
  }

  /**
   * Verifica el header `x-signature` de MercadoPago.
   *
   * MP envia "ts=<timestamp>,v1=<hash>". El hash es HMAC-SHA256 sobre:
   *   id:<dataId>;request-id:<requestId>;ts:<ts>;
   * con el secret configurado en el panel de webhooks.
   */
  verifyWebhookSignature(args: {
    signature: string;
    requestId: string;
    dataId: string;
    secret: string;
  }): boolean {
    const parts = args.signature.split(",");
    const ts = parts.find((p) => p.startsWith("ts="))?.slice(3);
    const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
    if (!ts || !v1) return false;

    const manifest = `id:${args.dataId};request-id:${args.requestId};ts:${ts};`;
    const expected = createHmac("sha256", args.secret).update(manifest).digest("hex");

    if (expected.length !== v1.length) return false;
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
    } catch {
      return false;
    }
  }

  private getClient(): MercadoPagoConfig {
    if (this.client) return this.client;
    const accessToken = this.config.get<string>("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
    }
    this.client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    });
    return this.client;
  }

  private extractPayerEmail(result: Record<string, unknown>): string | undefined {
    const payer = result.payer;
    if (payer && typeof payer === "object" && "email" in payer) {
      const email = (payer as { email?: unknown }).email;
      return typeof email === "string" ? email : undefined;
    }
    return undefined;
  }
}
