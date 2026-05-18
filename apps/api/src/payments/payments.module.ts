import { Module } from "@nestjs/common";

import { LoggerModule } from "../common/logger/logger.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { MercadoPagoWebhookController } from "./mercadopago-webhook.controller.js";
import { MercadoPagoWebhookService } from "./mercadopago-webhook.service.js";

@Module({
  imports: [LoggerModule, PrismaModule],
  controllers: [MercadoPagoWebhookController],
  providers: [MercadoPagoWebhookService],
})
export class PaymentsModule {}
