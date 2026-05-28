import Link from "next/link";
import { BookOpenCheck, GraduationCap, Pencil, Plus, Users } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { TeacherCourseDeleteButton } from "./_components/teacher-course-delete-button";
import { fetchTeacherCourses } from "../../../lib/api/teacher-courses";
import { getEducaiAppAuth } from "../../../lib/supabase/app-auth";

export default async function StudentsModulePage() {
  const { accessToken } = await getEducaiAppAuth();
  const courses = accessToken ? await fetchTeacherCourses(accessToken) : [];

  return (
    <AppShell title="Estudiantes" eyebrow="Mis cursos">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="grid content-start gap-5">
          <div className="relative overflow-hidden rounded-[24px] border border-[#18b6a4]/25 bg-white p-5 shadow-whisper">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ef5da8]/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge className="bg-[#e7fbf7] text-[#087968]">Tus cursos</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Cursos y grupos que das
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                  Cargá los cursos a los que les das clase. Cuando generes una planificación, EducAI
                  va a usar este contexto para que la guía salga más afinada al grupo.
                </p>
              </div>
              <Button
                asChild
                className="bg-[#075f53] text-white shadow-[0_14px_30px_rgba(7,95,83,0.22)] hover:bg-[#087968]"
              >
                <Link href="/app/estudiantes/nuevo" prefetch={false}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nuevo curso
                </Link>
              </Button>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#18b6a4]/40 bg-[#fbfffd] p-8 text-center shadow-whisper">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#e7fbf7] text-[#087968]">
                <GraduationCap className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
                Empezá por tu primer curso
              </h3>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-[#4f5f58]">
                Cargá tu curso y EducAI va a generar guías con contexto real de tu grupo. Cuanto más
                completes, más rica la guía.
              </p>
              <div className="mt-5 flex justify-center">
                <Button
                  asChild
                  className="bg-[#075f53] text-white shadow-[0_14px_30px_rgba(7,95,83,0.22)] hover:bg-[#087968]"
                >
                  <Link href="/app/estudiantes/nuevo" prefetch={false}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Cargar mi primer curso
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper transition hover:-translate-y-0.5 hover:border-[#18b6a4]/35"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold tracking-tight">
                        {course.name}
                      </h3>
                      <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                        {course.subject ? `${course.subject} · ` : ""}
                        {course.grade}° año
                        {course.shift ? ` · turno ${course.shift}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {typeof course.studentCount === "number" ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#eef5f3] px-2.5 py-1 font-semibold text-[#11231f]">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            {course.studentCount} estudiantes
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#fff8d7] px-2.5 py-1 font-semibold text-[#725200]">
                          <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Listo para planificar
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={{
                          pathname: "/app/planificar",
                          query: { courseId: course.id },
                        }}
                        prefetch={false}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ff7a1a] px-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(255,122,26,0.28)] transition hover:bg-[#ea6508]"
                      >
                        Crear clase para este curso
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/app/estudiantes/${course.id}/editar`}
                          prefetch={false}
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd9d4] bg-white px-3 text-sm font-bold text-[#11231f] transition hover:border-[#18b6a4]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Editar
                        </Link>
                        <TeacherCourseDeleteButton courseId={course.id} courseName={course.name} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#18b6a4]/25 bg-[#075f53] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Por qué cargar tus cursos
              </h2>
            </div>
            <ul className="mt-5 grid gap-3 text-[15px] leading-6 text-white/86">
              <li className="rounded-lg bg-white/10 p-3">
                Las guías quedan adaptadas al año, materia y perfil del grupo, no genéricas.
              </li>
              <li className="rounded-lg bg-white/10 p-3">
                Si sumás saberes previos y recursos, EducAI los respeta en la secuencia.
              </li>
              <li className="rounded-lg bg-white/10 p-3">
                No pedimos datos personales de los alumnos. Trabajamos con el grupo, no fichas.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <h2 className="font-display text-2xl font-bold tracking-tight">¿Y los alumnos?</h2>
            <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">
              Por ahora trabajamos con el curso completo y su contexto pedagógico. Pronto vamos a
              sumar carga opcional de estudiantes para hacer seguimiento individual respetando Ley
              26.061 y LGPD.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
