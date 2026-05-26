import { Activity, CheckCircle2, UsersRound } from "lucide-react";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function StudentsModulePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const dashboard = session?.access_token
    ? await fetchInstitutionalDashboard(session.access_token)
    : null;

  return (
    <AppShell title="Estudiantes" eyebrow="Seguimiento">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#18b6a4]/25 bg-white p-5 shadow-whisper">
            <Badge className="bg-[#e7fbf7] text-[#087968]">Seguimiento actualizado</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
              Estudiantes y pulso de aprendizaje
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
              Lista de alumnos cargados, con foco de acompanamiento tomado desde sus perfiles y
              diagnosticos.
            </p>
          </div>

          <div className="grid gap-3">
            {dashboard?.recentStudents.length ? (
              dashboard.recentStudents.map((student) => (
                <article
                  key={student.id}
                  className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold tracking-tight">
                        {student.name}
                      </h3>
                      <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                        Grado {student.grade}
                        {student.schoolName ? ` - ${student.schoolName}` : ""}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#4f5f58]">
                        {student.opportunities.length
                          ? `Acompanamiento sugerido: ${student.opportunities.slice(0, 3).join(", ")}`
                          : "Sin oportunidades marcadas en perfil por el momento."}
                      </p>
                    </div>
                    <span
                      className={[
                        "w-fit rounded-full px-3 py-1 text-sm font-semibold",
                        student.diagnosticCompleted
                          ? "bg-[#e7fbf7] text-[#087968]"
                          : "bg-[#fff8d7] text-[#876100]",
                      ].join(" ")}
                    >
                      {student.diagnosticCompleted
                        ? "Diagnostico completo"
                        : "Diagnostico pendiente"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                <p className="text-[15px] leading-6 text-[#4f5f58]">
                  Todavia no hay estudiantes disponibles para este alcance institucional.
                </p>
              </article>
            )}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#18b6a4]/25 bg-[#075f53] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <UsersRound className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Resumen</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ["Estudiantes", dashboard?.metrics.studentCount ?? 0],
                ["Diagnosticos completos", `${dashboard?.metrics.diagnosticCompletionRate ?? 0}%`],
                ["Minutos esta semana", dashboard?.metrics.learningMinutesThisWeek ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/10 p-4">
                  <p className="text-sm text-white/68">{label}</p>
                  <p className="mt-2 font-display text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Fortalezas visibles
              </h2>
            </div>
            <div className="mt-5 grid gap-3">
              {dashboard?.recentStudents.some((student) => student.strengths.length) ? (
                dashboard.recentStudents
                  .filter((student) => student.strengths.length)
                  .slice(0, 4)
                  .map((student) => (
                    <div key={student.id} className="flex gap-3 rounded-lg bg-[#eef5f3] p-4">
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                        aria-hidden="true"
                      />
                      <p className="text-[15px] leading-6 text-[#4f5f58]">
                        <span className="font-semibold text-[#14120f]">{student.name}:</span>{" "}
                        {student.strengths.slice(0, 3).join(", ")}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-[15px] leading-6 text-[#4f5f58]">
                  Los perfiles actuales todavia no tienen fortalezas cargadas para mostrar.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
