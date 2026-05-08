import { HttpException, HttpStatus } from "@nestjs/common";

export class BillingNotConfiguredError extends HttpException {
  constructor() {
    super(
      {
        code: "BILLING_NOT_CONFIGURED",
        message: "Billing deshabilitado: falta MERCADOPAGO_ACCESS_TOKEN",
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class BillingFamilyScopeError extends HttpException {
  constructor() {
    super(
      {
        code: "BILLING_FAMILY_SCOPE_DENIED",
        message: "No tenes permiso para crear preferencias de esta familia",
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class BillingPlanInvalidError extends HttpException {
  constructor(plan: string) {
    super(
      {
        code: "BILLING_PLAN_INVALID",
        message: `Plan ${plan} no esta configurado en variables de entorno`,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class BillingWebhookSignatureInvalidError extends HttpException {
  constructor() {
    super(
      {
        code: "BILLING_WEBHOOK_SIGNATURE_INVALID",
        message: "Firma de webhook MercadoPago invalida",
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class BillingWebhookSecretMissingError extends HttpException {
  constructor() {
    super(
      {
        code: "BILLING_WEBHOOK_SECRET_MISSING",
        message:
          "MERCADOPAGO_WEBHOOK_SECRET no configurado: el webhook esta deshabilitado en produccion",
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
