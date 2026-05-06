import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  Landmark,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@educai/ui";

const plans = [
  {
    id: "escuela",
    name: "Escuela",
    price: "USD 149",
    cadence: "/ mes",
    summary: "Para una institucion que quiere activar EducAI con docentes y coordinacion.",
    icon: Building2,
    tone: "bg-[#e7fbf7] text-[#087968]",
    accent: "bg-[#18b6a4]",
    env: "STRIPE_PRICE_ESCUELA",
    features: [
      "Hasta 40 docentes",
      "Agente IA para planificacion y recursos",
      "Seguimiento de estudiantes y reportes",
      "Soporte de implementacion inicial",
    ],
  },
  {
    id: "red",
    name: "Red educativa",
    price: "USD 399",
    cadence: "/ mes",
    summary: "Para grupos de escuelas que necesitan visibilidad multi-sede y adopcion guiada.",
    icon: Layers,
    tone: "bg-[#fff6c9] text-[#876100]",
    accent: "bg-[#f8d95c]",
    env: "STRIPE_PRICE_RED",
    featured: true,
    features: [
      "Hasta 5 instituciones",
      "Panel directivo y analitica consolidada",
      "Roles por sede y equipo pedagogico",
      "Acompanamiento mensual de adopcion",
    ],
  },
  {
    id: "ministerio",
    name: "Gobierno / Ministerio",
    price: "A medida",
    cadence: "",
    summary: "Para despliegues territoriales con integraciones, seguridad y soporte dedicado.",
    icon: Landmark,
    tone: "bg-[#efedff] text-[#4f3ee2]",
    accent: "bg-[#7c6cff]",
    env: "STRIPE_PRICE_MINISTERIO",
    features: [
      "Tenancy avanzado",
      "Integraciones y migraciones",
      "SLA y soporte dedicado",
      "Reportes ejecutivos y auditoria",
    ],
  },
];

type PlanPageProps = {
  searchParams?: {
    checkout?: string;
  };
};

export default function PlansPage({ searchParams }: PlanPageProps) {
  const checkout = searchParams?.checkout;

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <section className="relative overflow-hidden bg-[#11231f] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,182,164,0.22),transparent_38%),linear-gradient(18deg,transparent_0%,rgba(239,93,168,0.18)_72%,rgba(248,217,92,0.13)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8d95c] text-[#11231f]">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-semibold">EducAI</span>
            </Link>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver
              </Link>
            </Button>
          </header>

          <div className="grid gap-8 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <Badge className="border-white/20 bg-white/12 text-white" variant="outline">
                Monetizacion lista con Stripe
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
                Planes simples para vender EducAI a escuelas y redes.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
                Suscripciones mensuales con Checkout, cupones y precios configurables desde Stripe.
                La plataforma queda preparada para cobrar sin construir billing manual.
              </p>
            </div>
            <div className="rounded-lg border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
                <p className="font-display text-xl font-semibold">Modelo rentable</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["MRR recurrente", "Ventas B2B", "Upgrade por red"].map((item) => (
                  <div key={item} className="rounded-lg bg-white/10 p-4 text-sm text-white/78">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {checkout === "success" ? (
          <div className="mb-6 rounded-lg border border-[#18b6a4]/30 bg-[#e7fbf7] p-4 text-[#087968]">
            Checkout iniciado correctamente. Stripe confirma el pago y activa la suscripcion desde
            sus webhooks.
          </div>
        ) : null}
        {checkout === "cancelled" ? (
          <div className="mb-6 rounded-lg border border-[#f8d95c]/40 bg-[#fff6c9] p-4 text-[#876100]">
            El checkout fue cancelado. El colegio puede elegir otro plan o hablar con ventas.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const configured = Boolean(process.env[plan.env]);
            const Icon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={[
                  "relative overflow-hidden rounded-lg border-slate-200 bg-white shadow-whisper",
                  plan.featured ? "ring-2 ring-[#f8d95c]" : "",
                ].join(" ")}
              >
                <span className={["block h-1 w-full", plan.accent].join(" ")} />
                {plan.featured ? (
                  <Badge className="absolute right-4 top-4 bg-[#ff7a1a] text-white">
                    Mas vendible
                  </Badge>
                ) : null}
                <CardHeader>
                  <span
                    className={[
                      "flex h-12 w-12 items-center justify-center rounded-lg",
                      plan.tone,
                    ].join(" ")}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <CardTitle className="mt-4 text-2xl">{plan.name}</CardTitle>
                  <p className="text-sm leading-6 text-slate-600">{plan.summary}</p>
                  <div className="pt-2">
                    <span className="font-display text-4xl font-bold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">{plan.cadence}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                          aria-hidden="true"
                        />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {configured ? (
                    <form action="/api/billing/checkout" method="post" className="mt-6">
                      <input type="hidden" name="plan" value={plan.id} />
                      <label className="mb-4 flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        <input
                          required
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#18b6a4]"
                          name="acceptTerms"
                          type="checkbox"
                        />
                        <span>
                          Acepto los{" "}
                          <Link className="font-semibold text-[#087968] underline" href="/terminos">
                            terminos
                          </Link>{" "}
                          y la{" "}
                          <Link
                            className="font-semibold text-[#087968] underline"
                            href="/privacidad"
                          >
                            privacidad
                          </Link>
                          .
                        </span>
                      </label>
                      <Button
                        type="submit"
                        className="w-full bg-[#11231f] text-white hover:bg-[#1b342e]"
                      >
                        Contratar plan
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-6">
                      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        Al pedir propuesta, el cliente puede revisar{" "}
                        <Link className="font-semibold text-[#087968] underline" href="/terminos">
                          terminos
                        </Link>{" "}
                        y{" "}
                        <Link className="font-semibold text-[#087968] underline" href="/privacidad">
                          privacidad
                        </Link>{" "}
                        antes de avanzar comercialmente.
                      </div>
                      <Button className="w-full bg-[#11231f] text-white hover:bg-[#1b342e]" asChild>
                        <Link href="/contacto">
                          Pedir propuesta
                          <Sparkles className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-whisper">
          Para activar cobro directo configura `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL` y los
          Price IDs `STRIPE_PRICE_ESCUELA`, `STRIPE_PRICE_RED` y `STRIPE_PRICE_MINISTERIO`.
        </div>
      </section>
    </main>
  );
}
