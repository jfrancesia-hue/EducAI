import { redirect } from "next/navigation";
import { Activity, CheckCircle2, UsersRound } from "lucide-react";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { previewDashboard } from "../_components/preview-data";
import { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function StudentsModulePage() {
  let dashboard = previewDashboard;

  if (process.env.NODE_ENV !== "development") {
    const supabase = createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      redirect("/login");
    }

    dashboard = (await fetchInstitutionalDashboard(session.access_token)) ?? previewDashboard;
  }

  return (
    <AppShell title="Estudiantes" eyebrow="Seguimiento">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="grid content-start gap-5">
          <div className="relative overflow-hidden rounded-[24px] border border-[#18b6a4]/25 bg-white p-5 shadow-whisper">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ef5da8]/10 blur-2xl" />
            <Badge className="bg-[#e7fbf7] text-[#087968]">Seguimiento actualizado</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
              Estudiantes y pulso de aprendizaje
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
              Lista de alumnos cargados, con foco de acompanamiento tomado desde sus perfiles y
              diagnósticos.
            </p>
          </div>

          <div className="grid gap-3">
            {dashboard?.recentStudents.length ? (
              dashboard.recentStudents.map((student) => (
                <article
                  key={student.id}
                  className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper transition hover:border-[#18b6a4]/35 hover:-translate-y-0.5"
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
                        ? "Diagnóstico completo"
                        : "Diagnóstico pendiente"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                <p className="text-[15px] leading-6 text-[#4f5f58]">
                  Cuando cargues estudiantes o perfiles diagnÃ³sticos, este espacio se transforma en un mapa claro de acompaÃ±amiento: fortalezas, oportunidades y prÃ³ximos pasos.
                </p>
              </article>
            )}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="relative overflow-hidden rounded-[24px] border border-[#18b6a4]/25 bg-[linear-gradient(135deg,#075f53_0%,#11231f_100%)] p-5 text-white shadow-whisper">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#72e4d2]/16 blur-2xl" />
            <div className="flex items-center gap-3">
              <UsersRound className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Resumen</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ["Estudiantes", dashboard?.metrics.studentCount ?? 0],
                ["Diagnósticos completos", `${dashboard?.metrics.diagnosticCompletionRate ?? 0}%`],
                ["Minutos esta semana", dashboard?.metrics.learningMinutesThisWeek ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/12 bg-white/10 p-4">
                  <p className="text-sm text-white/68">{label}</p>
                  <p className="mt-2 font-display text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
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
                    <div key={student.id} className="flex gap-3 rounded-2xl bg-[#eef5f3] p-4">
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
                  A medida que EducAI conozca mejor a cada estudiante, acÃ¡ van a aparecer fortalezas visibles para planificar con mÃ¡s precisiÃ³n.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
