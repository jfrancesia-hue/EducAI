import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@educai/ui";

const sections = [
  {
    title: "Uso del servicio",
    body: "EducAI y ApoyoAI son herramientas de apoyo educativo. Las planificaciones, respuestas, actividades y sugerencias se entregan como borradores revisables y no reemplazan el criterio profesional docente ni la responsabilidad del adulto a cargo.",
  },
  {
    title: "Registro y veracidad de datos",
    body: "Quien crea una cuenta declara que la información cargada es verdadera, que tiene autorización para registrar datos de estudiantes o instituciones y que mantendrá actualizados los datos relevantes.",
  },
  {
    title: "Cuentas de menores",
    body: "Los estudiantes menores de edad no deben registrarse por cuenta propia. El alta debe realizarla un adulto responsable o una institución educativa autorizada.",
  },
  {
    title: "Contenido permitido",
    body: "No se debe cargar contenido ilegal, discriminatorio, violento, datos sensibles innecesarios ni información de terceros sin autorización. Podemos suspender accesos ante usos indebidos.",
  },
  {
    title: "Pagos y planes",
    body: "Los planes pagos, promociones, renovaciones y cancelaciones se informan durante la contratación. Cuando intervengan procesadores de pago, también aplican sus condiciones.",
  },
  {
    title: "Cambios",
    body: "Podemos actualizar estos términos para reflejar mejoras del servicio, cambios operativos o exigencias normativas. La versión vigente estará disponible en esta página.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#62dcca] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-lg border border-white/45 bg-white p-6 shadow-float sm:p-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-display text-lg font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#075f53] text-white">
              <FileText className="h-5 w-5" aria-hidden="true" />
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
            Terminos y condiciones
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight">
            Reglas claras para usar EducAI y ApoyoAI con responsabilidad.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Al crear una cuenta aceptas estas condiciones, la politica de privacidad y el uso de la
            plataforma para fines educativos legitimos.
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
