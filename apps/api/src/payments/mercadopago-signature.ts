import { createHmac, timingSafeEqual } from "node:crypto";

export interface MercadoPagoSignatureInput {
  dataId?: string;
  requestId?: string;
  secret: string;
  signature: string;
  /** Tolerancia anti-replay en ms. Si es <= 0 se desactiva la verificacion de frescura. Default 5 min. */
  toleranceMs?: number;
  /** Inyectable para tests. Default Date.now(). */
  nowMs?: number;
}

/** Ventana por defecto: MercadoPago reintenta en segundos; 5 min cubre skew de reloj. */
export const DEFAULT_MP_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

interface ParsedSignature {
  ts?: string;
  v1?: string;
}

export function buildMercadoPagoSignatureManifest(input: {
  dataId?: string;
  requestId?: string;
  timestamp?: string;
}): string {
  const parts: string[] = [];
  if (input.dataId) {
    parts.push(`id:${input.dataId};`);
  }
  if (input.requestId) {
    parts.push(`request-id:${input.requestId};`);
  }
  if (input.timestamp) {
    parts.push(`ts:${input.timestamp};`);
  }
  return parts.join("");
}

export function isValidMercadoPagoSignature(input: MercadoPagoSignatureInput): boolean {
  const parsed = parseMercadoPagoSignature(input.signature);
  // Fail-closed: exigimos dataId para atar la firma al pago que se va a procesar
  // (sin esto, omitir data.id de la query permitiria validar y procesar un pago del body no firmado).
  if (!parsed.ts || !parsed.v1 || !input.requestId || !input.secret || !input.dataId) {
    return false;
  }

  const toleranceMs = input.toleranceMs ?? DEFAULT_MP_SIGNATURE_TOLERANCE_MS;
  if (toleranceMs > 0 && !isTimestampFresh(parsed.ts, toleranceMs, input.nowMs ?? Date.now())) {
    return false;
  }

  const manifest = buildMercadoPagoSignatureManifest({
    dataId: input.dataId,
    requestId: input.requestId,
    timestamp: parsed.ts,
  });
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");

  return safeCompare(expected, parsed.v1);
}

/** Acepta ts en segundos o milisegundos (MercadoPago usa ms); compara el delta absoluto contra la tolerancia. */
function isTimestampFresh(ts: string, toleranceMs: number, nowMs: number): boolean {
  const raw = Number.parseInt(ts, 10);
  if (!Number.isFinite(raw) || raw <= 0) {
    return false;
  }
  // <= 11 digitos lo tratamos como epoch en segundos.
  const tsMs = ts.trim().length <= 11 ? raw * 1000 : raw;
  return Math.abs(nowMs - tsMs) <= toleranceMs;
}

function parseMercadoPagoSignature(signature: string): ParsedSignature {
  return signature.split(",").reduce<ParsedSignature>((parsed, part) => {
    const [key, value] = part.split("=", 2);
    const normalizedKey = key?.trim();
    const normalizedValue = value?.trim();
    if (normalizedKey === "ts") {
      parsed.ts = normalizedValue;
    }
    if (normalizedKey === "v1") {
      parsed.v1 = normalizedValue;
    }
    return parsed;
  }, {});
}

function safeCompare(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
