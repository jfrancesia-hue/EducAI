import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  CreditCard,
  LineChart,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { loadAdminMetrics } from "../../../lib/admin-metrics";
import { getServerSession, isAdminSession } from "../../../lib/server-session";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!isAdminSession(session)) {
    redirect("/app");
  }

  const metrics = await loadAdminMetrics();
  const currency = metrics.currency.toUpperCase();

  const cards = [
    {
      label: "MRR",
      value: formatMoney(metrics.mrrCents, currency),
      note: "Ingreso mensual recurrente",
      icon: BadgeDollarSign,
      tone: "bg-[#e7fbf7] text-[#087968]",
    },
    {
      label: "ARR",
      value: formatMoney(metrics.arrCents, currency),
      note: "Proyeccion anual",
      icon: TrendingUp,
      tone: "bg-[#fff6c9] text-[#876100]",
    },
    {
      label: "Planes pagos",
      value: String(metrics.paidPlanCount),
      note: `${metrics.activeSubscriptions} suscripciones activas`,
      icon: CreditCard,
      tone: "bg-[#efedff] text-[#4f3ee2]",
    },
    {
      label: "Inscripciones 30d",
      value: String(metrics.signups30d),
      note: `${Math.round(metrics.conversionRate * 100)}% conversion`,
      icon: UsersRound,
      tone: "bg-[#fdeaf4] text-[#b82170]",
    },
  ];

  return (
    <AppShell title="Dashboard del fundador" eyebrow="EducAI Admin" showAdmin>
      <div className="grid gap-5 p-4 sm:p-6">
        <div className="rounded-lg border border-[#d5e1dc] bg-[#11231f] p-5 text-white shadow-float">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#f8d95c] text-[#11231f]">
                  {metrics.mode === "live" ? "Stripe en vivo" : "Modo revision"}
                </Badge>
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                  {currency}
                </Badge>
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
                Ingresos, inscripciones y planes en un solo lugar.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
                Este tablero toma datos reales de Stripe cuando esta configurado. Sin credenciales,
                muestra datos de revision para validar decisiones de diseno y negocio.
              </p>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/10 p-4">
              <p className="text-sm text-white/68">Revenue 30 dias</p>
              <p className="mt-2 font-display text-3xl font-bold">
                {formatMoney(metrics.checkoutRevenue30dCents, currency)}
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    card.tone,
                  ].join(" ")}
                >
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5b6962]">
                  {card.label}
                </p>
              </div>
              <p className="mt-5 font-display text-4xl font-bold tracking-tight">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#5b6962]">{card.note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                  Planes
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  Suscripciones por plan
                </h2>
              </div>
              <BarChart3 className="h-6 w-6 text-[#087968]" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-3">
              {metrics.plans.map((plan) => {
                const width = metrics.mrrCents
                  ? Math.max(8, Math.round((plan.mrrCents / metrics.mrrCents) * 100))
                  : 8;

                return (
                  <div key={plan.id} className="rounded-lg border border-[#e3ebe7] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{plan.label}</p>
                        <p className="mt-1 text-sm text-[#5b6962]">{plan.count} clientes</p>
                      </div>
                      <p className="font-display text-xl font-bold">
                        {formatMoney(plan.mrrCents, currency)}
                      </p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e4eee9]">
                      <div
                        className="h-full rounded-full bg-[#18b6a4]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                  Inscripciones
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  Ultimos movimientos comerciales
                </h2>
              </div>
              <LineChart className="h-6 w-6 text-[#7c6cff]" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-3">
              {metrics.recentSignups.map((signup) => (
                <div
                  key={signup.id}
                  className="grid gap-3 rounded-lg border border-[#e3ebe7] p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-semibold">{signup.email}</p>
                    <p className="mt-1 text-sm text-[#5b6962]">
                      {signup.plan} - {new Date(signup.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <p className="font-display text-xl font-bold">
                    {formatMoney(signup.amountCents, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-[#ff7a1a]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold tracking-tight">Notas operativas</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {metrics.notes.map((note) => (
              <div
                key={note}
                className="rounded-lg bg-[#eef5f3] p-4 text-sm leading-6 text-[#4f5f58]"
              >
                {note}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function formatMoney(cents: number, currency: string): string {
  if (currency === "USD") {
    return currencyFormatter.format(cents / 100);
  }

  return `${currency} ${Math.round(cents / 100).toLocaleString("es-AR")}`;
}
