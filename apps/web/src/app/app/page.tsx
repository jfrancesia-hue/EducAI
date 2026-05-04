import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  Bell,
  BookOpenCheck,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Layers,
  LineChart,
  MessageCircle,
  PanelLeft,
  Radio,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";

const classroom =
  "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=85";
const student =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=85";
const workshop =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85";

type NavItem = {
  label: string;
  icon: typeof Home;
  href: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "Hoy", icon: Home, href: "/app", active: true },
  { label: "Estudiantes", icon: UsersRound, href: "/app/estudiantes" },
  { label: "Planificar", icon: ClipboardList, href: "/app/planificar" },
  { label: "Agente IA", icon: MessageCircle, href: "/app/agente" },
  { label: "Reportes", icon: LineChart, href: "/app/reportes" },
];

const metrics = [
  {
    label: "Comprension",
    value: "82%",
    note: "+9 pts en 14 dias",
    icon: Brain,
    tone: "bg-[#e7fbf7] text-[#087968]",
    bar: "bg-[#18b6a4]",
  },
  {
    label: "Confianza",
    value: "71%",
    note: "3 alertas suaves",
    icon: Activity,
    tone: "bg-[#fff6c9] text-[#876100]",
    bar: "bg-[#f8d95c]",
  },
  {
    label: "Ritmo",
    value: "91%",
    note: "lista para avanzar",
    icon: Target,
    tone: "bg-[#efedff] text-[#4f3ee2]",
    bar: "bg-[#7c6cff]",
  },
];

const missions = [
  {
    title: "Clase de proporcionalidad",
    detail: "Generar apertura, actividad central, cierre y ticket de salida para 7A.",
    status: "En produccion",
    icon: Layers,
    tone: "border-[#18b6a4]/30 bg-[#e7fbf7]",
    iconTone: "bg-[#18b6a4] text-white",
  },
  {
    title: "Recursos para la clase",
    detail: "Preparar consigna, ejemplo resuelto, practica y rubrica breve.",
    status: "Listo para revisar",
    icon: Send,
    tone: "border-[#f8d95c]/40 bg-[#fff8d7]",
    iconTone: "bg-[#f8d95c] text-[#1f2a24]",
  },
  {
    title: "Evaluacion rapida",
    detail: "Seleccionar criterios observables y feedback para la proxima clase.",
    status: "Requiere mirada",
    icon: FileText,
    tone: "border-[#ef5da8]/30 bg-[#fdeaf4]",
    iconTone: "bg-[#ef5da8] text-white",
  },
];

const students = [
  {
    name: "Luna F.",
    grade: "7A",
    state: "Requiere refuerzo",
    score: 68,
    tone: "bg-[#fdeaf4] text-[#b82170]",
  },
  {
    name: "Mateo R.",
    grade: "7A",
    state: "Avanzando",
    score: 82,
    tone: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    name: "Ailen C.",
    grade: "6B",
    state: "Buen ritmo",
    score: 91,
    tone: "bg-[#efedff] text-[#4f3ee2]",
  },
];

const agentEvents = [
  {
    time: "09:12",
    title: "Detecto tema con baja resolucion",
    detail: "La clase necesita mas ejemplos antes de pasar a ejercicios autonomos.",
  },
  {
    time: "09:18",
    title: "Propuso secuencia breve",
    detail: "Inicio, modelado, practica guiada y ticket de salida para 35 minutos.",
  },
  {
    time: "09:24",
    title: "Preparo materiales editables",
    detail: "Consigna, rubrica, solucionario docente y pregunta de cierre.",
  },
];

const tasks = [
  "Revisar secuencia generada antes de usar",
  "Ajustar consigna y rubrica de 7A",
  "Validar ticket de salida para seguimiento semanal",
];

