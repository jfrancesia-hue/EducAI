"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { AlertCircle, Loader2, Save } from "lucide-react";

import { Button } from "@educai/ui";

type TeacherCourseFormValues = {
  name: string;
  grade: number;
  subject: string;
  shift?: string;
  studentCount?: number;
  groupProfile?: string;
  priorKnowledge?: string;
  availableResources?: string;
  inclusionNotes?: string;
  institutionName?: string;
};

type TeacherCourseFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<TeacherCourseFormValues> & { id?: string };
};

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

const SUBJECT_SUGGESTIONS = [
  "Matemática",
  "Lengua",
  "Prácticas del lenguaje",
  "Ciencias Naturales",
  "Ciencias Sociales",
  "Biología",
  "Física",
  "Química",
  "Historia",
  "Geografía",
  "Inglés",
];

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptional(formData: FormData, key: string): string | undefined {
  const trimmed = readString(formData, key).trim();
  return trimmed.length ? trimmed : undefined;
}

function buildPayload(formData: FormData): TeacherCourseFormValues {
  const grade = Number.parseInt(readString(formData, "grade"), 10);
  const rawCount = readString(formData, "studentCount").trim();
  const studentCount = rawCount.length ? Number.parseInt(rawCount, 10) : undefined;

  return {
    name: readString(formData, "name").trim(),
    grade: Number.isFinite(grade) ? grade : 1,
    subject: readString(formData, "subject").trim(),
    shift: readOptional(formData, "shift"),
    studentCount:
      typeof studentCount === "number" && Number.isFinite(studentCount) ? studentCount : undefined,
    groupProfile: readOptional(formData, "groupProfile"),
    priorKnowledge: readOptional(formData, "priorKnowledge"),
    availableResources: readOptional(formData, "availableResources"),
    inclusionNotes: readOptional(formData, "inclusionNotes"),
    institutionName: readOptional(formData, "institutionName"),
  };
}

