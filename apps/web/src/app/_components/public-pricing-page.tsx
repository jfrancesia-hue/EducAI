import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  Landmark,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { hasSupabaseEnv } from "../../lib/supabase/env";
import { PublicPricingCard } from "./public-pricing-card";
import { SchoolPriceCalculator } from "./school-price-calculator";
import { apoyoAiPublicPlans, billingCopy, educaiPublicPlans } from "../../lib/pricing";

const heroImage =
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1800&q=85";

const modules = [
  {
    id: "educai",
    name: "EducAI",
    label: "Docentes y escuelas",
    href: "#educai",
    ctaHref: "/registro?producto=educai&plan=free",
    cta: "Ver planes docentes",
    icon: GraduationCap,
    accent: "bg-[#18b6a4] text-white",
    description:
      "Para planificar clases, producir materiales, ordenar evaluaciones y dar visibilidad pedagogica a escuelas.",
    highlights: [
      "Planificacion docente con IA",
      "Recursos editables para aula",
      "Planes individuales e institucionales",
    ],
  },
  {
    id: "apoyoai",
    name: "ApoyoAI",
    label: "Familias y estudiantes",
    href: "#apoyoai",
    ctaHref: "/registro?producto=apoyoai&plan=free",
    cta: "Ver planes familiares",
    icon: UsersRound,
    accent: "bg-[#f8d95c] text-slate-950",
    description:
      "Para acompanamiento escolar en casa, dudas por app o WhatsApp, tareas, examenes y seguimiento familiar.",
    highlights: [
      "Tutor para cada hijo",
      "WhatsApp en planes pagos",
      "Reportes y diagnosticos segun plan",
    ],
  },
] satisfies Array<{
  id: string;
  name: string;
  label: string;
  href: string;
  ctaHref: Route;
  cta: string;
  icon: LucideIcon;
  accent: string;
  description: string;
  highlights: string[];
}>;

async function getSessionTarget(): Promise<{ href: Route; label: string } | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const metadata = session.user.app_metadata as Record<string, unknown>;
    const role = typeof metadata.role === "string" ? metadata.role : "";
    const product = typeof metadata.product === "string" ? metadata.product : "";
    const href = role === "PARENT" || product === "apoyoai" ? "/familia" : "/app";

    return { href, label: "Ir a mi cuenta" };
  } catch {
    return null;
  }
}

