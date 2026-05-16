import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Landmark, Sparkles } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { PublicPricingCard } from "../_components/public-pricing-card";
import { SchoolPriceCalculator } from "../_components/school-price-calculator";
import { billingCopy, educaiPublicPlans } from "../../lib/pricing";

const heroImage =
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=85";

export default function EducaiPricingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <section className="relative min-h-[72vh] overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src={heroImage}
          alt="Docente trabajando con estudiantes en el aula"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,23,0.94)_0%,rgba(8,13,23,0.82)_48%,rgba(8,13,23,0.36)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f8f3] to-transparent" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white shadow-float backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3" aria-label="EducAI inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none">EducAI</span>
              <span className="block text-sm leading-5 text-white/82">Planes docentes</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <Link href="#docentes" className="transition hover:text-white">
              Docentes
            </Link>
            <Link href="#colegios" className="transition hover:text-white">
              Colegios
            </Link>
            <Link href="#cobro" className="transition hover:text-white">
              Cobro
            </Link>
            <Link href="/apoyoai/precios" className="transition hover:text-white">
              ApoyoAI
            </Link>
          </nav>
          <Button asChild size="sm" pill className="bg-white text-slate-950 hover:bg-white/90">
            <Link href="/registro?producto=educai&plan=free">
              Empezar <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(72vh-96px)] max-w-7xl items-center py-14">
          <div className="max-w-3xl">
            <Badge className="border-white/25 bg-[#18b6a4]/22 text-white" variant="outline">
              Planes para docentes y escuelas
            </Badge>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl">
              EducAI convierte ideas docentes en clases, recursos y evaluaciones.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white sm:text-xl">
              Elegi un plan mensual en pesos argentinos para planificar mejor, producir materiales
              editables y ordenar el trabajo pedagogico sin sumar carga administrativa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                pill
                className="bg-[#f8d95c] text-slate-950 shadow-float hover:bg-[#f3ce36]"
              >
                <Link href="#docentes">
                  Ver planes docentes <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                pill
                variant="outline"
                className="border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              >
                <Link href="/contacto?producto=educai&plan=colegio">
                  Consultar colegio <Landmark className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="docentes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[#d8f7ee] text-[#075c50]">EducAI</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Planes para preparar clases
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-600">
              El Free es de por vida y los planes pagos se cobran por mes. Docente Pro es el plan
              recomendado para trabajo docente intensivo.
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
          {educaiPublicPlans.map((plan) => (
            <PublicPricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section id="colegios" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <Badge className="bg-[#fff2b8] text-[#5f4600]">Instituciones</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Colegio se calcula por docentes activos
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-600">
              La base incluye 10 docentes activos. Si un mes usan EducAI mas docentes, el valor se
              ajusta por docente activo adicional.
            </p>
            <div className="mt-6 grid gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-5">
              <p className="font-semibold">Ejemplo visible</p>
              <p className="text-sm leading-6 text-slate-600">
                15 docentes activos = $270.000/mes. Se toma como activo el docente que genero al
                menos una planificacion durante el mes.
              </p>
            </div>
          </div>
          <SchoolPriceCalculator />
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
