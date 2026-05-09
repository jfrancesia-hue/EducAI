import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      return NextResponse.json(
        {
          code: "WEBHOOK_NOT_CONFIGURED",
          message: "Stripe webhook deshabilitado: falta STRIPE_WEBHOOK_SECRET en el entorno",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        code: "WEBHOOK_DEV_BYPASS",
        message: "STRIPE_WEBHOOK_SECRET ausente; webhook ignorado en entorno no productivo",
      },
      { status: 202 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { code: "WEBHOOK_SIGNATURE_MISSING", message: "Header stripe-signature requerido" },
      { status: 400 },
    );
  }

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { code: "WEBHOOK_SIGNATURE_INVALID", message: "Firma Stripe invalida" },
      { status: 400 },
    );
  }

  let event: { id?: string; type?: string; data?: unknown };
  try {
    event = JSON.parse(rawBody) as { id?: string; type?: string; data?: unknown };
  } catch {
    return NextResponse.json(
      { code: "WEBHOOK_PAYLOAD_INVALID", message: "Cuerpo del webhook no es JSON valido" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    received: true,
    eventId: event.id,
    type: event.type,
    note: "Webhook recibido. Para persistencia avanzada, conectar este handler a BillingEvent/Subscription en DB.",
  });
}

function verifyStripeSignature(rawBody: string, signature: string, secret: string): boolean {
  const timestamp = signature
    .split(",")
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const expected = signature
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  if (!timestamp || !expected) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const digest = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return safeEqual(digest, expected);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
