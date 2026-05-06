import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";

const sections = [
  {
    title: "1. Alcance del servicio",
    body: "EducAI es una plataforma de asistencia educativa para instituciones, equipos docentes y organizaciones escolares. Ayuda a planificar clases, producir materiales, organizar seguimiento pedagogico y analizar informacion educativa bajo control institucional.",
  },
  {
    title: "2. Uso responsable de IA",
    body: "Las respuestas generadas por IA son borradores de apoyo. Deben ser revisadas por docentes o personal autorizado antes de usarse con estudiantes, familias o equipos directivos. EducAI no reemplaza el criterio pedagogico, profesional o institucional.",
  },
  {
    title: "3. Datos de estudiantes y menores",
    body: "La institucion usuaria debe contar con autorizacion, base legal o consentimiento aplicable para cargar y tratar informacion de estudiantes. EducAI aplica criterio de minimo acceso, segregacion por tenant, roles y controles para reducir exposicion de datos escolares sensibles.",
  },
  {
    title: "4. Privacidad y proteccion de datos",
    body: "El tratamiento de datos debe respetar la Ley 25.326 de Proteccion de Datos Personales de Argentina y normativa aplicable en cada jurisdiccion. Los titulares pueden ejercer derechos de acceso, rectificacion, actualizacion o supresion segun corresponda.",
  },
  {
    title: "5. Cuentas, roles y seguridad",
    body: "Cada usuario debe usar credenciales propias, mantenerlas confidenciales y acceder solo a la informacion autorizada por su institucion. Las rutas internas requieren autenticacion, roles validos y pertenencia al tenant correspondiente.",
  },
  {
    title: "6. Contenido cargado por clientes",
    body: "La institucion conserva responsabilidad sobre datos, documentos, consignas, evaluaciones, imagenes y materiales que cargue en la plataforma. No deben subirse datos innecesarios, discriminatorios, ofensivos o ajenos a la finalidad educativa.",
  },
  {
    title: "7. Planes, pagos y renovaciones",
    body: "Los planes pagos pueden gestionarse mediante Stripe Checkout y suscripciones. Los precios, alcance, limites, renovaciones, cancelaciones y soporte pueden variar segun el acuerdo comercial firmado con cada institucion.",
  },
  {
    title: "8. Disponibilidad y cambios",
    body: "EducAI puede mejorar funciones, controles de seguridad, modelos de IA, integraciones y condiciones operativas. Los cambios relevantes para clientes institucionales deben comunicarse por canales comerciales o administrativos.",
  },
  {
    title: "9. Revision legal",
    body: "Este texto es una base inicial para evaluacion comercial y debe ser revisado por asesoria legal antes de publicar la plataforma en produccion o firmar contratos con instituciones.",
  },
];

const highlights = [
  "Control docente antes de compartir materiales",
  "Datos escolares con minimo acceso",
  "Roles, tenant y trazabilidad",
  "Pagos preparados con Stripe Billing",
];

export default function TermsPage() {
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

          <div className="grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <Badge className="border-white/20 bg-white/12 text-white" variant="outline">
                Terminos y condiciones
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
                Condiciones claras para usar EducAI con instituciones educativas.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
                Una base visible para clientes: IA asistiva, datos escolares protegidos,
                responsabilidad docente, pagos y privacidad.
              </p>
            </div>
            <div className="rounded-lg border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
                <p className="font-display text-xl font-semibold">Puntos clave</p>
              </div>
              <div className="mt-5 grid gap-3">
                {highlights.map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg bg-white/10 p-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-6 text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:px-8">
        <div className="grid gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-whisper"
            >
              <h2 className="font-display text-2xl font-bold tracking-tight">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>

        <aside className="grid h-fit gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-whisper">
            <ShieldCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-bold">Privacidad</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              EducAI debe operar con minimizacion de datos, control de acceso y derechos de
              titulares.
            </p>
            <Button asChild variant="ghost" className="mt-4 px-0 text-[#11231f]">
              <Link href="/privacidad">Ver privacidad</Link>
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-whisper">
            <LockKeyhole className="h-6 w-6 text-[#b82170]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-bold">Seguridad</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Acceso autenticado, roles y aislamiento institucional para datos educativos.
            </p>
            <Button asChild variant="ghost" className="mt-4 px-0 text-[#11231f]">
              <Link href="/seguridad">Ver seguridad</Link>
            </Button>
          </div>
          <div className="rounded-lg border border-[#f8d95c]/40 bg-[#fff6c9] p-5 text-[#584000]">
            <Brain className="h-6 w-6" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-bold">Nota legal</h2>
            <p className="mt-2 text-sm leading-6">
              Este documento es un borrador operativo. Antes del lanzamiento debe ser revisado por
              asesoria legal.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
