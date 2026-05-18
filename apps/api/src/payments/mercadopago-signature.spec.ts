import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildMercadoPagoSignatureManifest,
  isValidMercadoPagoSignature,
} from "./mercadopago-signature.js";

describe("Mercado Pago webhook signature", () => {
  it("construye el manifiesto con el formato documentado por Mercado Pago", () => {
    expect(
      buildMercadoPagoSignatureManifest({
        dataId: "123456",
        requestId: "bb56a2f1-6aae-46ac-982e-9dcd3581d08e",
        timestamp: "1742505638683",
      }),
    ).toBe("id:123456;request-id:bb56a2f1-6aae-46ac-982e-9dcd3581d08e;ts:1742505638683;");
  });

  it("valida una firma HMAC SHA256 correcta", () => {
    const secret = "test-webhook-secret";
    const manifest = buildMercadoPagoSignatureManifest({
      dataId: "123456",
      requestId: "request-1",
      timestamp: "1742505638683",
    });
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      isValidMercadoPagoSignature({
        dataId: "123456",
        requestId: "request-1",
        secret,
        signature: `ts=1742505638683,v1=${signature}`,
      }),
    ).toBe(true);
  });

  it("rechaza una firma que no corresponde al data id", () => {
    const secret = "test-webhook-secret";
    const manifest = buildMercadoPagoSignatureManifest({
      dataId: "123456",
      requestId: "request-1",
      timestamp: "1742505638683",
    });
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      isValidMercadoPagoSignature({
        dataId: "999999",
        requestId: "request-1",
        secret,
        signature: `ts=1742505638683,v1=${signature}`,
      }),
    ).toBe(false);
  });
});
