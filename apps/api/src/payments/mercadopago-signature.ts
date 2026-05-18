import { createHmac, timingSafeEqual } from "node:crypto";

export interface MercadoPagoSignatureInput {
  dataId?: string;
  requestId?: string;
  secret: string;
  signature: string;
}

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
  if (!parsed.ts || !parsed.v1 || !input.requestId || !input.secret) {
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