export async function PublicPricingPage() {
  const sessionTarget = await getSessionTarget();
  const accountHref = sessionTarget?.href;
  const accountLabel = sessionTarget?.label;

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <section className="relative overflow-hidden px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <Image
          src={heroImage}
          alt="Docente trabajando con estudiantes en el aula"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,42,37,0.94)_0%,rgba(6,74,65,0.84)_48%,rgba(24,182,164,0.48)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f7f8f3] to-transparent" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/25 bg-white/12 px-4 py-3 text-white shadow-float backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3" aria-label="EducAI inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#075f53]">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none">EducAI</span>
              <span className="block text-sm leading-5 text-white/82">Planes y precios</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/82 md:flex">
            <Link href="#educai" className="transition hover:text-white">
              EducAI
            </Link>
            <Link href="#apoyoai" className="transition hover:text-white">
              ApoyoAI
            </Link>
            <Link href="#cobro" className="transition hover:text-white">
              Cobro
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {sessionTarget ? (
              <Button asChild size="sm" pill className="bg-white text-[#075f53] hover:bg-white/90">
                <Link href={accountHref ?? "/app"}>
                  {accountLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  pill
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/18"
                >
                  <Link href="/login">Ingresar</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  pill
                  className="bg-white text-[#075f53] hover:bg-white/90"
                >
                  <Link href="/registro?producto=educai&plan=free">
                    Registrarse <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:py-24">
          <div>
            <Badge className="border-white/25 bg-[#18b6a4]/28 text-white" variant="outline">
              Elegi el modulo correcto
            </Badge>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.96] tracking-tight text-white sm:text-6xl">
              Planes para docentes, escuelas y familias.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white sm:text-xl">
              EducAI organiza el trabajo docente. ApoyoAI acompana a estudiantes y familias. Los dos
              comparten una base educativa, pero cada flujo tiene planes y registro propios.
            </p>
            {sessionTarget ? (
              <p className="mt-5 inline-flex rounded-full border border-white/25 bg-white/14 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                Ya tenes una sesion iniciada. Podes revisar precios o volver a tu cuenta.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article
                  key={module.id}
                  className="rounded-lg border border-white/28 bg-white/90 p-5 shadow-float backdrop-blur-xl"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${module.accent}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[#087968]">
                    {module.label}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold">{module.name}</h2>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                    {module.description}
                  </p>
                  <ul className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                    {module.highlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#18b6a4]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 grid gap-2">
                    <Button asChild pill className="bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                      <a href={module.href}>
                        {module.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      pill
                      variant="outline"
                      className="border-[#c7dfd8] bg-white text-[#075f53]"
                    >
                      <Link href={accountHref ?? module.ctaHref}>
                        {accountLabel ?? "Registrarse gratis"}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="educai" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[#d8f7ee] text-[#075c50]">EducAI</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Planes para preparar clases
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-6 text-slate-600">
              Para docentes que quieren planificar mas rapido, generar recursos y ordenar el trabajo
              pedagogico. Free sirve para probar; Pro es para uso intensivo.
            </p>
          </div>
          <div className="grid gap-3 rounded-lg border border-[#b9e6dd] bg-[#e7fbf7] p-4 shadow-whisper sm:grid-cols-2">
            <div className="flex gap-3">
              <ClipboardList className="mt-1 h-5 w-5 shrink-0 text-[#087968]" aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-slate-700">
                Clases, actividades, rubricas y secuencias editables.
              </p>
            </div>
            <div className="flex gap-3">
              <Landmark className="mt-1 h-5 w-5 shrink-0 text-[#087968]" aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-slate-700">
                Opciones para docente individual, colegio o institucion.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {educaiPublicPlans.map((plan) => (
            <PublicPricingCard
              key={plan.id}
              plan={plan}
              ctaOverrideHref={accountHref}
              ctaOverrideLabel={accountLabel}
            />
          ))}
        </div>
      </section>

      <section id="colegios" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <Badge className="bg-[#d8f7ee] text-[#075c50]">Instituciones EducAI</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Colegio se calcula por docentes activos
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-6 text-slate-600">
              La base incluye 10 docentes activos. Si un mes usan EducAI mas docentes, el valor se
              ajusta por docente activo adicional.
            </p>
            <div className="mt-6 grid gap-3 rounded-lg border border-[#b9e6dd] bg-[#fbfffd] p-5">
              <p className="font-semibold text-[#075f53]">Ejemplo visible</p>
              <p className="text-sm font-medium leading-6 text-slate-600">
                15 docentes activos = $270.000/mes. Se toma como activo el docente que genero al
                menos una planificacion durante el mes.
              </p>
            </div>
          </div>
          <SchoolPriceCalculator />
        </div>
      </section>

      <section id="apoyoai" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[#d8f7ee] text-[#075c50]">ApoyoAI</Badge>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Planes para acompanamiento familiar
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-6 text-slate-600">
              Para familias que necesitan ayuda con tareas, dudas y examenes. Free prueba el tutor
              por app; los planes pagos suman WhatsApp, audio, fotos y reportes.
            </p>
          </div>
          <div className="grid gap-3 rounded-lg border border-[#b9e6dd] bg-[#e7fbf7] p-4 shadow-whisper sm:grid-cols-2">
            <div className="flex gap-3">
              <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-[#087968]" aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-slate-700">
                App y WhatsApp segun plan, pensado para el uso real de casa.
              </p>
            </div>
            <div className="flex gap-3">
              <BookOpenCheck className="mt-1 h-5 w-5 shrink-0 text-[#087968]" aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-slate-700">
                Diagnosticos y reportes cuando la familia necesita seguimiento.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {apoyoAiPublicPlans.map((plan) => (
            <PublicPricingCard
              key={plan.id}
              plan={plan}
              ctaOverrideHref={accountHref}
              ctaOverrideLabel={accountLabel}
            />
          ))}
        </div>
      </section>

      <section id="cobro" className="bg-[#102b26] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div>
            <Badge className="bg-[#18b6a4] text-white">{billingCopy.title}</Badge>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight">
              Sin vueltas para subir, bajar o probar.
            </h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-white/82">{billingCopy.body}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {billingCopy.faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-lg border border-white/12 bg-white/8 p-5 backdrop-blur"
              >
                <h3 className="font-display text-xl font-bold">{faq.question}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/76">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
