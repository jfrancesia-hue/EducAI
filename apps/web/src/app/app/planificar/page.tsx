import { AlertCircle, BookOpenCheck, CheckCircle2, Clock, FileText } from "lucide-react";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { LessonPlanForm } from "./_components/lesson-plan-form";
import { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type PlanningModulePageProps = {
  searchParams?: {
    created?: string;
    error?: string;
  };
};

const errorMessages: Record<string, string> = {
  config: "No pudimos preparar el generador en este momento.",
  auth: "Tu sesion expiro. Volve a ingresar.",
  invalid: "Revisa nivel, anio, materia, tema, cantidad de clases y duracion.",
  teacher_profile:
    "Esta cuenta escolar todavia no tiene un perfil docente asociado para guardar clases.",
  api: "No pudimos generar la clase. Reintenta en unos minutos.",
  network: "La conexion fallo. Reintenta en unos minutos.",
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

  const dashboard = session?.access_token
    ? await fetchInstitutionalDashboard(session.access_token)
    : null;
  const createdId = searchParams?.created;
  const error = searchParams?.error;

  return (
    <AppShell
      title="Crear clase"
      eyebrow="Planificacion docente"
      statusNote="EducAI prepara un borrador editable para que el docente lo revise, ajuste y use."
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

          <LessonPlanForm />
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#18b6a4]/25 bg-[#075f53] p-5 text-white shadow-whisper">
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
