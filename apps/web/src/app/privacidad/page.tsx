import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@educai/ui";

const sections = [
  {
    title: "Datos que podemos tratar",
    body: "Datos de cuenta, rol, institución, información de estudiantes cargada por adultos responsables o equipos autorizados, actividad de uso, preferencias pedagógicas y datos necesarios para pagos o soporte.",
  },
  {
    title: "Para que se usan",
    body: "Para prestar EducAI y ApoyoAI, personalizar la experiencia educativa, generar planificaciones o acompañamiento, proteger cuentas, cumplir obligaciones operativas y mejorar el servicio.",
  },
  {
    title: "Menores de edad",
    body: "Los datos de estudiantes deben ser cargados por un adulto responsable, una institución educativa autorizada o una persona con facultades suficientes. No se debe cargar información sensible innecesaria.",
  },
  {
    title: "Proveedores",
    body: "Podemos usar proveedores de infraestructura, autenticación, pagos, analítica, comunicación e inteligencia artificial bajo criterios de seguridad, mínimo acceso y finalidad educativa.",
  },
  {
    title: "Derechos y contacto",
    body: "Las personas titulares o responsables pueden solicitar acceso, rectificacion, actualizacion o eliminacion de datos cuando corresponda escribiendo al canal de contacto de Nativos Consultora Digital.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#62dcca] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-lg border border-white/45 bg-white p-6 shadow-float sm:p-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-display text-lg font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#075f53] text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            EducAI
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Inicio
            </Link>
          </Button>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#087968]">
            Politica de privacidad
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight">
            Cuidamos la información educativa con acceso limitado y finalidad clara.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Esta politica resume como tratamos datos en EducAI y ApoyoAI. La información educativa
            se usa para prestar el servicio, acompañar aprendizajes y proteger a estudiantes,
            familias e instituciones.
          </p>
        </section>

        <section className="grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-[#d5e1dc] p-5">
              <h2 className="font-display text-2xl font-bold tracking-tight">{section.title}</h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
