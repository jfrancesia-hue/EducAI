import { redirect } from "next/navigation";
import { AlertCircle, BookOpenCheck, CheckCircle2, Clock, FileText, Sparkles } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type PlanningModulePageProps = {
  searchParams?: {
    created?: string;
    error?: string;
  };
};

const errorMessages: Record<string, string> = {
  config: "Falta NEXT_PUBLIC_API_URL para conectar con el API.",
  auth: "No se encontro una sesion valida. Volve a ingresar.",
  invalid: "Revisa grado, materia, tema, cantidad de clases y duracion.",
  api: "El API no pudo generar la clase. Revisar logs del backend.",
  network: "No se pudo conectar con el API.",
};

const outputItems = [
  "Secuencia de clase con tiempos",
  "Actividad principal y consigna",
  "Criterios de evaluacion",
  "Cierre o ticket de salida",
];

export default async function PlanningModulePage({ searchParams }: PlanningModulePageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const dashboard = await fetchInstitutionalDashboard(session.access_token);
  const createdId = searchParams?.created;
  const error = searchParams?.error;

  return (
    <AppShell
      title="Crear clase"
      eyebrow="Planificacion docente"
      statusNote="EducAI genera un borrador editable. El docente siempre revisa antes de usarlo."
    >
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid content-start gap-5">
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
            className="rounded-lg border border-[#d5e1dc] bg-white shadow-whisper"
          >
            <div className="border-b border-[#e3ebe7] p-5">
              <Badge className="bg-[#e7fbf7] text-[#087968]">Nuevo borrador</Badge>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                Datos minimos de la clase
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                Completa lo esencial. Los ajustes finos quedan abajo y son opcionales.
              </p>
            </div>

            <div className="grid gap-5 p-5">
              <div className="grid gap-4 md:grid-cols-[0.45fr_1fr]">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Grado / anio</span>
                  <input
                    name="grade"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue="7"
                    required
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Materia</span>
                  <input
                    name="subject"
                    defaultValue="Matematica"
                    required
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Tema</span>
                <input
                  name="topic"
                  defaultValue="Proporcionalidad directa"
                  required
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Cantidad de clases</span>
                  <input
                    name="sessionCount"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="1"
                    required
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">
                    Duracion total en minutos
                  </span>
                  <input
                    name="totalDurationMinutes"
                    type="number"
                    min="10"
                    max="600"
                    defaultValue="40"
                    required
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">
                  Objetivo de aprendizaje
                </span>
                <textarea
                  name="learningGoal"
                  rows={3}
                  placeholder="Ej: resolver problemas de proporcionalidad directa y explicar la estrategia usada."
                  className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#18b6a4]"
                />
              </label>

              <details className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd]">
                <summary className="cursor-pointer px-4 py-3 font-semibold text-[#11231f]">
                  Ajustes opcionales
                </summary>
                <div className="grid gap-4 border-t border-[#e3ebe7] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[#33423c]">
                        Contexto del grupo
                      </span>
                      <textarea
                        name="groupProfile"
                        rows={3}
                        placeholder="Ej: grupo heterogeneo, consignas breves, ritmo medio."
                        className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#18b6a4]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[#33423c]">Saberes previos</span>
                      <textarea
                        name="priorKnowledge"
                        rows={3}
                        placeholder="Ej: ya trabajaron fracciones equivalentes y tablas simples."
                        className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#18b6a4]"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[#33423c]">
                        Recursos disponibles
                      </span>
                      <input
                        name="availableResources"
                        placeholder="Pizarron, fotocopias, proyector..."
                        className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[#33423c]">
                        Que queres evaluar
                      </span>
                      <input
                        name="assessmentFocus"
                        placeholder="Procedimiento, argumentacion, trabajo grupal..."
                        className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[#33423c]">Marco curricular</span>
                      <input
                        name="curriculumContext"
                        placeholder="NAP, diseno provincial, repaso..."
                        className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[#33423c]">
                        Apoyos o adaptaciones
                      </span>
                      <input
                        name="inclusionNeeds"
                        placeholder="Apoyo visual, consignas cortas, extension..."
                        className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#33423c]">Formato de salida</span>
                    <input
                      name="outputFormat"
                      placeholder="Secuencia editable, guia para imprimir, rubrica breve..."
                      className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] outline-none focus:border-[#18b6a4]"
                    />
                  </label>
                </div>
              </details>

              <div className="flex flex-col gap-3 border-t border-[#e3ebe7] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[15px] leading-6 text-[#4f5f58]">
                  Se guarda como planificacion del tenant autenticado.
                </p>
                <Button
                  type="submit"
                  className="min-h-12 bg-[#ff7a1a] px-6 font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]"
                >
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Crear clase
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Salida esperada</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {outputItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg bg-white/10 p-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#62dcca]"
                    aria-hidden="true"
                  />
                  <p className="text-[15px] leading-6 text-white/86">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Ultimas clases</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {dashboard?.recentLessonPlans.length ? (
                dashboard.recentLessonPlans.slice(0, 5).map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4"
                  >
                    <p className="font-semibold">
                      {plan.subject} - {plan.topic}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-2 text-[15px] text-[#5b6962]">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        Grado {plan.grade} - {plan.durationMinutes} min
                      </span>
                      <Badge className="w-fit bg-[#eef5f3] text-[#33423c]">{plan.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[15px] leading-6 text-[#4f5f58]">
                  Todavia no hay clases generadas en este alcance.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
