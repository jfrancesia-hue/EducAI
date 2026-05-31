import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { headers } from "next/headers";
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
import { previewDashboard } from "./_components/preview-data";

const classroomHeroImage =
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=85";
const teacherFocusImage =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85";

function metricCards(data: typeof previewDashboard) {
  return [
    {
      label: "Estudiantes",
      value: data.metrics.studentCount,
      note: data.scope === "teacher" ? "alcance del docente" : "alcance instituciónal",
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
      label: "Diagnósticos completos",
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

export default function EducAiAppPage() {
  const dashboard = previewDashboard;

  if (process.env.NODE_ENV !== "development" && headers().get("x-educai-authenticated") !== "1") {
    redirect("/login");
  }

  return (
    <AppShell title="Inicio">
      <div className="grid gap-5 bg-[radial-gradient(circle_at_12%_0%,rgba(24,182,164,0.08),transparent_34%),radial-gradient(circle_at_90%_12%,rgba(248,217,92,0.10),transparent_30%)] p-4 sm:p-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="grid content-start gap-5">
          <div className="relative grid overflow-hidden rounded-[28px] border border-[#18b6a4]/25 bg-[#075f53] text-white shadow-float lg:grid-cols-[1.05fr_0.95fr]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(98,220,202,0.34)_0%,rgba(7,95,83,0)_42%),linear-gradient(22deg,rgba(248,217,92,0.16)_0%,rgba(255,122,26,0.12)_100%)]" />
            <div className="relative z-10 p-6 sm:p-7">
              <Badge className="bg-[#f8d95c] text-[#075f53]">EducAI docente</Badge>
              <h2 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Tu mesa de trabajo para crear mejores clases.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/86">
                Empeza por una planificacion editable, revisa el seguimiento de estudiantes y mira
                indicadores útiles sin cambiar de herramienta.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full bg-[#ff7a1a] text-white shadow-[0_16px_34px_rgba(255,122,26,0.3)] hover:bg-[#ea6508]"
                >
                  <Link href="/app/planificar" prefetch={false}>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Crear clase
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/24 bg-white/12 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  <Link href="/app/estudiantes">
                    <UsersRound className="h-4 w-4 text-[#f8d95c]" aria-hidden="true" />
                    Ver estudiantes
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/24 bg-white/12 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  <Link href="/app/reportes">
                    <LineChart className="h-4 w-4 text-[#72e4d2]" aria-hidden="true" />
                    Ver reportes
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[260px] overflow-hidden border-t border-white/12 lg:border-l lg:border-t-0">
              <Image
                src={classroomHeroImage}
                alt="Aula real con estudiantes trabajando junto a una docente"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,95,83,0.08)_0%,rgba(7,95,83,0.78)_100%)]" />
              <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  ["Atencion", "88%", "bg-[#e7fbf7] text-[#087968]"],
                  ["Progreso", "+14%", "bg-[#fff8d7] text-[#876100]"],
                  ["Privacidad", "Activa", "bg-[#fdeaf4] text-[#b82170]"],
                ].map(([label, value, tone]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/30 bg-white/86 p-3 shadow-float backdrop-blur-md"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#4f5f58]">
                      {label}
                    </p>
                    <p
                      className={[
                        "mt-1 inline-flex rounded-full px-2.5 py-1 text-sm font-black",
                        tone,
                      ].join(" ")}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {dashboard ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards(dashboard).map((card) => (
                  <article
                    key={card.label}
                    className="group relative overflow-hidden rounded-[1.35rem] border border-[#d5e1dc] bg-white p-5 shadow-whisper transition duration-300 hover:-translate-y-1 hover:border-[#18b6a4]/35 hover:shadow-float"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_20%_0%,rgba(24,182,164,0.14),transparent_46%)] opacity-80" />
                    <span
                      className={[
                        "relative flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-105",
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
                <section className="rounded-[1.5rem] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                        Planificaciones recientes
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Produccion docente
                      </h2>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7fbf7] text-[#087968]">
                      <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {dashboard.recentLessonPlans.length ? (
                      dashboard.recentLessonPlans.slice(0, 6).map((plan) => (
                        <article
                          key={plan.id}
                          className="rounded-2xl border border-[#e3ebe7] bg-[#fbfffd] p-4 transition hover:border-[#18b6a4]/35 hover:shadow-whisper"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                {plan.subject} - {plan.topic}
                              </p>
                              <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                                Grado {plan.grade} Â· {plan.durationMinutes} min
                              </p>
                            </div>
                            <Badge className="bg-[#eef5f3] text-[#33423c]">{plan.status}</Badge>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="text-[15px] leading-6 text-[#4f5f58]">
                        Todavía no hay planificaciones generadas en este alcance.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                        Mezcla por materia
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Que se esta planificando
                      </h2>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efedff] text-[#4f3ee2]">
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {dashboard.subjectMix.length ? (
                      dashboard.subjectMix.map((item) => (
                        <div key={item.subject} className="rounded-2xl bg-[#eef5f3] p-4">
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
          <section className="overflow-hidden rounded-[24px] border border-[#d5e1dc] bg-white shadow-whisper">
            <div className="relative h-36">
              <Image
                src={teacherFocusImage}
                alt="Docente usando recursos digitales en el aula"
                fill
                sizes="(min-width: 1280px) 34vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,95,83,0.04)_0%,rgba(7,95,83,0.64)_100%)]" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/88 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#087968] backdrop-blur">
                Aula aumentada
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                    Seguimiento
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                    Estudiantes recientes
                  </h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7fbf7] text-[#087968]">
                  <UsersRound className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {dashboard?.recentStudents.slice(0, 6).map((student) => (
                  <article
                    key={student.id}
                    className="rounded-2xl border border-[#e3ebe7] bg-[#fbfffd] p-4 transition hover:border-[#18b6a4]/35 hover:shadow-whisper"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                          Grado {student.grade}
                          {student.schoolName ? ` Â· ${student.schoolName}` : ""}
                        </p>
                      </div>
                      <Badge
                        className={
                          student.diagnosticCompleted
                            ? "bg-[#e7fbf7] text-[#087968]"
                            : "bg-[#fff8d7] text-[#876100]"
                        }
                      >
                        {student.diagnosticCompleted ? "Diagnóstico listo" : "Pendiente"}
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
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-4 rounded-full px-3 text-[#11231f] hover:bg-[#e7fbf7]"
              >
                <Link href="/app/estudiantes">Abrir modulo de estudiantes</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#163f36]/20 bg-[linear-gradient(135deg,#11231f_0%,#075f53_100%)] p-5 text-white shadow-whisper">
            <h2 className="font-display text-2xl font-bold tracking-tight">Acciones útiles</h2>
            <div className="mt-5 grid gap-3">
              {[
                {
                  label: "Crear una clase editable",
                  href: "/app/planificar" as Route,
                  icon: Sparkles,
                  tone: "text-[#f8d95c]",
                },
                {
                  label: "Revisar estudiantes",
                  href: "/app/estudiantes" as Route,
                  icon: UsersRound,
                  tone: "text-[#72e4d2]",
                },
                {
                  label: "Revisar indicadores",
                  href: "/app/reportes" as Route,
                  icon: LineChart,
                  tone: "text-[#ef5da8]",
                },
              ].map(({ label, href, icon: Icon, tone }) => (
                <Button
                  key={href}
                  asChild
                  className="justify-start rounded-full border border-white/12 bg-white/10 text-left text-white hover:bg-white/15"
                >
                  <Link href={href}>
                    <Icon className={["h-4 w-4", tone].join(" ")} aria-hidden="true" />
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
