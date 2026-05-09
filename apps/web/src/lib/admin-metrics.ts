type StripeList<T> = {
  data?: T[];
};

type StripePrice = {
  id?: string;
  lookup_key?: string | null;
  nickname?: string | null;
  unit_amount?: number | null;
  currency?: string | null;
  recurring?: {
    interval?: string | null;
  } | null;
};

type StripeSubscription = {
  id: string;
  status: string;
  created: number;
  customer?: string;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      quantity?: number | null;
      price?: StripePrice | null;
    }>;
  };
};

type StripeCheckoutSession = {
  id: string;
  created: number;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  metadata?: Record<string, string>;
  payment_status?: string | null;
};

export type AdminMetrics = {
  mode: "live" | "review";
  currency: string;
  mrrCents: number;
  arrCents: number;
  activeSubscriptions: number;
  paidPlanCount: number;
  signups30d: number;
  checkoutRevenue30dCents: number;
  conversionRate: number;
  plans: Array<{
    id: string;
    label: string;
    count: number;
    mrrCents: number;
  }>;
  recentSignups: Array<{
    id: string;
    email: string;
    plan: string;
    amountCents: number;
    createdAt: string;
  }>;
  notes: string[];
};

const REVIEW_METRICS: AdminMetrics = {
  mode: "review",
  currency: "usd",
  mrrCents: 94700,
  arrCents: 11_36400,
  activeSubscriptions: 7,
  paidPlanCount: 7,
  signups30d: 18,
  checkoutRevenue30dCents: 134500,
  conversionRate: 0.39,
  plans: [
    { id: "escuela", label: "Escuela", count: 4, mrrCents: 59600 },
    { id: "red", label: "Red educativa", count: 2, mrrCents: 79800 },
    { id: "ministerio", label: "Gobierno / Ministerio", count: 1, mrrCents: 0 },
  ],
  recentSignups: [
    {
      id: "review_1",
      email: "direccion@colegiodelvalle.edu",
      plan: "Escuela",
      amountCents: 14900,
      createdAt: new Date().toISOString(),
    },
    {
      id: "review_2",
      email: "admin@rednorte.edu",
      plan: "Red educativa",
      amountCents: 39900,
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ],
  notes: [
    "Modo revision: configura STRIPE_SECRET_KEY para ver ingresos reales.",
    "MRR estimado con datos de ejemplo para validar la pantalla comercial.",
  ],
};

export async function loadAdminMetrics(): Promise<AdminMetrics> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return REVIEW_METRICS;
  }

  const [subscriptions, sessions] = await Promise.all([
    stripeList<StripeSubscription>("/v1/subscriptions?limit=100&status=all", secretKey),
    stripeList<StripeCheckoutSession>("/v1/checkout/sessions?limit=100", secretKey),
  ]);

  const active = subscriptions.filter((subscription) =>
    ["active", "trialing"].includes(subscription.status),
  );
  const paid = active.filter((subscription) => subscriptionMrr(subscription) > 0);
  const plans = aggregatePlans(active);
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 86_400_000) / 1000);
  const recentSessions = sessions.filter((session) => session.created >= thirtyDaysAgo);
  const paidSessions = recentSessions.filter((session) => session.payment_status === "paid");
  const checkoutRevenue30dCents = paidSessions.reduce(
    (sum, session) => sum + (session.amount_total ?? 0),
    0,
  );
  const mrrCents = active.reduce((sum, subscription) => sum + subscriptionMrr(subscription), 0);
  const currency =
    active
      .flatMap((subscription) => subscription.items?.data ?? [])
      .find((item) => item.price?.currency)?.price?.currency ?? "usd";

  return {
    mode: "live",
    currency,
    mrrCents,
    arrCents: mrrCents * 12,
    activeSubscriptions: active.length,
    paidPlanCount: paid.length,
    signups30d: recentSessions.length,
    checkoutRevenue30dCents,
    conversionRate: recentSessions.length ? paidSessions.length / recentSessions.length : 0,
    plans,
    recentSignups: recentSessions.slice(0, 8).map((session) => ({
      id: session.id,
      email: session.customer_details?.email ?? "sin-email",
      plan: session.metadata?.plan ?? "sin-plan",
      amountCents: session.amount_total ?? 0,
      createdAt: new Date(session.created * 1000).toISOString(),
    })),
    notes: ["Metricas tomadas de Stripe en vivo."],
  };
}

async function stripeList<T>(path: string, secretKey: string): Promise<T[]> {
  const response = await fetch(`https://api.stripe.com${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": "2026-02-25.clover",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as StripeList<T>;
  return payload.data ?? [];
}

function subscriptionMrr(subscription: StripeSubscription): number {
  return (subscription.items?.data ?? []).reduce((sum, item) => {
    const amount = item.price?.unit_amount ?? 0;
    const quantity = item.quantity ?? 1;
    const interval = item.price?.recurring?.interval ?? "month";
    const monthlyAmount = interval === "year" ? Math.round(amount / 12) : amount;
    return sum + monthlyAmount * quantity;
  }, 0);
}

function aggregatePlans(subscriptions: StripeSubscription[]): AdminMetrics["plans"] {
  const plans = new Map<string, { id: string; label: string; count: number; mrrCents: number }>();

  for (const subscription of subscriptions) {
    const item = subscription.items?.data?.[0];
    const price = item?.price;
    const id =
      subscription.metadata?.plan ??
      price?.lookup_key ??
      price?.nickname ??
      price?.id ??
      "sin-plan";
    const current = plans.get(id) ?? { id, label: labelizePlan(id), count: 0, mrrCents: 0 };
    current.count += 1;
    current.mrrCents += subscriptionMrr(subscription);
    plans.set(id, current);
  }

  return [...plans.values()].sort((a, b) => b.mrrCents - a.mrrCents);
}

function labelizePlan(plan: string): string {
  return plan
    .replace(/^price_/, "Plan ")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
