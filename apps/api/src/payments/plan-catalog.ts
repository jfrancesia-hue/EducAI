// Fuente única de precios de los planes pagos (ARS, pesos enteros = unit_price de
// MercadoPago). Lo usan el onboarding (al crear la preferencia de pago) y el webhook
// (al validar el monto cobrado). Tener un solo lugar evita que se desincronicen y
// que el webhook rechace pagos legítimos o acepte montos incorrectos.

export const APOYOAI_PRICES_ARS = {
  basico: 14900,
  plus: 34900,
  familiar: 69900,
  intensivo: 119900,
} as const;

export const EDUCAI_PRICES_ARS = {
  "docente-individual": 9900,
  "docente-pro": 24900,
} as const;

/** Precio esperado en ARS para un (producto, planCode). null si es free o desconocido. */
export function getExpectedPriceArs(product: string, planCode: string): number | null {
  if (product === "apoyoai") {
    return (APOYOAI_PRICES_ARS as Record<string, number>)[planCode] ?? null;
  }
  if (product === "educai") {
    return (EDUCAI_PRICES_ARS as Record<string, number>)[planCode] ?? null;
  }
  return null;
}

export interface AmountCheck {
  ok: boolean;
  expected: number | null;
  paid: number | null;
  reason?: "below_expected" | "missing_amount";
}

/**
 * Valida que el monto pagado cubra el precio esperado del plan.
 *  - Sin precio esperado (free o desconocido) → ok: no hay qué validar.
 *  - Con precio esperado pero sin monto pagado → NO ok (no podemos confiar).
 *  - Monto pagado < esperado → NO ok (posible fraude: pagar barato por plan caro).
 *  - Monto pagado >= esperado → ok (tolera sobrepago / redondeo).
 */
export function validatePaidAmount(
  product: string,
  planCode: string,
  paidAmount: number | null | undefined,
): AmountCheck {
  const expected = getExpectedPriceArs(product, planCode);
  if (expected === null) {
    return { ok: true, expected: null, paid: paidAmount ?? null };
  }
  if (paidAmount === null || paidAmount === undefined || Number.isNaN(paidAmount)) {
    return { ok: false, expected, paid: null, reason: "missing_amount" };
  }
  if (paidAmount < expected) {
    return { ok: false, expected, paid: paidAmount, reason: "below_expected" };
  }
  return { ok: true, expected, paid: paidAmount };
}

export type MappedPaymentStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

/**
 * Decide el plan resultante de un evento de pago, evitando degradar acceso ya pagado:
 *  - ACTIVE   → activa el plan solicitado.
 *  - CANCELED → degrada a "free" (refund/chargeback/cancelación: estado terminal).
 *  - PAST_DUE → conserva el plan vigente (evento transitorio o notificación tardía;
 *               MercadoPago no garantiza orden de entrega).
 */
export function resolveNextPlan(
  mappedStatus: MappedPaymentStatus,
  currentPlan: string,
  requestedPlanCode: string,
): string {
  switch (mappedStatus) {
    case "ACTIVE":
      return requestedPlanCode;
    case "CANCELED":
      return "free";
    case "PAST_DUE":
      return currentPlan && currentPlan.trim() ? currentPlan.trim() : "free";
  }
}
