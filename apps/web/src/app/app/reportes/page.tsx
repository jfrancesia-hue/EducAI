import { redirect } from "next/navigation";
import { BarChart3, Brain, CheckCircle2, TrendingUp } from "lucide-react";

import { Badge } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function ReportsModulePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const dashboard = await fetchInstitutionalDashboard(session.access_token);

  const cards = [
    {
      label: "Estudiantes",
      value: dashboard?.metrics.studentCount ?? 0,
      note: "en seguimiento",
      icon: BarChart3,
      color: "bg-[#e7fbf7] text-[#087968]",
    },
    {
      label: "Diagnosticos completos",
      value: `${dashboard?.metrics.diagnosticCompletionRate ?? 0}%`,
      note: "sobre perfiles disponibles",
      icon: Brain,
      color: "bg-[#efedff] text-[#4f3ee2]",
    },
    {
      label: "Planes generados",
      value: dashboard?.metrics.lessonPlanCount ?? 0,
      note: "produccion total del alcance",
      icon: CheckCircle2,
      color: "bg-[#fff8d7] text-[#876100]",
    },
  ];

  return (
    <AppShell title="Reportes" eyebrow="Indicadores">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_0.82fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <Badge className="bg-[#e7fbf7] text-[#087968]">Analitica educativa</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
              Indicadores del trabajo pedagogico
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
              Esta vista resume estudiantes, diagnosticos, planificaciones y uso por materia para
              acompanar decisiones pedagogicas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <article
                key={card.label}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    card.color,
                  ].join(" ")}
                >
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-5 text-[15px] text-[#5b6962]">{card.label}</p>
                <p className="mt-1 font-display text-4xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{card.note}</p>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Uso por materia</h2>
            </div>
            <div className="mt-5 overflow-hidden rounded-lg border border-[#e3ebe7]">
              {dashboard?.subjectMix.length ? (
                dashboard.subjectMix.map((item) => (
                  <div
                    key={item.subject}
                    className="grid gap-2 border-b border-[#e3ebe7] bg-white p-4 last:border-b-0 md:grid-cols-[1fr_auto]"
                  >
                    <p className="font-semibold">{item.subject}</p>
                    <p className="font-display text-2xl font-bold">{item.count}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-[15px] leading-6 text-[#4f5f58]">
                  Aun no hay planificaciones suficientes para mostrar desglose por materia.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#18b6a4]/25 bg-[#075f53] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Lectura rapida</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                `Minutos de aprendizaje esta semana: ${dashboard?.metrics.learningMinutesThisWeek ?? 0}`,
                `Curriculas cargadas: ${dashboard?.metrics.curriculumCount ?? 0}`,
                `Handoffs humanos abiertos: ${dashboard?.metrics.openHandoffCount ?? 0}`,
              ].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-4">
                  <p className="text-[15px] leading-6 text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <h2 className="font-display text-2xl font-bold tracking-tight">Ultimos estudiantes</h2>
            <div className="mt-5 grid gap-3">
              {dashboard?.recentStudents.slice(0, 5).map((student) => (
                <div key={student.id} className="rounded-lg border border-[#e3ebe7] p-4">
                  <p className="font-semibold">{student.name}</p>
                  <p className="mt-1 text-sm text-[#4f5f58]">Grado {student.grade}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
