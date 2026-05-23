import Link from "next/link";
import {
  BadgeDollarSign,
  CheckCircle2,
  CreditCard,
  LineChart,
  MessageCircle,
  Smartphone,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import {
  addOnPacks,
  creditRules,
  pricingAssumptions,
  pricingPlans,
  schoolPlans,
  usageCosts,
} from "../../../lib/pricing";

const scoreCards = [
  {
    label: "Plan foco",
    value: "Plus",
    note: "$29.900 publico / $19.900 fundador",
    icon: Sparkles,
    tone: "bg-[#fff6c9] text-[#876100]",
  },
  {
    label: "Margen buscado",
    value: "60%+",
    note: "Despues de IA, Twilio y pagos",
    icon: TrendingUp,
    tone: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    label: "Riesgo principal",
    value: "WhatsApp",
    note: "Medir uso diario y mensual",
    icon: MessageCircle,
    tone: "bg-[#fdeaf4] text-[#b82170]",
  },
];

export default function AppPricingPage() {
  return (
    <AppShell title="Planes y unidad economica" eyebrow="ApoyoAI - Cobro en pesos argentinos">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_0.78fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge className="bg-[#e7fbf7] text-[#087968]">Version de trabajo</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Planes ApoyoAI para Argentina
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                  Cobro en ARS por Mercado Pago, con costos dolarizados controlados por consultas,
                  canal y tipo de contenido.
                </p>
              </div>
              <Button asChild className="bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                <Link href="/precios">
                  Ver precios publicos
                  <LineChart className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {scoreCards.map((card) => (
              <article
                key={card.label}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    card.tone,
                  ].join(" ")}
                >
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-5 text-[15px] text-[#5b6962]">{card.label}</p>
                <p className="mt-1 font-display text-4xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{card.note}</p>
              </article>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#d5e1dc] bg-white shadow-whisper">
            <div className="border-b border-[#e3ebe7] p-5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-[#087968]" aria-hidden="true" />
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Matriz de planes B2C
                </h2>
              </div>
            </div>
            <div className="divide-y divide-[#e3ebe7]">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={[
                    "grid gap-4 p-5 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr]",
                    plan.featured ? "bg-[#fff8ed]" : "bg-white",
                  ].join(" ")}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                      {plan.featured ? (
                        <Badge className="bg-[#ff7a1a] text-white">Foco comercial</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[15px] text-[#4f5f58]">{plan.audience}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.includes.map((item) => (
                        <Badge key={item} className="bg-[#eef5f3] text-[#33423c]">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                      Precio
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold">{plan.price}</p>
                    <p className="mt-1 text-sm text-[#087968]">
                      {plan.founderPrice ?? "Sin precio fundador"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                      Uso
                    </p>
                    <p className="mt-1 font-semibold">{plan.monthlyUsage}</p>
                    <p className="mt-1 text-sm text-[#4f5f58]">{plan.channels}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                      Margen
                    </p>
                    <p className="mt-1 font-semibold">{plan.costRange}</p>
                    <p className="mt-1 text-sm text-[#4f5f58]">{plan.marginRange}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <BadgeDollarSign className="h-6 w-6 text-[#4f3ee2]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Costos por unidad de uso
              </h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {usageCosts.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.label}</p>
                    <Badge className="bg-[#eef5f3] text-[#33423c]">{item.cost}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[#4f5f58]">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Supuestos</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {Object.entries(pricingAssumptions).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-white/10 p-4">
                  <p className="text-[13px] uppercase tracking-[0.12em] text-white/54">{key}</p>
                  <p className="mt-1 text-[15px] font-semibold leading-6 text-white/86">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <WalletCards className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Packs extra</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {addOnPacks.map((pack) => (
                <div key={pack.name} className="rounded-lg border border-[#e3ebe7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{pack.name}</p>
                    <p className="font-display text-lg font-bold">{pack.price}</p>
                  </div>
                  <p className="mt-1 text-sm text-[#4f5f58]">{pack.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#ff7a1a]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Reglas internas</h2>
            </div>
            <div className="mt-5 grid gap-2">
              {creditRules.map((rule) => (
                <p key={rule} className="rounded-lg bg-[#eef5f3] px-3 py-2 text-sm text-[#33423c]">
                  {rule}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <h2 className="font-display text-2xl font-bold tracking-tight">Colegios</h2>
            <div className="mt-5 grid gap-3">
              {schoolPlans.map((plan) => (
                <div key={plan.name} className="rounded-lg border border-[#e3ebe7] p-4">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="mt-1 font-display text-xl font-bold">{plan.price}</p>
                  <p className="mt-1 text-sm leading-5 text-[#4f5f58]">{plan.scope}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
