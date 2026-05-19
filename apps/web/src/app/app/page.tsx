import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BookOpenCheck,
  Brain,
  ClipboardList,
  GraduationCap,
  LineChart,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "./_components/app-shell";
import { fetchInstitutionalDashboard } from "../../lib/api/institutional-dashboard";
import { createSupabaseServerClient } from "../../lib/supabase/server";

function metricCards(data: NonNullable<Awaited<ReturnType<typeof fetchInstitutionalDashboard>>>) {
  return [
    {
      label: "Estudiantes",
      value: data.metrics.studentCount,
      note: data.scope === "teacher" ? "alcance del docente" : "alcance institucional",
      icon: UsersRound,
      tone: "bg-[#e7fbf7] text-[#087968]",
    },
    {
      label: "Clases generadas",
      value: data.metrics.lessonPlanCount,
      note: "planes cargados en el tenant",
      icon: ClipboardList,
      tone: "bg-[#fff8d7] text-[#876100]",
    },
    {
      label: "Diagnosticos completos",
      value: `${data.metrics.diagnosticCompletionRate}%`,
      note: "sobre perfiles disponibles",
      icon: Brain,
      tone: "bg-[#efedff] text-[#4f3ee2]",
    },
    {
      label: "Handoffs abiertos",
      value: data.metrics.openHandoffCount,
      note: "requieren seguimiento humano",
      icon: AlertTriangle,
      tone: "bg-[#fdeaf4] text-[#b82170]",
    },
  ];
}

export default async function EducAiAppPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const dashboard = await fetchInstitutionalDashboard(session.access_token);

  return (
    <AppShell title="Centro operativo institucional">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-6 text-white shadow-float">
            <Badge className="bg-[#f8d95c] text-[#11231f]">Datos reales</Badge>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Estado operativo del trabajo docente y del seguimiento institucional.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">
              Este panel resume estudiantes, planificaciones, diagnosticos y handoffs del tenant
              autenticado. Ya no depende de datos de ejemplo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                <Link href="/app/planificar">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Generar clase
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white">
                <Link href="/app/reportes">
                  <LineChart className="h-4 w-4" aria-hidden="true" />
                  Ver reportes
                </Link>
              </Button>
            </div>
          </div>

          {dashboard ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards(dashboard).map((card) => (
                  <article
                    key={card.label}
                    className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
                  >
                    <span
                      className={[
                        "flex h-11 w-11 items-center justify-center rounded-lg",
                        card.tone,
                      ].join(" ")}
                    >
                      <card.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-[15px] text-[#5b6962]">{card.label}</p>
                    <p className="mt-1 font-display text-4xl font-bold tracking-tight">
                      {card.value}
                    </p>
                    <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{card.note}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
                <section className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                        Planificaciones recientes
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Produccion docente
                      </h2>
                    </div>
                    <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {dashboard.recentLessonPlans.length ? (
                      dashboard.recentLessonPlans.slice(0, 6).map((plan) => (
                        <article
                          key={plan.id}
                          className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                {plan.subject} - {plan.topic}
                              </p>
                              <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                                Grado {plan.grade} · {plan.durationMinutes} min
                              </p>
                            </div>
                            <Badge className="bg-[#eef5f3] text-[#33423c]">{plan.status}</Badge>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="text-[15px] leading-6 text-[#4f5f58]">
                        Todavia no hay planificaciones generadas en este alcance.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                        Mezcla por materia
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Que se esta planificando
                      </h2>
                    </div>
                    <GraduationCap className="h-6 w-6 text-[#4f3ee2]" aria-hidden="true" />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {dashboard.subjectMix.length ? (
                      dashboard.subjectMix.map((item) => (
                        <div key={item.subject} className="rounded-lg bg-[#eef5f3] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold">{item.subject}</p>
                            <span className="font-display text-2xl font-bold">{item.count}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[15px] leading-6 text-[#4f5f58]">
                        No hay suficientes planes para calcular mezcla por materia.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <article className="rounded-lg border border-[#f0c9c9] bg-white p-5 shadow-whisper">
              <AlertTriangle className="h-6 w-6 text-[#b82170]" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-bold">No pudimos cargar el panel</h2>
              <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">
                Revisa `NEXT_PUBLIC_API_URL` o la sesion actual. El frontend no recibio resumen del
                API.
              </p>
            </article>
          )}
        </section>

        <aside className="grid content-start gap-5">
          <section className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                  Seguimiento
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  Estudiantes recientes
                </h2>
              </div>
              <UsersRound className="h-6 w-6 text-[#18b6a4]" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-3">
              {dashboard?.recentStudents.slice(0, 6).map((student) => (
                <article key={student.id} className="rounded-lg border border-[#e3ebe7] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                        Grado {student.grade}
                        {student.schoolName ? ` · ${student.schoolName}` : ""}
                      </p>
                    </div>
                    <Badge
                      className={
                        student.diagnosticCompleted
                          ? "bg-[#e7fbf7] text-[#087968]"
                          : "bg-[#fff8d7] text-[#876100]"
                      }
                    >
                      {student.diagnosticCompleted ? "Diagnostico listo" : "Pendiente"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#4f5f58]">
                    {student.opportunities.length
                      ? `A trabajar: ${student.opportunities.slice(0, 2).join(", ")}`
                      : "Sin alertas cargadas por ahora."}
                  </p>
                </article>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-[#11231f]">
              <Link href="/app/estudiantes">Abrir modulo de estudiantes</Link>
            </Button>
          </section>

          <section className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Acciones rapidas</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                { label: "Planificar una nueva clase", href: "/app/planificar" as Route },
                { label: "Revisar indicadores reales", href: "/app/reportes" as Route },
                { label: "Abrir el agente institucional", href: "/app/agente" as Route },
              ].map(({ label, href }) => (
                <Button
                  key={href}
                  asChild
                  className="justify-start bg-white/10 text-left text-white hover:bg-white/15"
                >
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
