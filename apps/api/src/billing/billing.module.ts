import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller.js";
import { BillingService } from "./billing.service.js";
import { MercadoPagoClient } from "./mercadopago.client.js";

@Module({
  controllers: [BillingController],
  providers: [BillingService, MercadoPagoClient],
  exports: [BillingService],
})
export class BillingModule {}
