import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";

import { Badge, Button } from "@educai/ui";

type ContactPageProps = {
  searchParams?: Promise<{
    producto?: string;
    plan?: string;
    enviado?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};
  const product = params.producto ?? "";
  const plan = params.plan ?? "";
  const sent = params.enviado === "1";

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Button asChild variant="outline" pill className="border-[#d5e1dc] bg-white text-slate-900">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-6 text-white shadow-whisper">
            <Badge className="bg-white/12 text-white">Contacto comercial</Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight">
              Contanos que queres implementar.
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-white/80">
              Usamos estos datos para responder con el plan correcto, ya sea docente, familia,
              colegio o institucional.
            </p>
            <div className="mt-6 grid gap-3">
              {["Nombre y email", "Institucion si aplica", "Cantidad de docentes o alumnos"].map(
                (item) => (
                  <div key={item} className="flex gap-3 rounded-lg bg-white/10 p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f8d95c]" />
                    <span>{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <form
            action="/contacto/enviar"
            method="post"
            className="rounded-lg border border-[#d5e1dc] bg-white p-6 shadow-whisper"
          >
            {sent ? (
              <div className="mb-5 rounded-lg border border-[#18b6a4]/30 bg-[#e7fbf7] p-4 text-sm font-semibold text-[#075c50]">
                Recibimos tu consulta. Ya quedo registrada para seguimiento.
              </div>
            ) : null}

            <input type="hidden" name="producto" value={product} />
            <input type="hidden" name="plan" value={plan} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Nombre
                <input
                  required
                  name="nombre"
                  autoComplete="name"
                  className="h-12 rounded-lg border border-[#cfdcd7] px-4 font-medium outline-none transition focus:border-[#087968] focus:ring-2 focus:ring-[#18b6a4]/20"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="h-12 rounded-lg border border-[#cfdcd7] px-4 font-medium outline-none transition focus:border-[#087968] focus:ring-2 focus:ring-[#18b6a4]/20"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Institucion
                <input
                  name="institucion"
                  defaultValue={product === "educai" && plan ? "Consulta EducAI" : ""}
                  className="h-12 rounded-lg border border-[#cfdcd7] px-4 font-medium outline-none transition focus:border-[#087968] focus:ring-2 focus:ring-[#18b6a4]/20"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Docentes o alumnos
                <input
                  name="cantidad"
                  type="number"
                  min={0}
                  className="h-12 rounded-lg border border-[#cfdcd7] px-4 font-medium outline-none transition focus:border-[#087968] focus:ring-2 focus:ring-[#18b6a4]/20"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              Mensaje
              <textarea
                name="mensaje"
                rows={5}
                defaultValue={
                  product || plan ? `Quiero consultar por ${product || "EducAI"} ${plan}` : ""
                }
                className="resize-none rounded-lg border border-[#cfdcd7] px-4 py-3 font-medium outline-none transition focus:border-[#087968] focus:ring-2 focus:ring-[#18b6a4]/20"
              />
            </label>

            <Button
              type="submit"
              size="lg"
              pill
              className="mt-6 bg-[#ff7a1a] text-white hover:bg-[#ea6508]"
            >
              Enviar consulta
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
