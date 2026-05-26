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
      note: "borradores disponibles",
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
    <AppShell title="Inicio">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="grid content-start gap-5">
          <div className="relative overflow-hidden rounded-lg border border-[#18b6a4]/25 bg-[#075f53] p-6 text-white shadow-float">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(98,220,202,0.34)_0%,rgba(7,95,83,0)_42%),linear-gradient(22deg,rgba(248,217,92,0.16)_0%,rgba(255,122,26,0.12)_100%)]" />
            <div className="relative z-10">
              <Badge className="bg-[#f8d95c] text-[#075f53]">EducAI docente</Badge>
              <h2 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Tu mesa de trabajo para crear mejores clases.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">
                Empeza por una planificacion editable, revisa el seguimiento de estudiantes y mira
                indicadores utiles sin cambiar de herramienta.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                  <Link href="/app/planificar" prefetch={false}>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Crear clase
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white"
                >
                  <Link href="/app/estudiantes">
                    <UsersRound className="h-4 w-4" aria-hidden="true" />
                    Ver estudiantes
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white"
                >
                  <Link href="/app/reportes">
                    <LineChart className="h-4 w-4" aria-hidden="true" />
                    Ver reportes
                  </Link>
                </Button>
              </div>
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
                No pudimos traer la informacion de tu espacio. Reintenta en unos minutos.
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Acciones utiles</h2>
            <div className="mt-5 grid gap-3">
              {[
                { label: "Crear una clase editable", href: "/app/planificar" as Route },
                { label: "Revisar estudiantes", href: "/app/estudiantes" as Route },
                { label: "Revisar indicadores", href: "/app/reportes" as Route },
              ].map(({ label, href }) => (
                <Button
                  key={href}
                  asChild
                  className="justify-start bg-white/10 text-left text-white hover:bg-white/15"
                >
                  <Link href={href} prefetch={false}>
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
