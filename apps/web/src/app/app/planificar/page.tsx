import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  ListChecks,
} from "lucide-react";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { LessonPlanForm } from "./_components/lesson-plan-form";
import { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";
import { fetchLessonPlan, type LessonPlanDetail } from "../../../lib/api/lesson-plans";
import { getEducaiAppAuth } from "../../../lib/supabase/app-auth";

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
  quota:
    "Alcanzaste el limite de planificaciones de tu plan. Actualiza tu plan para seguir generando clases.",
  api: "No pudimos generar la clase. Reintenta en unos minutos.",
  network: "La conexion fallo. Reintenta en unos minutos.",
};

const outputItems = [
  "Secuencia de clase con tiempos",
  "Actividad principal y consigna",
  "Criterios de evaluacion",
  "Cierre o ticket de salida",
];

type LessonSession = {
  number?: number;
  duration?: number;
  phases?: Array<{
    name?: string;
    duration?: number;
    activities?: string[];
  }>;
  resources?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (isRecord(item)) {
          const candidate = item.title ?? item.name ?? item.text ?? item.description ?? item.prompt;
          return typeof candidate === "string" ? candidate : null;
        }

        return null;
      })
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function toSessions(value: unknown): LessonSession[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((session) => ({
    number: typeof session.number === "number" ? session.number : undefined,
    duration: typeof session.duration === "number" ? session.duration : undefined,
    phases: Array.isArray(session.phases)
      ? session.phases.filter(isRecord).map((phase) => ({
          name: typeof phase.name === "string" ? phase.name : "Momento",
          duration: typeof phase.duration === "number" ? phase.duration : undefined,
          activities: toTextList(phase.activities),
        }))
      : [],
    resources: toTextList(session.resources),
  }));
}

function assessmentList(plan: LessonPlanDetail) {
  if (!isRecord(plan.assessment)) {
    return [];
  }

  return [
    ...toTextList(plan.assessment.rubric),
    ...toTextList(plan.assessment.instruments).map((item) => `Instrumento: ${item}`),
  ];
}

function GeneratedLessonPlan({ plan }: { plan: LessonPlanDetail }) {
  const objectives = toTextList(plan.objectives);
  const sessions = toSessions(plan.activities);
  const resources = toTextList(plan.resources);
  const assessment = assessmentList(plan);

  return (
    <article className="rounded-lg border border-[#18b6a4]/30 bg-white shadow-whisper">
      <div className="border-b border-[#e3ebe7] bg-[#fbfffd] p-5">
        <Badge className="bg-[#e7fbf7] text-[#087968]">Guia generada</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {plan.subject} - {plan.topic}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 text-[15px] font-medium text-[#4f5f58]">
          <span className="rounded-lg bg-[#eef5f3] px-3 py-1">Año {plan.grade}</span>
          <span className="rounded-lg bg-[#eef5f3] px-3 py-1">{plan.durationMinutes} min</span>
          <span className="rounded-lg bg-[#eef5f3] px-3 py-1">{plan.status}</span>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        {objectives.length ? (
          <section className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-[#087968]" aria-hidden="true" />
              <h3 className="font-display text-xl font-bold tracking-tight">Objetivos</h3>
            </div>
            <ul className="mt-3 grid gap-2 text-[15px] leading-6 text-[#33423c]">
              {objectives.map((objective) => (
                <li key={objective} className="rounded-lg bg-white px-3 py-2">
                  {objective}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {sessions.length ? (
          <section className="grid gap-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#087968]" aria-hidden="true" />
              <h3 className="font-display text-xl font-bold tracking-tight">Secuencia</h3>
            </div>
            {sessions.map((session, index) => (
              <div key={session.number ?? index} className="rounded-lg border border-[#e3ebe7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">Clase {session.number ?? index + 1}</p>
                  {session.duration ? (
                    <span className="text-sm font-semibold text-[#5b6962]">
                      {session.duration} min
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3">
                  {session.phases?.map((phase, phaseIndex) => (
                    <div
                      key={`${phase.name}-${phaseIndex}`}
                      className="rounded-lg bg-[#fbfffd] p-3"
                    >
                      <p className="font-semibold">
                        {phase.name}
                        {phase.duration ? ` - ${phase.duration} min` : ""}
                      </p>
                      <ul className="mt-2 grid gap-1 text-[15px] leading-6 text-[#33423c]">
                        {phase.activities?.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {resources.length ? (
            <section className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4">
              <h3 className="font-display text-xl font-bold tracking-tight">Recursos</h3>
              <ul className="mt-3 grid gap-2 text-[15px] leading-6 text-[#33423c]">
                {resources.map((resource) => (
                  <li key={resource}>{resource}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {assessment.length ? (
            <section className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4">
              <h3 className="font-display text-xl font-bold tracking-tight">Evaluacion</h3>
              <ul className="mt-3 grid gap-2 text-[15px] leading-6 text-[#33423c]">
                {assessment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function PlanningModulePage({ searchParams }: PlanningModulePageProps) {
  const { accessToken } = await getEducaiAppAuth();

  const createdId = searchParams?.created;
  const [dashboard, createdPlan] = accessToken
    ? await Promise.all([
        fetchInstitutionalDashboard(accessToken),
        createdId ? fetchLessonPlan(accessToken, createdId) : Promise.resolve(null),
      ])
    : [null, null];
  const error = searchParams?.error;

  return (
    <AppShell
      title="Crear clase"
      eyebrow="Planificación docente"
      statusNote="EducAI prepara un borrador editable para que lo revises, ajustes y uses en clase."
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

          {createdPlan ? <GeneratedLessonPlan plan={createdPlan} /> : null}

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

          <LessonPlanForm accessToken={accessToken} />
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
                  <a
                    key={plan.id}
                    href={`/app/planificar?created=${encodeURIComponent(plan.id)}`}
                    className="block rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4 transition hover:border-[#18b6a4]/70 hover:bg-[#f3fffc]"
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
                  </a>
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
