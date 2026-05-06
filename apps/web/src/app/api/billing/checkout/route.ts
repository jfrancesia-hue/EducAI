import { NextResponse, type NextRequest } from "next/server";

const STRIPE_API_VERSION = "2026-02-25.clover";

const priceEnvByPlan = {
  escuela: "STRIPE_PRICE_ESCUELA",
  red: "STRIPE_PRICE_RED",
  ministerio: "STRIPE_PRICE_MINISTERIO",
} as const;

type PlanId = keyof typeof priceEnvByPlan;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const plan = formData.get("plan");
  const acceptedTerms = formData.get("acceptTerms") === "on";

  if (!isPlanId(plan)) {
    return NextResponse.json(
      { code: "BILLING_PLAN_INVALID", message: "Plan de pago invalido" },
      { status: 400 },
    );
  }

  if (!acceptedTerms) {
    return NextResponse.json(
      { code: "BILLING_TERMS_REQUIRED", message: "Debes aceptar terminos y privacidad" },
      { status: 400 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[priceEnvByPlan[plan]];

  if (!secretKey || !priceId) {
    return NextResponse.json(
      {
        code: "BILLING_NOT_CONFIGURED",
        message: "Stripe no esta configurado para este plan",
      },
      { status: 503 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const body = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/planes?checkout=success`,
    cancel_url: `${origin}/planes?checkout=cancelled`,
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: unknown };

  if (!response.ok || !payload.url) {
    return NextResponse.json(
      {
        code: "BILLING_CHECKOUT_FAILED",
        message: "No se pudo iniciar el checkout",
        detail: payload.error,
      },
      { status: 502 },
    );
  }

  return NextResponse.redirect(payload.url, { status: 303 });
}

function isPlanId(plan: FormDataEntryValue | null): plan is PlanId {
  return typeof plan === "string" && plan in priceEnvByPlan;
}
