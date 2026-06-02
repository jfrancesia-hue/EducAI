import { describe, expect, it } from "vitest";

import { getExpectedPriceArs, resolveNextPlan, validatePaidAmount } from "./plan-catalog.js";

describe("getExpectedPriceArs", () => {
  it("devuelve el precio de planes apoyoai y educai", () => {
    expect(getExpectedPriceArs("apoyoai", "plus")).toBe(34900);
    expect(getExpectedPriceArs("educai", "docente-pro")).toBe(24900);
  });

  it("devuelve null para free, plan desconocido o producto desconocido", () => {
    expect(getExpectedPriceArs("apoyoai", "free")).toBeNull();
    expect(getExpectedPriceArs("apoyoai", "no-existe")).toBeNull();
    expect(getExpectedPriceArs("otro", "plus")).toBeNull();
  });
});

describe("validatePaidAmount", () => {
  it("acepta pago igual al esperado", () => {
    expect(validatePaidAmount("apoyoai", "basico", 14900)).toMatchObject({ ok: true });
  });

  it("acepta sobrepago", () => {
    expect(validatePaidAmount("apoyoai", "basico", 20000).ok).toBe(true);
  });

  it("RECHAZA pago menor al esperado (fraude: barato por plan caro)", () => {
    const r = validatePaidAmount("apoyoai", "intensivo", 14900);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("below_expected");
    expect(r.expected).toBe(119900);
    expect(r.paid).toBe(14900);
  });

  it("RECHAZA si no vino el monto pagado y el plan tiene precio", () => {
    const r = validatePaidAmount("educai", "docente-individual", undefined);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("missing_amount");
  });

  it("acepta sin validar cuando el plan no tiene precio (free/desconocido)", () => {
    expect(validatePaidAmount("apoyoai", "free", null).ok).toBe(true);
    expect(validatePaidAmount("apoyoai", "free", 0).ok).toBe(true);
  });
});

describe("resolveNextPlan (no degradar acceso pagado)", () => {
  it("ACTIVE activa el plan solicitado", () => {
    expect(resolveNextPlan("ACTIVE", "free", "docente-pro")).toBe("docente-pro");
  });

  it("CANCELED degrada a free", () => {
    expect(resolveNextPlan("CANCELED", "docente-pro", "docente-pro")).toBe("free");
  });

  it("PAST_DUE conserva el plan vigente (notificacion tardia no quita acceso)", () => {
    // Caso clave: llega un 'pending' DESPUES del 'approved' -> no debe volver a free.
    expect(resolveNextPlan("PAST_DUE", "docente-pro", "docente-pro")).toBe("docente-pro");
  });

  it("PAST_DUE sin plan vigente queda en free (primer pending antes de aprobar)", () => {
    expect(resolveNextPlan("PAST_DUE", "free", "docente-pro")).toBe("free");
    expect(resolveNextPlan("PAST_DUE", "", "docente-pro")).toBe("free");
  });
});
