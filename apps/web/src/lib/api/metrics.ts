export type MetricsOverview = {
  metrics: {
    userCount: number;
    newUsers30d: number;
    growth30dPct: number;
    mrrArs: number;
    arrArs: number;
    paidCount: number;
    conversionPct: number;
    tenantCount: number;
    schoolCount: number;
    teacherCount: number;
    studentCount: number;
    lessonPlanCount: number;
  };
  planBreakdown: Array<{
    product: string;
    planCode: string;
    label: string;
    count: number;
    priceArs: number;
    revenueArs: number;
  }>;
  newUsersByMonth: Array<{ month: string; label: string; count: number }>;
  recentBilling: Array<{
    id: string;
    provider: string;
    eventType: string;
    status: string;
    outcome: string | null;
    tenantId: string | null;
    receivedAt: string;
    processedAt: string | null;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    createdAt: string;
  }>;
};

export async function fetchMetrics(accessToken: string): Promise<MetricsOverview | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/dashboard/metrics`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data?: MetricsOverview };
  return payload.data ?? null;
}

export function fmtArs(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtNum(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function fmtPct(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}
