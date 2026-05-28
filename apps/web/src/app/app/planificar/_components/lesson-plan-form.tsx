"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createBrowserClient } from "@supabase/ssr";
import { CalendarDays, CheckCircle2, Circle, FileText, Loader2, Sparkles } from "lucide-react";

import { Badge, Button } from "@educai/ui";

type EducationLevel = "primaria" | "secundaria" | "terciario" | "universitario";
type LessonIntent =
  | "introducir"
  | "practicar"
  | "profundizar"
  | "integrar"
  | "evaluar"
  | "repasar"
  | "proyecto";

const levelLabels: Record<
  EducationLevel,
  {
    title: string;
    description: string;
    year: string;
    gradeMin: number;
    gradeMax: number;
    defaultGrade: number;
    subject: string;
    subjects: string[];
    levelContext: {
      label: string;
      placeholder: string;
    };
    topicPlaceholder: string;
    goalPlaceholder: string;
    durationDefault: number;
    durationPresets: number[];
  }
> = {
  primaria: {
    title: "Primaria",
    description: "Más concreto, visual y guiado",
    year: "Grado",
    gradeMin: 1,
    gradeMax: 7,
    defaultGrade: 4,
    subject: "Área / materia",
    subjects: ["Matemática", "Prácticas del lenguaje", "Ciencias Naturales", "Ciencias Sociales"],
    levelContext: {
      label: "Eje o proyecto del grado",
      placeholder: "Ej: alfabetización, ciencias en el patio, feria escolar...",
    },
    topicPlaceholder: "Ej: fracciones equivalentes, ecosistemas, comprensión lectora...",
    goalPlaceholder: "Ej: reconocer fracciones equivalentes usando dibujos y ejemplos cercanos.",
    durationDefault: 40,
    durationPresets: [40, 60, 80],
  },
  secundaria: {
    title: "Secundaria",
    description: "Práctica, autonomía y criterios claros",
    year: "Año",
    gradeMin: 1,
    gradeMax: 7,
    defaultGrade: 2,
    subject: "Materia",
    subjects: ["Matemática", "Lengua", "Biología", "Física", "Química", "Historia", "Geografía"],
    levelContext: {
      label: "Orientación o modalidad",
      placeholder: "Ej: Ciencias Naturales, Economía, Técnica en informática...",
    },
    topicPlaceholder: "Ej: proporcionalidad directa, texto argumentativo, fotosíntesis...",
    goalPlaceholder:
      "Ej: resolver problemas de proporcionalidad directa y explicar la estrategia usada.",
    durationDefault: 80,
    durationPresets: [40, 80, 120],
  },
  terciario: {
    title: "Terciario",
    description: "Aplicación profesional y práctica",
    year: "Año",
    gradeMin: 1,
    gradeMax: 5,
    defaultGrade: 1,
    subject: "Asignatura",
    subjects: ["Didáctica", "Pedagogía", "Anatomía", "Administración", "Práctica profesional"],
    levelContext: {
      label: "Perfil o trayecto profesional",
      placeholder: "Ej: formación docente, enfermería, administración...",
    },
    topicPlaceholder: "Ej: planificación de proyectos, anatomía funcional, didáctica...",
    goalPlaceholder:
      "Ej: aplicar el concepto en una situación profesional y justificar decisiones.",
    durationDefault: 90,
    durationPresets: [60, 90, 120],
  },
  universitario: {
    title: "Universitario",
    description: "Rigor disciplinar y fundamentación",
    year: "Año",
    gradeMin: 1,
    gradeMax: 8,
    defaultGrade: 1,
    subject: "Materia / cátedra",
    subjects: [
      "Análisis matemático",
      "Bases de datos",
      "Derecho administrativo",
      "Anatomía",
      "Metodología de la investigación",
    ],
    levelContext: {
      label: "Enfoque o plan de estudios",
      placeholder: "Ej: cátedra práctica, plan 2024, seminario intensivo...",
    },
    topicPlaceholder: "Ej: derivadas parciales, derecho administrativo, bases de datos...",
    goalPlaceholder:
      "Ej: resolver un problema disciplinar y fundamentar el procedimiento con precisión.",
    durationDefault: 120,
    durationPresets: [90, 120, 180],
  },
};

const lessonIntentOptions: Array<{ value: LessonIntent; label: string }> = [
  { value: "introducir", label: "Introducir" },
  { value: "practicar", label: "Practicar" },
  { value: "profundizar", label: "Profundizar" },
  { value: "integrar", label: "Integrar" },
  { value: "evaluar", label: "Evaluar" },
  { value: "repasar", label: "Repasar" },
  { value: "proyecto", label: "Proyecto" },
];

