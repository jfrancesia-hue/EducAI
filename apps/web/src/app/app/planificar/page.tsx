import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { LessonPlanDocumentActions } from "./_components/lesson-plan-document-actions";
import { LessonPlanFeedback } from "./_components/lesson-plan-feedback";
import { LessonPlanForm } from "./_components/lesson-plan-form";
import { LessonPlanOpenRetry } from "./_components/lesson-plan-open-retry";
import { RevealOnScroll } from "./_components/reveal-on-scroll";
import { SeccionImagenes } from "./_components/sections/seccion-imagenes";
import { SeccionVideos } from "./_components/sections/seccion-videos";
import { fetchPlanningDashboard } from "../../../lib/api/institutional-dashboard";
import { fetchLessonPlan, type LessonPlanDetail } from "../../../lib/api/lesson-plans";
import { fetchTeacherCourses } from "../../../lib/api/teacher-courses";
import { getEducaiAppAuth } from "../../../lib/supabase/app-auth";

type PlanningModulePageProps = {
  searchParams?: {
    created?: string;
    error?: string;
    feedback?: string;
    courseId?: string;
  };
};

const errorMessages: Record<string, string> = {
  config: "No pudimos preparar el generador en este momento.",
  auth: "Tu sesión expiró. Volvé a ingresar.",
  invalid: "Revisá nivel, año, materia, tema, cantidad de clases y duración.",
  teacher_profile:
    "Esta cuenta escolar todavía no tiene un perfil docente asociado para guardar clases.",
  quota:
    "Alcanzaste el límite de planificaciones de tu plan. Actualizá tu plan para seguir generando clases.",
  ai_unavailable:
    "La IA de planificación no respondió. No guardamos una guía automática de baja calidad; reintentá en unos minutos.",
  api: "No pudimos generar la clase. Reintentá en unos minutos.",
  network: "La conexión falló. Reintentá en unos minutos.",
};

const feedbackMessages: Record<string, string> = {
  saved: "Feedback guardado. Gracias.",
  invalid: "Elegí una calificación de 1 a 5 estrellas.",
  auth: "Tu sesión expiró. Volvé a ingresar.",
  error: "No pudimos guardar el feedback.",
};

const outputItems = [
  "Secuencia de clase con tiempos",
  "Actividad principal y consigna",
  "Criterios de evaluación",
  "Cierre o ticket de salida",
];

const LESSON_DOCUMENT_ID = "generated-lesson-plan-document";

type LessonSession = {
  number?: number;
  duration?: number;
  phases?: Array<{
    name?: string;
    duration?: number;
    activities?: string[];
  }>;
  resources?: string[];
  differentiation?: {
    low?: string;
    medium?: string;
    high?: string;
  };
};

