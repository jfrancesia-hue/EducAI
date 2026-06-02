import { redirect } from "next/navigation";
import { BarChart3, GraduationCap, TrendingUp, UsersRound, Wallet } from "lucide-react";

import { AppShell } from "../_components/app-shell";
import {
  fetchMetrics,
  fmtArs,
  fmtNum,
  fmtPct,
  type MetricsOverview,
} from "../../../lib/api/metrics";
import { getEducaiAppAuth } from "../../../lib/supabase/app-auth";
import { extractRoleFromMetadata } from "../../../lib/supabase/roles";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function MetricasPage() {
  const isDevBypass =
    process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DISABLE_APP_AUTH === "true";

  let accessToken = "";
  if (!isDevBypass) {
    const auth = await getEducaiAppAuth();
    if (!auth.user) {
      redirect("/login?next=/app/metricas");
    }
    const role =
      extractRoleFromMetadata(auth.user.app_metadata) ??
      extractRoleFromMetadata(auth.user.user_metadata);
    // Métricas de negocio (ingresos): solo el dueño.
    if (role !== "SUPER_ADMIN") {
      redirect("/acceso-denegado");
    }
    accessToken = auth.accessToken;
  }

  const metrics = accessToken ? await fetchMetrics(accessToken) : null;

  return (
    <AppShell
      title="Métricas"
      eyebrow="Negocio"
      statusNote="MRR proyectado = suscripciones y planes activos × precio de lista. No es la suma de cobros reales."
    >
      <div className="grid gap-5 p-4 sm:p-6">
        {!metrics ? (
          <div className="rounded-2xl border border-[#f0c9c9] bg-white p-6 shadow-whisper">
            <p className="font-display text-xl font-bold">No pudimos cargar las métricas</p>
            <p className="mt-2 text-sm leading-6 text-[#4f5f58]">
              Reintentá en unos minutos. Si persiste, revisá que la API esté disponible.
            </p>
          </div>
        ) : (
          <>
            <KpiGrid metrics={metrics.metrics} />
            <NewUsersChart data={metrics.newUsersByMonth} />
            <PlanBreakdown plans={metrics.planBreakdown} mrr={metrics.metrics.mrrArs} />
            <RecentBilling rows={metrics.recentBilling} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function KpiGrid({ metrics }: { metrics: MetricsOverview["metrics"] }) {
  const cards = [
    {
      label: "MRR proyectado",
      value: fmtArs(metrics.mrrArs),
      hint: `ARR ≈ ${fmtArs(metrics.arrArs)} · ${metrics.paidCount} suscripciones pagas`,
      icon: Wallet,
      tone: "bg-[#e7fbf7] text-[#087968]",
    },
    {
      label: "Usuarios totales",
      value: fmtNum(metrics.userCount),
      delta: metrics.growth30dPct,
      hint: `${metrics.newUsers30d} nuevos en 30 días`,
      icon: UsersRound,
      tone: "bg-[#e7efff] text-[#1d4ed8]",
    },
    {
      label: "Conversión a pago",
      value: `${metrics.conversionPct.toFixed(1)}%`,
      hint: `${metrics.paidCount} pagas sobre ${fmtNum(metrics.tenantCount)} cuentas`,
      icon: TrendingUp,
      tone: "bg-[#efedff] text-[#4f3ee2]",
    },
    {
      label: "Planificaciones",
      value: fmtNum(metrics.lessonPlanCount),
      hint: `${fmtNum(metrics.teacherCount)} docentes · ${fmtNum(metrics.studentCount)} estudiantes`,
      icon: GraduationCap,
      tone: "bg-[#fff8d7] text-[#876100]",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[20px] border border-[#d5e1dc] bg-white p-5 shadow-whisper"
        >
          <span
            className={["flex h-11 w-11 items-center justify-center rounded-full", card.tone].join(
              " ",
            )}
          >
            <card.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#5b6962]">
            {card.label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-[#11231f]">
              {card.value}
            </span>
            {card.delta !== undefined ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  card.delta >= 0 ? "bg-[#d6f0e0] text-[#1f7a44]" : "bg-[#fde8e8] text-[#9b1c1c]",
                ].join(" ")}
              >
                {fmtPct(card.delta)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[#4f5f58]">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

function NewUsersChart({ data }: { data: MetricsOverview["newUsersByMonth"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 880;
  const height = 220;
  const padX = 24;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => ({
    x: padX + stepX * i,
    y: padY + innerH - (d.count / max) * innerH,
    ...d,
  }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1]!.x},${padY + innerH} L${points[0]!.x},${padY + innerH} Z`
      : "";
  const totalYear = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <section className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-[#11231f]">
            Altas de usuarios · 12 meses
          </h2>
          <p className="mt-0.5 text-xs text-[#7b8794]">Nuevos registros por mes.</p>
        </div>
        <span className="rounded-full bg-[#e7fbf7] px-3 py-1 text-xs font-semibold text-[#087968]">
          {fmtNum(totalYear)} en el año
        </span>
      </div>
      <div className="-mx-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full min-w-[560px]"
          role="img"
          aria-label="Altas de usuarios por mes"
        >
          <defs>
            <linearGradient id="usersArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#18b6a4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#18b6a4" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={padX}
              x2={width - padX}
              y1={padY + innerH * p}
              y2={padY + innerH * p}
              stroke="#e3ebe7"
              strokeDasharray="3 4"
            />
          ))}
          {areaPath ? <path d={areaPath} fill="url(#usersArea)" /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="#0a7668"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {points.map((p) => (
            <g key={p.month}>
              <circle cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#0a7668" strokeWidth={2} />
              <text
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                style={{ fontSize: 10 }}
                className="fill-[#7b8794]"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

function PlanBreakdown({ plans, mrr }: { plans: MetricsOverview["planBreakdown"]; mrr: number }) {
  return (
    <section className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-[#11231f]">
        Distribución por plan
      </h2>
      {plans.length === 0 ? (
        <p className="rounded-xl bg-[#f7f8f3] p-4 text-sm text-[#4f5f58]">
          Todavía no hay suscripciones pagas. Cuando se aprueben pagos, vas a ver el desglose acá.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const share = mrr > 0 ? (plan.revenueArs / mrr) * 100 : 0;
            return (
              <article
                key={`${plan.product}:${plan.planCode}`}
                className="rounded-2xl border border-[#e3ebe7] bg-[#fbfffd] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#11231f]">{plan.label}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#075f53]">
                    {plan.count}
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-[#11231f]">
                  {fmtArs(plan.revenueArs)}
                  <span className="ml-1 text-sm font-medium text-[#7b8794]">/mes</span>
                </p>
                <p className="mt-0.5 text-xs text-[#7b8794]">{fmtArs(plan.priceArs)} c/u</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e3ebe7]">
                  <div
                    className="h-full rounded-full bg-[#18b6a4]"
                    style={{ width: `${Math.min(100, share)}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentBilling({ rows }: { rows: MetricsOverview["recentBilling"] }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#d5e1dc] bg-white shadow-whisper">
      <div className="flex items-center justify-between gap-2 border-b border-[#e3ebe7] px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#087968]" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold tracking-tight text-[#11231f]">
            Eventos de cobro recientes
          </h2>
        </div>
        <span className="text-xs text-[#7b8794]">{rows.length} eventos</span>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-[#7b8794]">
          Todavía no hay eventos de cobro registrados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#e3ebe7] text-left text-xs uppercase tracking-wider text-[#5b6962]">
                <th className="px-5 py-3 font-semibold">Proveedor</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 font-semibold">Resultado</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f0f4f2] last:border-0">
                  <td className="px-5 py-3 capitalize text-[#11231f]">{row.provider}</td>
                  <td className="px-5 py-3 text-[#4f5f58]">{row.eventType}</td>
                  <td className="px-5 py-3">
                    <BillingBadge outcome={row.outcome} processed={row.processedAt !== null} />
                  </td>
                  <td className="px-5 py-3 text-xs text-[#7b8794]">{formatDate(row.receivedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BillingBadge({ outcome, processed }: { outcome: string | null; processed: boolean }) {
  const ok = outcome === "processed";
  const label = outcome ?? (processed ? "procesado" : "pendiente");
  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        ok ? "bg-[#d6f0e0] text-[#1f7a44]" : "bg-[#fff3c7] text-[#92600e]",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