export function TeacherCourseForm({ mode, initialValues }: TeacherCourseFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiUrl || !supabaseUrl || !supabaseAnonKey) {
      setErrorMessage("Falta configuración del cliente. Volvé a ingresar.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = buildPayload(formData);

    if (!payload.name) {
      setErrorMessage("Necesitamos el nombre del curso.");
      return;
    }
    if (!payload.subject) {
      setErrorMessage("Necesitamos la materia principal del curso.");
      return;
    }
    if (!Number.isFinite(payload.grade) || payload.grade < 1 || payload.grade > 12) {
      setErrorMessage("Elegí un grado o año entre 1 y 12.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setErrorMessage("Tu sesión expiró. Volvé a ingresar.");
        setSubmitting(false);
        return;
      }

      const base = apiUrl.replace(/\/$/u, "");
      const url =
        mode === "edit" && initialValues?.id
          ? `${base}/teacher-courses/${encodeURIComponent(initialValues.id)}`
          : `${base}/teacher-courses`;
      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error("teacher_course_form_failed", {
          status: response.status,
          body: body.slice(0, 400),
        });
        setErrorMessage(
          response.status === 401 || response.status === 403
            ? "Tu sesión expiró o no tenés permisos para esta operación."
            : "No pudimos guardar el curso. Reintentá en unos minutos.",
        );
        setSubmitting(false);
        return;
      }

      router.push("/app/estudiantes");
      router.refresh();
    } catch (error) {
      console.error(
        "teacher_course_form_unexpected_failed",
        error instanceof Error ? error.message : "unknown",
      );
      setErrorMessage("La conexión falló. Reintentá en unos minutos.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="rounded-lg border border-[#18b6a4]/25 bg-white shadow-whisper"
    >
      <div className="border-b border-[#e3ebe7] p-5">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          {mode === "edit" ? "Editar curso" : "Cargar un curso"}
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
          Datos mínimos: nombre, año y materia. El contexto extra que sumes va a alimentar las
          planificaciones que generes para este curso.
        </p>
      </div>

      <fieldset disabled={submitting} className="grid gap-5 p-5 disabled:opacity-70">
        <div className="grid gap-4 md:grid-cols-[1fr_0.4fr_1fr]">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">
              Nombre del curso <span className="text-[#8d174f]">*</span>
            </span>
            <input
              name="name"
              defaultValue={initialValues?.name ?? ""}
              required
              maxLength={80}
              placeholder="Ej: 7A, 2do B, comisión noche"
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">
              Grado / año <span className="text-[#8d174f]">*</span>
            </span>
            <select
              name="grade"
              defaultValue={String(initialValues?.grade ?? 7)}
              required
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            >
              {GRADE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">
              Materia principal <span className="text-[#8d174f]">*</span>
            </span>
            <input
              name="subject"
              defaultValue={initialValues?.subject ?? ""}
              required
              maxLength={120}
              list="teacher-course-subjects"
              placeholder="Ej: Matemática"
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
            <datalist id="teacher-course-subjects">
              {SUBJECT_SUGGESTIONS.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">Turno</span>
            <input
              name="shift"
              defaultValue={initialValues?.shift ?? ""}
              maxLength={40}
              placeholder="Ej: Mañana, Tarde, Noche"
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">Cantidad de alumnos</span>
            <input
              name="studentCount"
              type="number"
              min={1}
              max={500}
              defaultValue={
                typeof initialValues?.studentCount === "number"
                  ? String(initialValues.studentCount)
                  : ""
              }
              placeholder="Ej: 28"
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">Institución</span>
            <input
              name="institutionName"
              defaultValue={initialValues?.institutionName ?? ""}
              maxLength={160}
              placeholder="Nombre del colegio o instituto"
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>
        </div>

        <details className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd]">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-[#11231f]">
            Contexto pedagógico opcional (mejora las guías generadas)
          </summary>
          <div className="grid gap-4 border-t border-[#e3ebe7] p-4">
            <p className="rounded-lg bg-[#fff8d7] px-3 py-2 text-sm font-medium leading-6 text-[#725200]">
              Lo que cargues acá se va a sumar al prompt cuando generes una planificación para este
              curso. Cuanto más completes, más rica la guía.
            </p>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Perfil del grupo</span>
              <textarea
                name="groupProfile"
                rows={3}
                defaultValue={initialValues?.groupProfile ?? ""}
                maxLength={2000}
                placeholder="Heterogeneidad, intereses, ritmo, dinámicas que funcionan..."
                className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Saberes previos</span>
              <textarea
                name="priorKnowledge"
                rows={3}
                defaultValue={initialValues?.priorKnowledge ?? ""}
                maxLength={2000}
                placeholder="Temas trabajados, lo que ya dominan, los huecos detectados..."
                className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Recursos disponibles</span>
              <textarea
                name="availableResources"
                rows={2}
                defaultValue={initialValues?.availableResources ?? ""}
                maxLength={2000}
                placeholder="Pizarrón, proyector, fotocopias, netbooks 1 a 1..."
                className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Adaptaciones generales</span>
              <textarea
                name="inclusionNotes"
                rows={2}
                defaultValue={initialValues?.inclusionNotes ?? ""}
                maxLength={2000}
                placeholder="Apoyos visuales, consignas breves, extensión para quien termina antes..."
                className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>

            <p className="text-xs leading-5 text-[#6b7872]">
              Por privacidad y la Ley 26.061, no cargues nombres ni datos personales de tus
              estudiantes en estos campos. Trabajamos con perfil de grupo, no fichas individuales.
            </p>
          </div>
        </details>

        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#ef5da8]/35 bg-[#fdeaf4] p-3 text-[#8d174f]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium leading-6">{errorMessage}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-[#e3ebe7] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium leading-6 text-[#4f5f58]">
            Podés editar este curso después de cargarlo.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/app/estudiantes")}
              className="border-[#d5e1dc] bg-white text-[#11231f] hover:bg-[#e7fbf7]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-12 bg-[#075f53] px-6 font-bold text-white shadow-[0_14px_30px_rgba(7,95,83,0.24)] hover:bg-[#087968] disabled:cursor-wait disabled:opacity-85"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-5 w-5" aria-hidden="true" />
              )}
              {submitting ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear curso"}
            </Button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
