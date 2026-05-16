import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, MessageCircle, Sparkles } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { PublicPricingCard } from "../../_components/public-pricing-card";
import { apoyoAiPublicPlans, billingCopy } from "../../../lib/pricing";

const heroImage =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=85";

export default function ApoyoAiPricingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <section className="relative min-h-[72vh] overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src={heroImage}
          alt="Familia estudiando en casa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,23,0.94)_0%,rgba(8,13,23,0.82)_50%,rgba(8,13,23,0.38)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f8f3] to-transparent" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white shadow-float backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3" aria-label="EducAI inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none">ApoyoAI</span>
              <span className="block text-sm leading-5 text-white/82">Planes familias</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <Link href="#familias" className="transition hover:text-white">
              Familias
            </Link>
            <Link href="#diferencias" className="transition hover:text-white">
              Diferencias
            </Link>
            <Link href="#cobro" className="transition hover:text-white">
              Cobro
            </Link>
            <Link href="/precios" className="transition hover:text-white">
              EducAI docentes
            </Link>
          </nav>
          <Button asChild size="sm" pill className="bg-white text-slate-950 hover:bg-white/90">
            <Link href="/registro?producto=apoyoai&plan=free">
              Empezar <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(72vh-96px)] max-w-7xl items-center py-14">
          <div className="max-w-3xl">
            <Badge className="border-white/25 bg-[#18b6a4]/22 text-white" variant="outline">
              Apoyo escolar para familias
            </Badge>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl">
              ApoyoAI acompana tareas, dudas y examenes por app y WhatsApp.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white sm:text-xl">
              Planes mensuales en pesos argentinos para elegir cuanto acompanamiento necesita cada
              familia, desde tutor por app hasta seguimiento semanal por hijo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                pill
                className="bg-[#f8d95c] text-slate-950 shadow-float hover:bg-[#f3ce36]"
              >
                <Link href="#familias">
                  Ver planes familiares <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                pill
                variant="outline"
                className="border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              >
                <Link href="/precios">
                  Planes docentes <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="familias" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[#d8f7ee] text-[#075c50]">ApoyoAI</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Planes familiares mensuales
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-600">
              El plan Free es de por vida y permite probar por app. WhatsApp empieza en Basico. Plus
              es el plan recomendado para seguimiento completo.
            </p>
          </div>
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-4 shadow-whisper">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
              Medio de pago
            </p>
            <p className="mt-1 text-[15px] font-semibold text-slate-900">
              Debito automatico con Mercado Pago
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {apoyoAiPublicPlans.map((plan) => (
            <PublicPricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section id="diferencias" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-5 shadow-whisper">
            <MessageCircle className="h-6 w-6 text-[#087968]" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl font-bold">Free es solo app</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sirve para probar el tutor sin tarjeta. WhatsApp, audio y reportes empiezan en planes
              pagos.
            </p>
          </article>
          <article className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-5 shadow-whisper">
            <Sparkles className="h-6 w-6 text-[#ff7a1a]" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl font-bold">Plus suma seguimiento</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Habilita audio, fotos de tareas, diagnostico mensual y reporte semanal para la
              familia.
            </p>
          </article>
          <article className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-5 shadow-whisper">
            <GraduationCap className="h-6 w-6 text-[#4f3ee2]" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl font-bold">Intensivo diagnostica mas</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Frente a Familiar, la diferencia principal es el diagnostico semanal por hijo para
              momentos de alto uso.
            </p>
          </article>
        </div>
      </section>

      <section id="cobro" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-6 text-white shadow-whisper">
            <Badge className="bg-white/12 text-white">{billingCopy.title}</Badge>
            <p className="mt-5 text-lg font-semibold leading-8">{billingCopy.body}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {billingCopy.faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5"
              >
                <h3 className="font-display text-xl font-bold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