type EducaiLessonGuide = {
  vistaDocente?: {
    titulo?: string;
    resumen?: string;
    focoPedagogico?: string;
    productoEsperado?: string;
  };
  saberesClave?: Array<{
    nombre?: string;
    explicacionSimple?: string;
    ejemploDelTema?: string;
    errorComun?: string;
  }>;
  objetivosAprendizaje?: Array<{ objetivo?: string; evidenciaObservable?: string }>;
  secuencia?: Array<{
    claseNumero?: number;
    duracion?: number;
    momentos?: Array<{
      nombre?: string;
      duracion?: number;
      proposito?: string;
      consignaDocente?: string;
      actividadEstudiantes?: string;
      ejemploConcreto?: string;
      intervencionDocente?: string;
      cierreParcial?: string;
    }>;
  }>;
  actividadCentral?: {
    titulo?: string;
    consignaListaParaUsar?: string;
    pasos?: string[];
    produccionEsperada?: string;
    variantes?: string[];
  };
  materialesEditables?: Array<{ nombre?: string; contenido?: string; comoUsarlo?: string }>;
  evaluacion?: {
    criterios?: string[];
    instrumento?: string;
    ticketSalida?: string;
    retroalimentacionSugerida?: string;
  };
  diferenciacion?: {
    apoyoFuerte?: string;
    grupoBase?: string;
    extension?: string;
  };
  recursosDidacticos?: {
    adecuacionNivel?: string;
    recomendacionesClase?: string[];
    imagenesSugeridas?: Array<{
      titulo?: string;
      descripcion?: string;
      usoDidactico?: string;
      busquedaSugerida?: string;
      // Campos enriquecidos por el server post-LLM (fase B). Pueden venir vacíos
      // en guías históricas o si Pexels/Unsplash no devolvió nada.
      urls?: { thumbnail?: string; medium?: string; large?: string };
      autor?: { name?: string; profileUrl?: string };
      attribution?: string;
      proveedor?: "pexels" | "unsplash";
      downloadLocation?: string;
    }>;
    videosSugeridos?: Array<{
      titulo?: string;
      busquedaYoutube?: string;
      criterioSeleccion?: string;
      momentoUso?: string;
      embedId?: string;
      urlEmbed?: string;
      urlBusqueda?: string;
      thumbnail?: string;
      verificado?: boolean;
    }>;
  };
  erroresFrecuentes?: Array<{ error?: string; comoDetectarlo?: string; comoIntervenir?: string }>;
  recursosOpcionales?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Acepta una URL solo si el scheme es `http:` o `https:`. Bloquea `javascript:`,
 * `data:`, `file:`, etc. — defensa contra XSS cuando renderizamos URLs que vienen
 * de servicios externos (autor de Unsplash, embed de YouTube, thumbnail de Pexels).
 * Devuelve undefined si la URL no pasa validación; el caller decide qué hacer.
 */
function safeHttpUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function metadataValue(metadata: unknown, key: string) {
  if (!isRecord(metadata)) {
    return "";
  }

  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function canExportPlan(plan: string) {
  return !["", "free"].includes(plan.trim().toLowerCase());
}

type LessonPlanQuota = NonNullable<
  NonNullable<Awaited<ReturnType<typeof fetchPlanningDashboard>>>["lessonPlanQuota"]
>;

function quotaPeriodLabel(period: LessonPlanQuota["period"]) {
  if (period === "monthly") {
    return "este mes";
  }

  if (period === "lifetime") {
    return "en tu cuenta";
  }

  return "";
}

function LessonPlanQuotaNotice({ quota }: { quota: LessonPlanQuota }) {
  if (!quota || quota.period === "unlimited" || quota.remaining === null) {
    return null;
  }

  const exhausted = quota.remaining <= 0;
  const period = quotaPeriodLabel(quota.period);
  const extraText =
    quota.extraCredits > 0
      ? ` Incluye ${quota.extraCredits} crédito${quota.extraCredits === 1 ? "" : "s"} extra.`
      : "";

  if (exhausted) {
    return (
      <div className="rounded-lg border border-[#ef5da8]/35 bg-[#fdeaf4] p-5 text-[#8d174f] shadow-whisper">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="grid gap-3">
            <div>
              <p className="font-bold">Ya usaste todas las planificaciones de tu plan.</p>
              <p className="mt-1 text-sm leading-6">
                Usaste {quota.used} de {quota.effectiveLimit} disponibles {period}. Para generar
                otra guía, actualizá tu plan o agregá créditos.
                {extraText}
              </p>
            </div>
            <a
              href="/app/planes"
              className="w-fit rounded-lg bg-[#075f53] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#087968]"
            >
              Ver planes
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#18b6a4]/30 bg-[#e7fbf7] p-4 text-[#075c50]">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">
            Te {quota.remaining === 1 ? "queda" : "quedan"} {quota.remaining}{" "}
            {quota.remaining === 1 ? "planificación disponible" : "planificaciones disponibles"}.
          </p>
          <p className="mt-1 text-sm leading-6">
            Usaste {quota.used} de {quota.effectiveLimit} {period}.{extraText}
          </p>
        </div>
      </div>
    </div>
  );
}

function youtubeSearchHref(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function stockSearchHref(provider: "pexels" | "unsplash", query: string) {
  const encoded = encodeURIComponent(query);
  return provider === "pexels"
    ? `https://www.pexels.com/search/${encoded}/`
    : `https://unsplash.com/s/photos/${encoded}`;
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
    differentiation: isRecord(session.differentiation)
      ? {
          low:
            typeof session.differentiation.low === "string"
              ? session.differentiation.low
              : undefined,
          medium:
            typeof session.differentiation.medium === "string"
              ? session.differentiation.medium
              : undefined,
          high:
            typeof session.differentiation.high === "string"
              ? session.differentiation.high
              : undefined,
        }
      : undefined,
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

function planOverview(plan: LessonPlanDetail) {
  if (!isRecord(plan.adaptations)) {
    return null;
  }

  return typeof plan.adaptations.overview === "string" ? plan.adaptations.overview : null;
}

function printableList(plan: LessonPlanDetail) {
  if (!isRecord(plan.adaptations) || !Array.isArray(plan.adaptations.printables)) {
    return [];
  }

  return plan.adaptations.printables.filter(isRecord).map((printable) => ({
    name: typeof printable.name === "string" ? printable.name : "Material imprimible",
    prompt: typeof printable.prompt === "string" ? printable.prompt : "",
  }));
}

function richGuide(plan: LessonPlanDetail): EducaiLessonGuide | null {
  if (!isRecord(plan.adaptations) || !isRecord(plan.adaptations.guide)) {
    return null;
  }

  return plan.adaptations.guide;
}

function lessonPlanTitle(plan: LessonPlanDetail) {
  const guide = richGuide(plan);
  return guide?.vistaDocente?.titulo || `${plan.subject} - ${plan.topic}`;
}

function RichGuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function A4Page({ children }: { children: ReactNode }) {
  return (
    <section className="lesson-a4-page min-h-[1120px] w-full max-w-[210mm] rounded-sm border border-[#d5e1dc] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(31,42,36,0.12)] sm:px-10 sm:py-12">
      {children}
    </section>
  );
}

function GeneratedLessonPlan({
  documentId = LESSON_DOCUMENT_ID,
  plan,
}: {
  documentId?: string;
  plan: LessonPlanDetail;
}) {
  const guide = richGuide(plan);
  const overview = planOverview(plan);
  const objectives = toTextList(plan.objectives);
  const competences = toTextList(plan.competences);
  const sessions = toSessions(plan.activities);
  const resources = toTextList(plan.resources);
  const assessment = assessmentList(plan);
  const printables = printableList(plan);

  if (guide) {
    return (
      <article
        id={documentId}
        className="lesson-a4-document mx-auto grid w-full max-w-[820px] gap-6"
      >
        <A4Page>
          <div className="border-b border-[#d5e1dc] pb-7">
            <Badge className="bg-[#e7fbf7] text-[#087968]">Guía docente</Badge>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
              {guide.vistaDocente?.titulo || `${plan.subject} - ${plan.topic}`}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-[15px] font-medium text-[#11231f]">
              <span className="rounded-lg bg-[#eef5f3] px-3 py-1">Año {plan.grade}</span>
              <span className="rounded-lg bg-[#eef5f3] px-3 py-1">{plan.durationMinutes} min</span>
              <span className="rounded-lg bg-[#eef5f3] px-3 py-1">{plan.status}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            <RichGuideSection title="Vista docente">
              <div className="grid gap-3 text-[15px] leading-7 text-[#11231f]">
                {guide.vistaDocente?.resumen ? <p>{guide.vistaDocente.resumen}</p> : null}
                {guide.vistaDocente?.focoPedagogico ? (
                  <p>
                    <span className="font-semibold">Foco:</span> {guide.vistaDocente.focoPedagogico}
                  </p>
                ) : null}
                {guide.vistaDocente?.productoEsperado ? (
                  <p>
                    <span className="font-semibold">Producto esperado:</span>{" "}
                    {guide.vistaDocente.productoEsperado}
                  </p>
                ) : null}
              </div>
            </RichGuideSection>

            {guide.saberesClave?.length ? (
              <RichGuideSection title="Saberes clave">
                <div className="grid gap-3 md:grid-cols-2">
                  {guide.saberesClave.map((item, index) => (
                    <div key={`${item.nombre}-${index}`} className="rounded-lg bg-white p-3">
                      <p className="font-semibold">{item.nombre}</p>
                      <p className="mt-2 text-[15px] leading-6 text-[#11231f]">
                        {item.explicacionSimple}
                      </p>
                      {item.ejemploDelTema ? (
                        <p className="mt-2 text-[15px] leading-6 text-[#11231f]">
                          <span className="font-semibold">Ejemplo:</span> {item.ejemploDelTema}
                        </p>
                      ) : null}
                      {item.errorComun ? (
                        <p className="mt-2 text-[15px] leading-6 text-[#8d174f]">
                          <span className="font-semibold">Error común:</span> {item.errorComun}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </RichGuideSection>
            ) : null}

            {guide.objetivosAprendizaje?.length ? (
              <RichGuideSection title="Objetivos y evidencias">
                <ul className="grid gap-2 text-[15px] leading-6 text-[#11231f]">
                  {guide.objetivosAprendizaje.map((objective, index) => (
                    <li
                      key={`${objective.objetivo}-${index}`}
                      className="rounded-lg bg-white px-3 py-2"
                    >
                      <span className="font-semibold">{objective.objetivo}</span>
                      {objective.evidenciaObservable
                        ? ` Evidencia: ${objective.evidenciaObservable}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </RichGuideSection>
            ) : null}
          </div>
        </A4Page>

        {guide.secuencia?.length ? (
          <A4Page>
            <section className="grid gap-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[#087968]" aria-hidden="true" />
                <h3 className="font-display text-xl font-bold tracking-tight">Secuencia</h3>
              </div>
              {guide.secuencia.map((session, index) => (
                <div
                  key={session.claseNumero ?? index}
                  className="rounded-lg border border-[#e3ebe7] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">Clase {session.claseNumero ?? index + 1}</p>
                    {session.duracion ? (
                      <span className="text-sm font-semibold text-[#11231f]">
                        {session.duracion} min
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3">
                    {session.momentos?.map((moment, momentIndex) => (
                      <div
                        key={`${moment.nombre}-${momentIndex}`}
                        className="rounded-lg bg-[#fbfffd] p-3"
                      >
                        <p className="font-semibold">
                          {moment.nombre}
                          {moment.duracion ? ` - ${moment.duracion} min` : ""}
                        </p>
                        <div className="mt-2 grid gap-2 text-[15px] leading-6 text-[#11231f]">
                          {[
                            ["Propósito", moment.proposito],
                            ["Consigna docente", moment.consignaDocente],
                            ["Actividad estudiantes", moment.actividadEstudiantes],
                            ["Ejemplo concreto", moment.ejemploConcreto],
                            ["Intervención docente", moment.intervencionDocente],
                            ["Cierre parcial", moment.cierreParcial],
                          ].map(([label, value]) =>
                            value ? (
                              <p key={label}>
                                <span className="font-semibold">{label}:</span> {value}
                              </p>
                            ) : null,
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </A4Page>
        ) : null}

        <A4Page>
          <div className="grid gap-6">
            {guide.actividadCentral ? (
              <RichGuideSection title="Actividad central">
                <div className="grid gap-3 text-[15px] leading-6 text-[#11231f]">
                  <p className="font-semibold">{guide.actividadCentral.titulo}</p>
                  <p>{guide.actividadCentral.consignaListaParaUsar}</p>
                  {guide.actividadCentral.pasos?.length ? (
                    <ol className="grid list-decimal gap-1 pl-5">
                      {guide.actividadCentral.pasos.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                  {guide.actividadCentral.produccionEsperada ? (
                    <p>
                      <span className="font-semibold">Producción esperada:</span>{" "}
                      {guide.actividadCentral.produccionEsperada}
                    </p>
                  ) : null}
                </div>
              </RichGuideSection>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {guide.evaluacion ? (
                <RichGuideSection title="Evaluación">
                  <div className="grid gap-2 text-[15px] leading-6 text-[#11231f]">
                    {guide.evaluacion.criterios?.map((criterion) => (
                      <p key={criterion}>{criterion}</p>
                    ))}
                    {guide.evaluacion.instrumento ? (
                      <p>
                        <span className="font-semibold">Instrumento:</span>{" "}
                        {guide.evaluacion.instrumento}
                      </p>
                    ) : null}
                    {guide.evaluacion.ticketSalida ? (
                      <p>
                        <span className="font-semibold">Ticket:</span>{" "}
                        {guide.evaluacion.ticketSalida}
                      </p>
                    ) : null}
                  </div>
                </RichGuideSection>
              ) : null}

              {guide.diferenciacion ? (
                <RichGuideSection title="Diferenciación">
                  <div className="grid gap-2 text-[15px] leading-6 text-[#11231f]">
                    {[
                      ["Apoyo fuerte", guide.diferenciacion.apoyoFuerte],
                      ["Grupo base", guide.diferenciacion.grupoBase],
                      ["Extensión", guide.diferenciacion.extension],
                    ].map(([label, value]) =>
                      value ? (
                        <p key={label}>
                          <span className="font-semibold">{label}:</span> {value}
                        </p>
                      ) : null,
                    )}
                  </div>
                </RichGuideSection>
              ) : null}
            </div>
          </div>
        </A4Page>

        {guide.recursosDidacticos ? (
          <A4Page>
            <div className="grid gap-6">
              <RichGuideSection title="Recursos y recomendaciones">
                <div className="grid gap-4">
                  {guide.recursosDidacticos.adecuacionNivel ? (
                    <div className="rounded-lg bg-white p-3 text-[15px] leading-6 text-[#11231f]">
                      <div className="flex items-center gap-2 font-semibold text-[#075f53]">
                        <Lightbulb className="h-4 w-4" aria-hidden="true" />
                        Adecuación al curso
                      </div>
                      <p className="mt-2">{guide.recursosDidacticos.adecuacionNivel}</p>
                    </div>
                  ) : null}

                  {guide.recursosDidacticos.recomendacionesClase?.length ? (
                    <div className="rounded-lg bg-white p-3">
                      <p className="font-semibold">Recomendaciones para la clase</p>
                      <ul className="mt-2 grid gap-2 text-[15px] leading-6 text-[#11231f]">
                        {guide.recursosDidacticos.recomendacionesClase.map((recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <RevealOnScroll>
                    <div className="grid gap-3 md:grid-cols-2">
                      <SeccionImagenes
                        imagenes={guide.recursosDidacticos.imagenesSugeridas ?? []}
                        safeHttpUrl={safeHttpUrl}
                        stockSearchHref={stockSearchHref}
                      />
                      <SeccionVideos
                        videos={guide.recursosDidacticos.videosSugeridos ?? []}
                        safeHttpUrl={safeHttpUrl}
                        youtubeSearchHref={youtubeSearchHref}
                      />
                    </div>
                  </RevealOnScroll>
                </div>
              </RichGuideSection>

              {guide.materialesEditables?.length ? (
                <RichGuideSection title="Materiales editables">
                  <div className="grid gap-3">
                    {guide.materialesEditables.map((material, index) => (
                      <div key={`${material.nombre}-${index}`} className="rounded-lg bg-white p-3">
                        <p className="font-semibold">{material.nombre}</p>
                        <p className="mt-2 whitespace-pre-line text-[15px] leading-6 text-[#11231f]">
                          {material.contenido}
                        </p>
                        {material.comoUsarlo ? (
                          <p className="mt-2 text-[15px] leading-6 text-[#11231f]">
                            <span className="font-semibold">Cómo usarlo:</span>{" "}
                            {material.comoUsarlo}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </RichGuideSection>
              ) : null}

              {guide.erroresFrecuentes?.length ? (
                <RichGuideSection title="Errores frecuentes">
                  <div className="grid gap-3">
                    {guide.erroresFrecuentes.map((error, index) => (
                      <div
                        key={`${error.error}-${index}`}
                        className="rounded-lg bg-white p-3 text-[15px] leading-6 text-[#11231f]"
                      >
                        <p className="font-semibold text-[#8d174f]">{error.error}</p>
                        <p className="mt-2">
                          <span className="font-semibold">Cómo detectarlo:</span>{" "}
                          {error.comoDetectarlo}
                        </p>
                        <p>
                          <span className="font-semibold">Cómo intervenir:</span>{" "}
                          {error.comoIntervenir}
                        </p>
                      </div>
                    ))}
                  </div>
                </RichGuideSection>
              ) : null}
            </div>
          </A4Page>
        ) : guide.materialesEditables?.length || guide.erroresFrecuentes?.length ? (
          <A4Page>
            <div className="grid gap-6">
              {guide.materialesEditables?.length ? (
                <RichGuideSection title="Materiales editables">
                  <div className="grid gap-3">
                    {guide.materialesEditables.map((material, index) => (
                      <div
                        key={`${material.nombre}-${index}`}
                        className="rounded-lg bg-[#fbfffd] p-3"
                      >
                        <p className="font-semibold">{material.nombre}</p>
                        <p className="mt-2 whitespace-pre-line text-[15px] leading-6 text-[#11231f]">
                          {material.contenido}
                        </p>
                        {material.comoUsarlo ? (
                          <p className="mt-2 text-[15px] leading-6 text-[#11231f]">
                            <span className="font-semibold">Cómo usarlo:</span>{" "}
                            {material.comoUsarlo}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </RichGuideSection>
              ) : null}

              {guide.erroresFrecuentes?.length ? (
                <RichGuideSection title="Errores frecuentes">
                  <div className="grid gap-3">
                    {guide.erroresFrecuentes.map((error, index) => (
                      <div
                        key={`${error.error}-${index}`}
                        className="rounded-lg bg-white p-3 text-[15px] leading-6 text-[#11231f]"
                      >
                        <p className="font-semibold text-[#8d174f]">{error.error}</p>
                        <p className="mt-2">
                          <span className="font-semibold">Cómo detectarlo:</span>{" "}
                          {error.comoDetectarlo}
                        </p>
                        <p>
                          <span className="font-semibold">Cómo intervenir:</span>{" "}
                          {error.comoIntervenir}
                        </p>
                      </div>
                    ))}
                  </div>
                </RichGuideSection>
              ) : null}
            </div>
          </A4Page>
        ) : null}
      </article>
    );
  }

  return (
    <article id={documentId} className="lesson-a4-document mx-auto grid w-full max-w-[820px] gap-6">
      <A4Page>
        <div className="border-b border-[#d5e1dc] pb-7">
          <Badge className="bg-[#e7fbf7] text-[#087968]">Guía generada</Badge>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
            {plan.subject} - {plan.topic}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2 text-[15px] font-medium text-[#11231f]">
            <span className="rounded-lg bg-[#eef5f3] px-3 py-1">Año {plan.grade}</span>
            <span className="rounded-lg bg-[#eef5f3] px-3 py-1">{plan.durationMinutes} min</span>
            <span className="rounded-lg bg-[#eef5f3] px-3 py-1">{plan.status}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          {overview ? (
            <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
              <p className="text-[15px] font-medium leading-7 text-[#11231f]">{overview}</p>
            </section>
          ) : null}

          {objectives.length ? (
            <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#087968]" aria-hidden="true" />
                <h3 className="font-display text-xl font-bold tracking-tight">Objetivos</h3>
              </div>
              <ul className="mt-3 grid gap-2 text-[15px] leading-6 text-[#11231f]">
                {objectives.map((objective) => (
                  <li key={objective} className="rounded-lg bg-white px-3 py-2">
                    {objective}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {competences.length ? (
            <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
              <h3 className="font-display text-xl font-bold tracking-tight">Capacidades</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {competences.map((competence) => (
                  <span
                    key={competence}
                    className="rounded-lg bg-[#eef5f3] px-3 py-2 text-sm font-bold text-[#11231f]"
                  >
                    {competence}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </A4Page>

      {sessions.length ? (
        <A4Page>
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
                    <span className="text-sm font-semibold text-[#11231f]">
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
                      <ul className="mt-2 grid gap-1 text-[15px] leading-6 text-[#11231f]">
                        {phase.activities?.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {session.differentiation ? (
                  <div className="mt-3 grid gap-2 rounded-lg border border-[#d5e1dc] bg-white p-3">
                    <p className="font-semibold">Ajustes y desafíos</p>
                    {[
                      ["Apoyo fuerte", session.differentiation.low],
                      ["Grupo base", session.differentiation.medium],
                      ["Extensión", session.differentiation.high],
                    ].map(([label, value]) =>
                      value ? (
                        <p key={label} className="text-[15px] leading-6 text-[#11231f]">
                          <span className="font-semibold">{label}:</span> {value}
                        </p>
                      ) : null,
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        </A4Page>
      ) : null}

      <A4Page>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            {resources.length ? (
              <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
                <h3 className="font-display text-xl font-bold tracking-tight">Recursos</h3>
                <ul className="mt-3 grid gap-2 text-[15px] leading-6 text-[#11231f]">
                  {resources.map((resource) => (
                    <li key={resource}>{resource}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {assessment.length ? (
              <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
                <h3 className="font-display text-xl font-bold tracking-tight">Evaluación</h3>
                <ul className="mt-3 grid gap-2 text-[15px] leading-6 text-[#11231f]">
                  {assessment.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {printables.length ? (
            <section className="border-t border-[#d5e1dc] pt-5 first:border-t-0 first:pt-0">
              <h3 className="font-display text-xl font-bold tracking-tight">
                Materiales editables
              </h3>
              <div className="mt-3 grid gap-3">
                {printables.map((printable) => (
                  <div key={printable.name} className="rounded-lg bg-white p-3">
                    <p className="font-semibold">{printable.name}</p>
                    {printable.prompt ? (
                      <p className="mt-1 text-[15px] leading-6 text-[#11231f]">
                        {printable.prompt}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </A4Page>
    </article>
  );
}

export default async function PlanningModulePage({ searchParams }: PlanningModulePageProps) {
  const { accessToken, user } = await getEducaiAppAuth();

  const createdId = searchParams?.created;
  const initialCourseId = searchParams?.courseId;
  const [dashboard, createdPlan, teacherCourses] = accessToken
    ? await Promise.all([
        fetchPlanningDashboard(accessToken),
        createdId ? fetchLessonPlan(accessToken, createdId) : Promise.resolve(null),
        fetchTeacherCourses(accessToken),
      ])
    : [null, null, []];
  const error = searchParams?.error;
  const feedback = searchParams?.feedback;
  const userPlan = metadataValue(user?.app_metadata, "plan") || "free";
  const documentTitle = createdPlan ? lessonPlanTitle(createdPlan) : "Guía EducAI";
  const exportEnabled = canExportPlan(userPlan);
  const lessonPlanQuota = dashboard?.lessonPlanQuota ?? null;
  const lessonPlanQuotaExhausted =
    lessonPlanQuota?.remaining !== null &&
    lessonPlanQuota?.remaining !== undefined &&
    lessonPlanQuota.remaining <= 0;

  if (createdPlan) {
    return (
      <AppShell
        hideNavigation
        title="Guía generada"
        eyebrow="Planificación docente"
        statusNote="Revisá, exportá y ajustá la clase antes de usarla."
      >
        <div className="grid gap-5 bg-[#f4f8f6] p-4 sm:p-6">
          <div className="educai-no-print mx-auto flex w-full max-w-[980px] flex-wrap items-center justify-between gap-3">
            <a
              href="/app/planificar"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cbdad4] bg-white px-4 text-sm font-bold text-[#11231f] transition hover:border-[#18b6a4]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </a>
            <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#11231f] shadow-whisper">
              Plan actual: {userPlan}
            </span>
          </div>

          <div className="mx-auto grid w-full max-w-[980px] items-start gap-4">
            <LessonPlanDocumentActions
              documentId={LESSON_DOCUMENT_ID}
              enabled={exportEnabled}
              title={documentTitle}
            />
            <GeneratedLessonPlan documentId={LESSON_DOCUMENT_ID} plan={createdPlan} />
            <LessonPlanFeedback
              initialRating={createdPlan.rating}
              message={feedback ? feedbackMessages[feedback] : undefined}
              planId={createdPlan.id}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  if (createdId) {
    return (
      <AppShell
        hideNavigation
        title="Guía generada"
        eyebrow="Planificación docente"
        statusNote="La clase ya se guardó. Estamos preparando la vista final."
      >
        <div className="grid min-h-[calc(100vh-120px)] place-items-center bg-[#f4f8f6] p-4 sm:p-6">
          <div className="w-full max-w-2xl">
            <LessonPlanOpenRetry planId={createdId} />
          </div>
        </div>
      </AppShell>
    );
  }

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
                  <p className="mt-1 text-sm">ID de planificación: {createdId}</p>
                </div>
              </div>
            </div>
          ) : null}

          {createdPlan ? <GeneratedLessonPlan plan={createdPlan} /> : null}

          {!createdPlan && lessonPlanQuota ? (
            <LessonPlanQuotaNotice quota={lessonPlanQuota} />
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

          {createdPlan ? (
            <div>
              <a
                href="/app/planificar"
                className="inline-flex rounded-lg bg-[#075f53] px-4 py-3 text-sm font-bold text-white shadow-whisper transition hover:bg-[#087968]"
              >
                Nueva planificación
              </a>
            </div>
          ) : lessonPlanQuotaExhausted ? (
            <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Actualizá tu plan para seguir
              </h2>
              <p className="mt-2 text-[15px] leading-6 text-[#11231f]">
                El formulario vuelve a estar disponible cuando tengas planificaciones o créditos
                activos.
              </p>
              <a
                href="/app/planes"
                className="mt-4 inline-flex rounded-lg bg-[#075f53] px-4 py-3 text-sm font-bold text-white shadow-whisper transition hover:bg-[#087968]"
              >
                Ver planes
              </a>
            </div>
          ) : (
            <LessonPlanForm courses={teacherCourses} initialCourseId={initialCourseId} />
          )}
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
              <h2 className="font-display text-2xl font-bold tracking-tight">Últimas clases</h2>
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
                      <span className="flex items-center gap-2 text-[15px] text-[#11231f]">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        Grado {plan.grade} - {plan.durationMinutes} min
                      </span>
                      <Badge className="w-fit bg-[#eef5f3] text-[#11231f]">{plan.status}</Badge>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-[15px] leading-6 text-[#11231f]">
                  Todavía no hay clases generadas en este alcance.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
