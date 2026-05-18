import { Body, Controller, Headers, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { MercadoPagoWebhookService } from "./mercadopago-webhook.service.js";

type QueryParams = Record<string, string | string[] | undefined>;

@ApiTags("payments")
@Controller("webhooks/mercadopago")
export class MercadoPagoWebhookController {
  constructor(private readonly webhook: MercadoPagoWebhookService) {}

  @Post()
  @ApiOkResponse({ description: "Webhook de Mercado Pago recibido" })
  handle(
    @Body() body: Record<string, unknown>,
    @Query() query: QueryParams,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-signature") signature?: string,
  ) {
    return this.webhook.handleWebhook({ body, query, requestId, signature });
  }
}