type GenerateApiError = {
  code?: string;
};

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readFormInteger(formData: FormData, key: string) {
  const value = Number.parseInt(readFormString(formData, key), 10);
  return Number.isFinite(value) ? value : Number.NaN;
}

function optionalFormString(formData: FormData, key: string) {
  return readFormString(formData, key) || undefined;
}

function buildGeneratePayload(formData: FormData) {
  const educationLevel = readFormString(formData, "educationLevel");

  return {
    educationLevel,
    grade: readFormInteger(formData, "grade"),
    subject: readFormString(formData, "subject"),
    courseLabel: optionalFormString(formData, "courseLabel"),
    institutionName: optionalFormString(formData, "institutionName"),
    lessonIntent: optionalFormString(formData, "lessonIntent"),
    levelContext: optionalFormString(formData, "levelContext"),
    plannedDate: optionalFormString(formData, "plannedDate"),
    careerName:
      educationLevel === "universitario" ? optionalFormString(formData, "careerName") : undefined,
    topic: readFormString(formData, "topic"),
    sessionCount: readFormInteger(formData, "sessionCount"),
    totalDurationMinutes: readFormInteger(formData, "totalDurationMinutes"),
    learningGoal: optionalFormString(formData, "learningGoal"),
    groupProfile: optionalFormString(formData, "groupProfile"),
    priorKnowledge: optionalFormString(formData, "priorKnowledge"),
    curriculumContext: optionalFormString(formData, "curriculumContext"),
    availableResources: optionalFormString(formData, "availableResources"),
    assessmentFocus: optionalFormString(formData, "assessmentFocus"),
    inclusionNeeds: optionalFormString(formData, "inclusionNeeds"),
    outputFormat: optionalFormString(formData, "outputFormat"),
  };
}

function redirectToPlanning(params: Record<string, string>) {
  const url = new URL("/app/planificar", window.location.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  window.location.assign(url.toString());
}

function mapApiErrorToQuery(code: string | undefined) {
  if (code === "TEACHER_PROFILE_MISSING") return "teacher_profile";
  if (code === "LESSON_PLAN_QUOTA_EXCEEDED") return "quota";
  if (code === "LESSON_PLAN_AI_UNAVAILABLE") return "ai_unavailable";
  return "api";
}

async function readGenerateApiError(response: Response): Promise<GenerateApiError> {
  try {
    const body = (await response.json()) as GenerateApiError;
    return body;
  } catch {
    return {};
  }
}

async function submitGenerateDirectly(form: HTMLFormElement) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiUrl || !supabaseUrl || !supabaseAnonKey) {
    form.submit();
    return;
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirectToPlanning({ error: "auth" });
    return;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/lesson-plans/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGeneratePayload(new FormData(form))),
    cache: "no-store",
  });

  if (!response.ok) {
    const apiError = await readGenerateApiError(response);
    redirectToPlanning({ error: mapApiErrorToQuery(apiError.code) });
    return;
  }

  const body = (await response.json()) as { data?: { id?: string } };
  redirectToPlanning({ created: body.data?.id ?? "ok" });
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || isSubmitting;

  return (
    <Button
      type="submit"
      disabled={busy}
      className="min-h-12 bg-[#ff7a1a] px-6 font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508] disabled:cursor-wait disabled:bg-[#c85f16] disabled:opacity-85"
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      )}
      {busy ? "Generando clase..." : "Crear clase"}
    </Button>
  );
}

