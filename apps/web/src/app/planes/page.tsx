import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import {
  addOnPacks,
  creditRules,
  pricingAssumptions,
  pricingPlans,
  schoolPlans,
  usageCosts,
} from "../../lib/pricing";

const heroImage =
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1600&q=85";

const formatter = new Intl.NumberFormat("es-AR");

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <section className="relative min-h-[74vh] overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src={heroImage}
          alt="Familia revisando una tarea escolar en casa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,23,0.94)_0%,rgba(8,13,23,0.82)_52%,rgba(8,13,23,0.38)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f8f3] to-transparent" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white shadow-float backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3" aria-label="EducAI inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none">EducAI</span>
              <span className="block text-sm leading-5 text-white/82">Planes ApoyoAI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <Link href="#familias" className="transition hover:text-white">
              Familias
            </Link>
            <Link href="#costos" className="transition hover:text-white">
              Costos
            </Link>
            <Link href="#colegios" className="transition hover:text-white">
              Colegios
            </Link>
          </nav>
          <Button asChild size="sm" pill className="bg-white text-slate-950 hover:bg-white/90">
            <Link href="/contacto">
              Hablar <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(74vh-96px)] max-w-7xl items-center py-14">
          <div className="max-w-3xl">
            <Badge className="border-white/25 bg-[#18b6a4]/22 text-white" variant="outline">
              Argentina primero - cobro en pesos
            </Badge>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl">
              Planes para que ApoyoAI crezca sin regalar el costo variable.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/88 sm:text-xl">
              La propuesta combina WhatsApp, app, IA, audio, imagenes y reportes con limites de uso
              claros. El precio se cobra en ARS y se revisa por costos dolarizados.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Dolar tecnico", pricingAssumptions.internalDollar],
                ["Medio de pago", pricingAssumptions.paymentRail],
                ["Revision", pricingAssumptions.reviewCycle],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/16 bg-white/12 p-4 text-white"
                >
                  <p className="text-sm text-white/68">{label}</p>
                  <p className="mt-1 font-display text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="familias" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[#e7fbf7] text-[#087968]">Familias B2C</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Planes recomendados en ARS
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-600">
              Precio publico para Argentina, con precio fundador temporal para validar las primeras
              familias sin comprometer margen permanente.
            </p>
          </div>
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-4 shadow-whisper">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Regla comercial
            </p>
            <p className="mt-1 text-[15px] font-semibold">{pricingAssumptions.principle}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={[
                "relative flex min-h-[520px] flex-col rounded-lg border bg-white p-5 shadow-whisper",
                plan.featured ? "border-[#ff7a1a] ring-2 ring-[#ff7a1a]/20" : "border-[#d5e1dc]",
              ].join(" ")}
            >
              {plan.featured ? (
                <Badge className="absolute right-4 top-4 bg-[#ff7a1a] text-white">
                  Recomendado
                </Badge>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                {plan.audience}
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">{plan.name}</h3>
              <p className="mt-4 font-display text-3xl font-bold">{plan.price}</p>
              {plan.founderPrice ? (
                <p className="mt-1 text-sm font-semibold text-[#087968]">{plan.founderPrice}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Sin abono inicial</p>
              )}

              <div className="mt-5 grid gap-2 text-sm text-slate-700">
                {[plan.monthlyUsage, plan.children, plan.subjects, plan.channels, plan.reports].map(
                  (item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#18b6a4]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-5 rounded-lg bg-[#f7f8f3] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Costo estimado
                </p>
                <p className="mt-1 font-semibold">{plan.costRange}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Margen bruto objetivo {plan.marginRange}
                </p>
              </div>

              <div className="mt-5 grid gap-2">
                {plan.includes.map((item) => (
                  <p key={item} className="text-sm leading-5 text-slate-600">
                    {item}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="costos" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Badge className="bg-[#fff6c9] text-[#876100]">Unidad economica</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Costos que gobiernan el producto
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {usageCosts.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.label}</p>
                    <Badge className="bg-[#eef5f3] text-[#33423c]">{item.cost}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-whisper">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
                <h3 className="font-display text-2xl font-bold">Reglas de uso interno</h3>
              </div>
              <div className="mt-5 grid gap-3">
                {creditRules.map((rule) => (
                  <div key={rule} className="rounded-lg bg-white/10 p-3 text-sm text-white/84">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <div className="flex items-center gap-3">
                <WalletCards className="h-6 w-6 text-[#4f3ee2]" aria-hidden="true" />
                <h3 className="font-display text-2xl font-bold">Packs extra</h3>
              </div>
              <div className="mt-5 grid gap-3">
                {addOnPacks.map((pack) => (
                  <div key={pack.name} className="rounded-lg border border-[#e3ebe7] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{pack.name}</p>
                      <p className="font-display text-lg font-bold">{pack.price}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{pack.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="colegios" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <Badge className="bg-[#efedff] text-[#4f3ee2]">Colegios y convenios</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Cuando paga la institucion
            </h2>
            <p className="mt-3 text-[15px] leading-6 text-slate-600">
              El modelo escolar puede subsidiar familias o vender DocenteAI separado. WhatsApp queda
              como bolsa controlada para evitar desbordes de costo.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {schoolPlans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <GraduationCap className="h-6 w-6 text-[#087968]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl font-bold">{plan.name}</h3>
                <p className="mt-2 font-display text-2xl font-bold">{plan.price}</p>
                <p className="mt-2 text-sm leading-5 text-slate-600">{plan.scope}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/58">
              Escenario base
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              {formatter.format(200)} familias Plus cubren una primera validacion comercial.
            </h2>
          </div>
          <Button asChild size="lg" pill className="bg-[#f8d95c] text-slate-950 hover:bg-[#f3ce36]">
            <Link href="/contacto">
              Probar con familias <Sparkles className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