export default function EducAiAppPage() {
  return (
    <main className="min-h-screen bg-[#eef5f3] p-3 text-[15px] text-[#14120f] [text-rendering:optimizeLegibility] sm:p-5">
      <div className="grid min-h-[calc(100vh-24px)] overflow-hidden rounded-lg border border-[#d5e1dc] bg-[#f8fbf7] shadow-float lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-[#d5e1dc] bg-[#11231f] p-4 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f8d95c] text-[#11231f]">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold leading-none">
                  EducAI
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-white/68">
                  Centro operativo
                </span>
              </span>
            </Link>

            <nav className="mt-8 grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href as Route}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium leading-6 transition",
                    item.active
                      ? "bg-white text-[#11231f] shadow-whisper"
                      : "text-white/72 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#18b6a4]" />
              <p className="text-[15px] font-semibold leading-6">Agente activo</p>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-white/70">
              Monitoreando planificaciones, recursos y pendientes docentes.
            </p>
            <button
              className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-white/10 text-white/72 transition hover:bg-white/15 hover:text-white"
              type="button"
              title="Configuracion"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-[#d5e1dc] bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5e1dc] bg-white lg:hidden"
                type="button"
                title="Menu"
              >
                <PanelLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                  Modo demo - Colegio del Valle
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Centro de produccion pedagogica
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden h-11 items-center gap-2 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] text-[#5b6962] md:flex">
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar estudiante, tema o curso
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d5e1dc] bg-white"
                type="button"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>
              <Button
                asChild
                className="bg-[#ff7a1a] text-white shadow-[0_14px_34px_rgba(255,122,26,0.36)] hover:bg-[#ea6508]"
              >
                <Link href="/app/agente">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Ejecutar agente
                </Link>
              </Button>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-[#d5e1dc] bg-white/70 px-4 py-3 sm:px-6 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href as Route}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium leading-6",
                  item.active
                    ? "bg-[#11231f] text-white"
                    : "border border-[#d5e1dc] bg-white text-[#33423c]",
                ].join(" ")}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.24fr_0.76fr]">
            <section className="grid content-start gap-5">
              <div className="relative overflow-hidden rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-float sm:p-6">
                <Image
                  src={classroom}
                  alt="Aula real con estudiantes trabajando"
                  fill
                  priority
                  sizes="(min-width: 1280px) 60vw, 100vw"
                  className="object-cover opacity-34"
                />
                <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(17,35,31,0.98)_0%,rgba(17,35,31,0.84)_54%,rgba(17,35,31,0.50)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,182,164,0.26)_0%,transparent_38%),linear-gradient(12deg,transparent_0%,rgba(248,217,92,0.13)_70%,rgba(239,93,168,0.14)_100%)]" />

                <div className="relative z-10 grid min-h-[440px] gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-[#f8d95c] text-[#11231f]">Clase en curso</Badge>
                      <Badge className="border-white/20 bg-white/12 text-white" variant="outline">
                        Matematica - 7A
                      </Badge>
                      <Badge
                        className="border-[#18b6a4]/40 bg-[#18b6a4]/20 text-white"
                        variant="outline"
                      >
                        3 salidas listas
                      </Badge>
                    </div>

                    <div className="max-w-2xl">
                      <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                        Produci clases, recursos y evaluaciones lindas en minutos.
                      </h2>
                      <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/88">
                        EducAI organiza objetivos, tiempos y contenidos; activa al agente y deja
                        materiales listos para revisar: actividades, rubricas, consignas y proximos
                        pasos.
                      </p>
                      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                          asChild
                          size="lg"
                          className="min-h-14 bg-[#ff7a1a] px-7 text-base font-bold text-white shadow-[0_18px_42px_rgba(255,122,26,0.38)] hover:bg-[#ea6508]"
                        >
                          <Link href="/app/agente">
                            Ejecutar Agente IA
                            <Sparkles className="h-5 w-5" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button asChild className="bg-white text-[#11231f] hover:bg-white/90">
                          <Link href="/app/protocolo">
                            Crear plan de clase
                            <Brain className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                        >
                          Ver evidencia
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/16 bg-white/12 p-4 shadow-float backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] uppercase tracking-[0.12em] text-white/68">
                          Pulso del agente
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold">Agente activo</p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#18b6a4] text-white">
                        <Radio className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {[
                        "Clase estructurada",
                        "Material generado",
                        "Revision docente pendiente",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-lg bg-white/12 px-3 py-2"
                        >
                          <span className="text-[15px] leading-6 text-white/84">{item}</span>
                          <span
                            className={[
                              "h-2.5 w-2.5 rounded-full",
                              ["bg-[#18b6a4]", "bg-[#f8d95c]", "bg-[#ef5da8]"][index],
                            ].join(" ")}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      asChild
                      className="mt-5 min-h-12 w-full bg-[#ff7a1a] font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]"
                    >
                      <Link href="/app/agente">
                        Abrir guia del agente
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div id="reportes" className="scroll-mt-24 grid gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="overflow-hidden rounded-lg border border-[#d5e1dc] bg-white shadow-whisper"
                  >
                    <span className={["block h-1 w-full", metric.bar].join(" ")} />
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <span
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            metric.tone,
                          ].join(" ")}
                        >
                          <metric.icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="text-[15px] text-[#5b6962]">{metric.label}</p>
                      </div>
                      <p className="mt-5 font-display text-4xl font-bold tracking-tight">
                        {metric.value}
                      </p>
                      <p className="mt-2 text-[15px] leading-6 text-[#5b6962]">{metric.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                        Misiones activas
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Produccion de hoy
                      </h2>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver todo
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {missions.map((mission) => (
                      <div
                        key={mission.title}
                        className={["rounded-lg border p-4", mission.tone].join(" ")}
                      >
                        <div className="flex gap-4">
                          <span
                            className={[
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                              mission.iconTone,
                            ].join(" ")}
                          >
                            <mission.icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="font-semibold">{mission.title}</p>
                            <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                              {mission.detail}
                            </p>
                            <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#33423c]">
                              {mission.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[#d5e1dc] bg-[#11231f] p-5 text-white shadow-whisper">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/62">
                        Actividad del agente
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Linea viva
                      </h2>
                    </div>
                    <MessageCircle className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
                  </div>
                  <div className="mt-5 grid gap-4">
                    {agentEvents.map((event) => (
                      <div key={event.time} className="grid grid-cols-[58px_1fr] gap-3">
                        <span className="text-[13px] font-semibold text-[#f8d95c]">
                          {event.time}
                        </span>
                        <div className="border-l border-white/12 pl-4">
                          <p className="font-semibold">{event.title}</p>
                          <p className="mt-1 text-[15px] leading-6 text-white/76">{event.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="grid content-start gap-5">
              <div className="overflow-hidden rounded-lg border border-[#d5e1dc] bg-white shadow-whisper">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={student}
                    alt="Estudiante leyendo con acompanamiento"
                    fill
                    sizes="(min-width: 1280px) 34vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[15px] font-semibold leading-6 text-[#087968]">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Agente EducAI
                  </div>
                  <p className="mt-3 text-lg font-semibold leading-7">
                    "Te propongo una apertura breve, dos ejemplos y una practica con cierre."
                  </p>
                  <div className="mt-5 rounded-lg bg-[#eef5f3] p-4">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                      Siguiente mensaje
                    </p>
                    <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">
                      Preparado para que el docente lo edite y lo lleve al aula o lo comparta.
                    </p>
                  </div>
                </div>
              </div>

              <div
                id="seguimiento"
                className="scroll-mt-24 rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                      Estudiantes a mirar
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                      Seguimiento de aula
                    </h2>
                  </div>
                  <UsersRound className="h-6 w-6 text-[#18b6a4]" aria-hidden="true" />
                </div>
                <div className="mt-5 grid gap-3">
                  {students.map((person) => (
                    <div
                      key={person.name}
                      className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{person.name}</p>
                          <p className="mt-1 text-[15px] text-[#5b6962]">
                            {person.grade} - {person.state}
                          </p>
                        </div>
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[13px] font-semibold",
                            person.tone,
                          ].join(" ")}
                        >
                          {person.score}%
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e4eee9]">
                        <div
                          className="h-full rounded-full bg-[#18b6a4]"
                          style={{ width: `${person.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-[#d5e1dc] bg-[#172d65] p-5 text-white shadow-whisper">
                <Image
                  src={workshop}
                  alt="Equipo docente trabajando sobre una mesa"
                  fill
                  sizes="(min-width: 1280px) 34vw, 100vw"
                  className="object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(23,45,101,0.95),rgba(79,62,226,0.64))]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold tracking-tight">Plan de hoy</h2>
                    <CalendarDays className="h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {tasks.map((task) => (
                      <div key={task} className="flex gap-3 rounded-lg bg-white/12 p-3">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#f8d95c]"
                          aria-hidden="true"
                        />
                        <p className="text-[15px] leading-6 text-white/86">{task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
                  <p className="mt-4 font-semibold">Secuencia generada</p>
                  <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">
                    3 actividades listas para revisar antes de compartir.
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-4 px-0 text-[#11231f] hover:bg-transparent"
                  >
                    <Link href="/app/protocolo">
                      Abrir protocolo
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
                <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
                  <ShieldCheck className="h-6 w-6 text-[#b82170]" aria-hidden="true" />
                  <p className="mt-4 font-semibold">Seguridad activa</p>
                  <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">
                    Uso de datos escolares con trazabilidad y revision docente.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
