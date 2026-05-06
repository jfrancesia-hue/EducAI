import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, GraduationCap, Mail, MessageCircle } from "lucide-react";

import { Badge, Button } from "@educai/ui";

type ContactPageProps = {
  searchParams?: {
    enviado?: string;
  };
};

export default function ContactPage({ searchParams }: ContactPageProps) {
  const sent = searchParams?.enviado === "1";

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <section className="bg-[#11231f] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
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

          <div className="grid gap-8 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <Badge className="border-white/20 bg-white/12 text-white" variant="outline">
                Contacto comercial
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
                Conversemos sobre EducAI para tu institucion.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
                Dejanos tus datos, revisa las condiciones y armamos una propuesta segura para
                colegio, red educativa o gobierno.
              </p>
            </div>
            <div className="rounded-lg border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
                <p className="font-display text-xl font-semibold">Antes de avanzar</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/76">
                El cliente puede leer terminos, privacidad y alcance de IA antes de iniciar una
                prueba o contratacion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-whisper">
          <Building2 className="h-7 w-7 text-[#087968]" aria-hidden="true" />
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">
            Implementacion cuidada
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Para vender EducAI conviene empezar con una institucion, medir adopcion docente, revisar
            seguridad y despues ampliar a mas cursos o sedes.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              "Diagnostico comercial y pedagogico",
              "Validacion de privacidad y datos escolares",
              "Plan de pago o propuesta institucional",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-[#eef5f3] p-3 text-sm text-[#33423c]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form
          action="/contacto"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-whisper"
          method="get"
        >
          <input name="enviado" type="hidden" value="1" />
          <h2 className="font-display text-3xl font-bold tracking-tight">Pedir propuesta</h2>
          {sent ? (
            <div className="mt-5 rounded-lg border border-[#18b6a4]/30 bg-[#e7fbf7] p-3 text-sm font-medium text-[#087968]">
              Solicitud registrada para revision visual. En produccion se conecta a CRM o email.
            </div>
          ) : null}
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nombre y apellido</span>
              <input
                required
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none focus:border-[#18b6a4]"
                name="name"
                placeholder="Tu nombre"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email institucional</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-[#18b6a4]">
                <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <input
                  required
                  className="h-full w-full bg-transparent outline-none"
                  name="email"
                  placeholder="direccion@colegio.edu"
                  type="email"
                />
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Institucion</span>
              <input
                required
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none focus:border-[#18b6a4]"
                name="institution"
                placeholder="Colegio, red o ministerio"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mensaje</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#18b6a4]"
                name="message"
                placeholder="Contanos cantidad de docentes, estudiantes y objetivo inicial."
              />
            </label>
            <label className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              <input
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#18b6a4]"
                name="acceptTerms"
                type="checkbox"
              />
              <span>
                Acepto los{" "}
                <Link className="font-semibold text-[#087968] underline" href="/terminos">
                  terminos y condiciones
                </Link>{" "}
                y la{" "}
                <Link className="font-semibold text-[#087968] underline" href="/privacidad">
                  politica de privacidad
                </Link>{" "}
                para que EducAI procese esta solicitud comercial.
              </span>
            </label>
          </div>

          <Button className="mt-6 w-full bg-[#ff7a1a] text-white hover:bg-[#ea6508]" type="submit">
            Enviar solicitud
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </section>
    </main>
  );
}
