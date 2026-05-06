import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secret && signature && !verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { code: "WEBHOOK_SIGNATURE_INVALID", message: "Firma Stripe invalida" },
      { status: 400 },
    );
  }

  const event = JSON.parse(rawBody) as { id?: string; type?: string; data?: unknown };

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
