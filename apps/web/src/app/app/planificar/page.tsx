import Link from "next/link";
import {
  AlertCircle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";

const fields = [
  {
    title: "Objetivo de aprendizaje",
    text: "Si lo cargas, la IA prioriza ese logro y no genera una clase generica.",
    icon: Target,
    color: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    title: "Contexto del grupo",
    text: "Ayuda a ajustar ritmo, dificultad, consignas y apoyos sin pedir datos sensibles.",
    icon: CalendarDays,
    color: "bg-[#efedff] text-[#4f3ee2]",
  },
  {
    title: "Evaluacion y recursos",
    text: "Evita propuestas imposibles y deja evidencia clara para revisar en clase.",
    icon: FileText,
    color: "bg-[#fff8d7] text-[#876100]",
  },
];

const recentDrafts = [
  ["Matematica 7A", "Proporcionalidad directa", "35 min", "Listo para revisar"],
  ["Lengua 6B", "Texto expositivo", "45 min", "Borrador generado"],
  ["Ciencias 5C", "Ecosistemas", "40 min", "Falta objetivo"],
];

type PlanningModulePageProps = {
  searchParams?: {
    created?: string;
    error?: string;
  };
};

const errorMessages: Record<string, string> = {
  config: "Falta NEXT_PUBLIC_API_URL para conectar el formulario con el API.",
  auth: "No se encontro una sesion valida. Volve a ingresar.",
  invalid: "Revisa grado, materia, tema, sesiones y duracion.",
  api: "El API no pudo generar la clase. Revisar logs del backend.",
  network: "No se pudo conectar con el API.",
};

export default function PlanningModulePage({ searchParams }: PlanningModulePageProps) {
  const createdId = searchParams?.created;
  const error = searchParams?.error;

  return (
    <AppShell title="Modulo de planificacion">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_0.78fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-6 text-white shadow-float">
            <Badge className="bg-[#ff7a1a] text-white">Planificar con agente</Badge>
            <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Converti un tema en una clase lista para editar.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white">
              Carga curso, materia, tema, duracion y cantidad de encuentros. EducAI llama al API y
              guarda la planificacion en el tenant del docente autenticado.
            </p>
          </div>

          {createdId ? (
            <div className="rounded-lg border border-[#18b6a4]/35 bg-[#e7fbf7] p-4 text-[#075c50]">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Clase generada y guardada.</p>
                  <p className="mt-1 text-sm">ID de planificacion: {createdId}</p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#ef5da8]/35 bg-[#fdeaf4] p-4 text-[#8d174f]">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">No se pudo generar la clase.</p>
                  <p className="mt-1 text-sm">{errorMessages[error] ?? errorMessages.api}</p>
                </div>
              </div>
            </div>
          ) : null}

          <form
            action="/app/planificar/generar"
            method="post"
            className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge className="bg-[#e7fbf7] text-[#087968]">Formulario real</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Datos de la clase
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                  Los campos principales alcanzan para generar. Los opcionales mejoran la calidad
                  pedagogica cuando necesitas una clase mas ajustada al grupo.
                </p>
              </div>
              <Button
                type="submit"
                className="min-h-12 bg-[#ff7a1a] px-6 font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]"
              >
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Generar clase
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Grado / anio</span>
                <input
                  name="grade"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="7"
                  required
                  className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Materia</span>
                <input
                  name="subject"
                  defaultValue="Matematica"
                  required
                  className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#33423c]">Tema o contenido</span>
                <input
                  name="topic"
                  defaultValue="Proporcionalidad directa"
                  required
                  className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Cantidad de clases</span>
                <input
                  name="sessionCount"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="1"
                  required
                  className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Duracion total</span>
                <input
                  name="totalDurationMinutes"
                  type="number"
                  min="10"
                  max="600"
                  defaultValue="40"
                  required
                  className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">
                  Objetivo de aprendizaje
                </span>
                <textarea
                  name="learningGoal"
                  rows={2}
                  placeholder="Ej: que puedan resolver problemas de proporcionalidad directa y explicar la estrategia usada."
                  className="resize-none rounded-lg border border-[#d5e1dc] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Contexto del grupo</span>
                  <textarea
                    name="groupProfile"
                    rows={3}
                    placeholder="Ej: 7A, 28 estudiantes, grupo heterogeneo, les cuesta sostener atencion en consignas largas."
                    className="resize-none rounded-lg border border-[#d5e1dc] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Saberes previos</span>
                  <textarea
                    name="priorKnowledge"
                    rows={3}
                    placeholder="Ej: ya trabajaron fracciones equivalentes y tablas simples; no vieron regla de tres formal."
                    className="resize-none rounded-lg border border-[#d5e1dc] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">
                    Marco curricular o enfoque
                  </span>
                  <input
                    name="curriculumContext"
                    placeholder="NAP, diseno provincial, ABP, repaso para evaluacion..."
                    className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Recursos disponibles</span>
                  <input
                    name="availableResources"
                    placeholder="Pizarron, fotocopias, celulares, proyector..."
                    className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Que queres evaluar</span>
                  <input
                    name="assessmentFocus"
                    placeholder="Procedimiento, argumentacion, produccion escrita, trabajo grupal..."
                    className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">
                    Apoyos o adaptaciones
                  </span>
                  <input
                    name="inclusionNeeds"
                    placeholder="Consignas breves, apoyo visual, extension para quienes terminan antes..."
                    className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">
                  Formato de salida esperado
                </span>
                <input
                  name="outputFormat"
                  placeholder="Secuencia editable, guia para imprimir, ticket de salida, rubrica breve..."
                  className="h-11 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-3">
            {fields.map((field) => (
              <article
                key={field.title}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    field.color,
                  ].join(" ")}
                >
                  <field.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                  {field.title}
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{field.text}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#f8d95c]/40 bg-[#fff8d7] p-5 shadow-whisper">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Que necesita este modulo
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Sesion docente autenticada",
                "NEXT_PUBLIC_API_URL en Vercel",
                "API con Supabase service role",
                "ANTHROPIC_API_KEY para generacion real",
                "Fallback local si falta IA",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg bg-white/75 p-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                    aria-hidden="true"
                  />
                  <p className="text-[15px] leading-6 text-[#4f5f58]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Borradores recientes
              </h2>
            </div>
            <div className="mt-5 grid gap-3">
              {recentDrafts.map(([course, topic, time, status]) => (
                <div
                  key={`${course}-${topic}`}
                  className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4"
                >
                  <p className="font-semibold">{course}</p>
                  <p className="mt-1 text-[15px] text-[#4f5f58]">{topic}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-2 text-[15px] text-[#5b6962]">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {time}
                    </span>
                    <Badge className="w-fit bg-[#eef5f3] text-[#33423c]">{status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-[#11231f]">
              <Link href="/app/reportes">Ver reportes</Link>
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
