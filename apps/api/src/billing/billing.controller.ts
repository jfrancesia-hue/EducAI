import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser } from "../auth/authenticated-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { Audited } from "../common/audit/audited.decorator.js";
import { BillingService } from "./billing.service.js";
import { CreatePreferenceDto } from "./dto/create-preference.dto.js";

@ApiTags("billing")
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("preference")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ description: "Preferencia MercadoPago creada" })
  @Audited({ action: "billing.preference_created", entity: "Subscription", skipEntityId: true })
  createPreference(@Body() dto: CreatePreferenceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.billing.createPreference(dto.plan, dto.familyId, user);
  }

  @Get("subscription/:familyId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: "Suscripcion activa de la familia" })
  @Audited({ action: "billing.subscription_read", entity: "Subscription" })
  getSubscription(@Param("familyId") familyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.billing.getActiveSubscription(familyId, user);
  }

  /**
   * Webhook de MercadoPago. Sin auth porque MP no envia Bearer; la
   * autenticacion del request se hace via x-signature contra
   * MERCADOPAGO_WEBHOOK_SECRET.
   */
  @Post("webhook/mercadopago")
  @HttpCode(200)
  @ApiOkResponse({ description: "Notificacion procesada" })
  async mercadopagoWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const rawBody = (request as Request & { rawBody?: string }).rawBody ?? JSON.stringify(body);
    const result = await this.billing.processMercadoPagoWebhook({
      headers,
      body,
      rawBody,
    });
    return { received: true, ...result };
  }
}
