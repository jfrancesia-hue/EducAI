import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildMercadoPagoSignatureManifest,
  isValidMercadoPagoSignature,
} from "./mercadopago-signature.js";

const TS = "1742505638683";
const TS_MS = Number(TS);

function signatureFor(input: { dataId: string; requestId: string; secret: string; ts?: string }) {
  const manifest = buildMercadoPagoSignatureManifest({
    dataId: input.dataId,
    requestId: input.requestId,
    timestamp: input.ts ?? TS,
  });
  const v1 = createHmac("sha256", input.secret).update(manifest).digest("hex");
  return `ts=${input.ts ?? TS},v1=${v1}`;
}

describe("Mercado Pago webhook signature", () => {
  const secret = "test-webhook-secret";

  it("construye el manifiesto con el formato documentado por Mercado Pago", () => {
    expect(
      buildMercadoPagoSignatureManifest({
        dataId: "123456",
        requestId: "bb56a2f1-6aae-46ac-982e-9dcd3581d08e",
        timestamp: TS,
      }),
    ).toBe(`id:123456;request-id:bb56a2f1-6aae-46ac-982e-9dcd3581d08e;ts:${TS};`);
  });

  it("valida una firma HMAC SHA256 correcta (dentro de la ventana de frescura)", () => {
    expect(
      isValidMercadoPagoSignature({
        dataId: "123456",
        requestId: "request-1",
        secret,
        signature: signatureFor({ dataId: "123456", requestId: "request-1", secret }),
        nowMs: TS_MS, // reloj alineado al ts del token
      }),
    ).toBe(true);
  });

  it("rechaza una firma que no corresponde al data id", () => {
    expect(
      isValidMercadoPagoSignature({
        dataId: "999999",
        requestId: "request-1",
        secret,
        signature: signatureFor({ dataId: "123456", requestId: "request-1", secret }),
        nowMs: TS_MS,
      }),
    ).toBe(false);
  });

  it("rechaza un replay: timestamp fuera de la ventana de tolerancia", () => {
    expect(
      isValidMercadoPagoSignature({
        dataId: "123456",
        requestId: "request-1",
        secret,
        signature: signatureFor({ dataId: "123456", requestId: "request-1", secret }),
        nowMs: TS_MS + 6 * 60 * 1000, // 6 min despues -> fuera de la ventana default de 5 min
      }),
    ).toBe(false);
  });

  it("rechaza si falta el data id (no se puede atar la firma al pago)", () => {
    expect(
      isValidMercadoPagoSignature({
        dataId: undefined,
        requestId: "request-1",
        secret,
        signature: signatureFor({ dataId: "123456", requestId: "request-1", secret }),
        nowMs: TS_MS,
      }),
    ).toBe(false);
  });

  it("acepta ts en segundos (epoch de 10 digitos)", () => {
    const tsSeconds = "1742505638";
    expect(
      isValidMercadoPagoSignature({
        dataId: "123456",
        requestId: "request-1",
        secret,
        signature: signatureFor({
          dataId: "123456",
          requestId: "request-1",
          secret,
          ts: tsSeconds,
        }),
        nowMs: Number(tsSeconds) * 1000,
      }),
    ).toBe(true);
  });

  it("permite desactivar la frescura con toleranceMs<=0 (manteniendo el resto de checks)", () => {
    expect(
      isValidMercadoPagoSignature({
        dataId: "123456",
        requestId: "request-1",
        secret,
        signature: signatureFor({ dataId: "123456", requestId: "request-1", secret }),
        toleranceMs: 0,
        nowMs: TS_MS + 365 * 24 * 60 * 60 * 1000, // un año despues, pero la frescura esta apagada
      }),
    ).toBe(true);
  });
});