function GeneratingOverlay() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const steps = [
    "Leyendo nivel, edad y contexto del curso",
    "Diseñando la secuencia completa",
    "Preparando actividades y material editable",
    "Sumando recomendaciones, imágenes y videos",
    "Revisando evaluación, cierre y coherencia",
  ];
  const activeStep = Math.min(steps.length - 1, Math.floor(elapsedSeconds / 18));
  const progress = Math.min(94, 8 + elapsedSeconds * 1.1);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#eef5f3]/95 px-4 py-4 backdrop-blur-sm">
      <section
        role="status"
        aria-live="polite"
        className="max-h-[calc(100vh-32px)] w-full max-w-lg overflow-y-auto rounded-lg border border-[#18b6a4]/30 bg-white text-left shadow-float"
      >
        <div className="border-b border-[#d5e1dc] bg-[#fbfffd] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#075f53] text-white shadow-[0_14px_30px_rgba(7,95,83,0.22)]">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087968]">
                Planificación docente
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Generando la guía completa
              </h2>
              <div className="mt-2 inline-flex rounded-lg bg-[#fff8d7] px-3 py-1.5 text-sm font-bold text-[#725200]">
                Tiempo estimado: 2 a 6 minutos
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-[#4f5f58]">
                No estamos generando un borrador rápido: estamos preparando la versión final con
                secuencia, materiales editables, evaluación, recomendaciones, imágenes y videos.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-[#33423c]">
              <span>Preparación estimada</span>
              <span>{elapsedSeconds < 120 ? "En curso" : "Revisión final"}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#e3ebe7]">
              <div
                className="h-full rounded-full bg-[#ff7a1a] transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid gap-2">
            {steps.map((step, index) => {
              const done = index < activeStep;
              const current = index === activeStep;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                    done || current ? "border-[#bce7df] bg-[#f3fffc]" : "border-[#e3ebe7] bg-white"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#087968]" aria-hidden="true" />
                  ) : current ? (
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin text-[#ff7a1a]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-[#a0ada7]" aria-hidden="true" />
                  )}
                  <span
                    className={`text-[15px] font-semibold ${
                      done || current ? "text-[#24342e]" : "text-[#6b7872]"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-[#e7fbf7] px-3 py-2.5 text-sm font-bold leading-6 text-[#075c50]">
            Dejá esta pantalla abierta. Cuando termine, te llevamos directo a la guía lista para
            revisar, ajustar y usar.
          </div>
        </div>
      </section>
    </div>
  );
}

export function LessonPlanForm() {
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("secundaria");
  const [lessonIntent, setLessonIntent] = useState<LessonIntent>("introducir");
  const [grade, setGrade] = useState(levelLabels.secundaria.defaultGrade);
  const [duration, setDuration] = useState(levelLabels.secundaria.durationDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const labels = levelLabels[educationLevel];
  const isUniversity = educationLevel === "universitario";
  const subjectListId = useMemo(() => `subjects-${educationLevel}`, [educationLevel]);

  function changeLevel(nextLevel: EducationLevel) {
    const nextLabels = levelLabels[nextLevel];
    setEducationLevel(nextLevel);
    setGrade(nextLabels.defaultGrade);
    setDuration(nextLabels.durationDefault);
  }

  return (
    <>
      {isSubmitting ? <GeneratingOverlay /> : null}
      <form
        action="/app/planificar/generar"
        method="post"
        onSubmit={(event) => {
          event.preventDefault();
          setIsSubmitting(true);
          submitGenerateDirectly(event.currentTarget).catch(() => {
            redirectToPlanning({ error: "network" });
          });
        }}
        aria-busy={isSubmitting}
        className="rounded-lg border border-[#18b6a4]/25 bg-white shadow-whisper"
      >
        <input type="hidden" name="educationLevel" value={educationLevel} />
        <input type="hidden" name="lessonIntent" value={lessonIntent} />

        <div className="border-b border-[#e3ebe7] p-5">
          <Badge className="bg-[#e7fbf7] text-[#087968]">Nueva planificación</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Datos mínimos de la clase
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
            Completá lo esencial. El formulario se adapta al nivel educativo y deja el contexto fino
            como opcional.
          </p>
        </div>

        <fieldset disabled={isSubmitting} className="grid gap-5 p-5 disabled:opacity-70">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-[#33423c]">Nivel educativo</legend>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(levelLabels) as EducationLevel[]).map((level) => {
                const option = levelLabels[level];
                const selected = educationLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => changeLevel(level)}
                    aria-pressed={selected}
                    className={`min-h-[84px] rounded-lg border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[#18b6a4] bg-[#e7fbf7] text-[#075c50] shadow-[0_10px_24px_rgba(24,182,164,0.16)]"
                        : "border-[#d5e1dc] bg-white text-[#33423c] hover:border-[#18b6a4]/70"
                    }`}
                  >
                    <span className="block font-bold">{option.title}</span>
                    <span className="mt-1 block text-[13px] font-medium leading-5">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-[0.45fr_1fr]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">{labels.year}</span>
              <input
                name="grade"
                type="number"
                min={labels.gradeMin}
                max={labels.gradeMax}
                value={grade}
                onChange={(event) => setGrade(Number(event.target.value))}
                required
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">{labels.subject}</span>
              <input
                name="subject"
                defaultValue="Matemática"
                list={subjectListId}
                required
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
              <datalist id={subjectListId}>
                {labels.subjects.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {isUniversity ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Carrera</span>
                <input
                  name="careerName"
                  placeholder="Ej: Ingeniería en sistemas, Abogacía, Medicina..."
                  required
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            ) : (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">
                  {labels.levelContext.label}
                </span>
                <input
                  name="levelContext"
                  placeholder={labels.levelContext.placeholder}
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            )}
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Tema</span>
              <input
                name="topic"
                defaultValue="Proporcionalidad directa"
                placeholder={labels.topicPlaceholder}
                required
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>
          </div>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-[#33423c]">Intención de la clase</legend>
            <div className="flex flex-wrap gap-2">
              {lessonIntentOptions.map((option) => {
                const selected = lessonIntent === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLessonIntent(option.value)}
                    aria-pressed={selected}
                    className={`h-10 rounded-lg border px-3 text-sm font-bold transition ${
                      selected
                        ? "border-[#18b6a4] bg-[#18b6a4] text-white"
                        : "border-[#d5e1dc] bg-white text-[#33423c] hover:border-[#18b6a4]/70"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">Objetivo de aprendizaje</span>
            <textarea
              name="learningGoal"
              rows={3}
              placeholder={labels.goalPlaceholder}
              className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
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
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>
            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-[#33423c]"
                htmlFor="totalDurationMinutes"
              >
                Duración total en minutos
              </label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  id="totalDurationMinutes"
                  name="totalDurationMinutes"
                  type="number"
                  min="10"
                  max="600"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  required
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
                <div className="flex gap-2">
                  {labels.durationPresets.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDuration(minutes)}
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 text-sm font-bold text-[#33423c] hover:border-[#18b6a4]"
                    >
                      {minutes}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <details className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd]">
            <summary className="cursor-pointer px-4 py-3 font-semibold text-[#11231f]">
              Contexto opcional para mejorar la precisión
            </summary>
            <div className="grid gap-4 border-t border-[#e3ebe7] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">
                    Curso, división o comisión
                  </span>
                  <input
                    name="courseLabel"
                    placeholder="Ej: 7A, 2do B, comisión noche..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
                {isUniversity ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#33423c]">
                      {labels.levelContext.label}
                    </span>
                    <input
                      name="levelContext"
                      placeholder={labels.levelContext.placeholder}
                      className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                    />
                  </label>
                ) : (
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#33423c]">Institución</span>
                    <input
                      name="institutionName"
                      placeholder="Nombre de escuela, instituto o universidad..."
                      className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                    />
                  </label>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {isUniversity ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#33423c]">Institución</span>
                    <input
                      name="institutionName"
                      placeholder="Nombre de universidad o facultad..."
                      className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                    />
                  </label>
                ) : null}
                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#33423c]">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Fecha tentativa
                  </span>
                  <input
                    name="plannedDate"
                    type="date"
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Contexto del grupo</span>
                  <textarea
                    name="groupProfile"
                    rows={3}
                    placeholder="Ej: grupo heterogéneo, consignas breves, ritmo medio."
                    className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Saberes previos</span>
                  <textarea
                    name="priorKnowledge"
                    rows={3}
                    placeholder="Ej: ya trabajaron fracciones equivalentes y tablas simples."
                    className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Recursos disponibles</span>
                  <input
                    name="availableResources"
                    placeholder="Pizarrón, fotocopias, proyector..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Qué querés evaluar</span>
                  <input
                    name="assessmentFocus"
                    placeholder="Procedimiento, argumentación, trabajo grupal..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Marco curricular</span>
                  <input
                    name="curriculumContext"
                    placeholder="NAP, diseño provincial, programa de cátedra..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">
                    Apoyos o adaptaciones
                  </span>
                  <input
                    name="inclusionNeeds"
                    placeholder="Apoyo visual, consignas cortas, extensión..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Formato de salida</span>
                <input
                  name="outputFormat"
                  placeholder="Secuencia editable, guía para imprimir, rúbrica breve..."
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>
          </details>

          <div className="flex flex-col gap-3 border-t border-[#e3ebe7] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] font-medium leading-6 text-[#4f5f58]">
              La clase queda disponible en tu espacio docente al terminar la generación.
            </p>
            <SubmitButton isSubmitting={isSubmitting} />
          </div>
        </fieldset>
      </form>
    </>
  );
}
