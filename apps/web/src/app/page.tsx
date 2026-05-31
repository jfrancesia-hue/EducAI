import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Badge, Button, Card, CardHeader, CardTitle } from "@educai/ui";
import { ImmersiveShowcase } from "./_components/immersive-showcase";

const heroImage =
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=85";
const teacherImage =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=85";
const familyImage =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85";
const studentImage =
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=85";

const proofPoints = [
  {
    value: "24/7",
    label: "asistente docente disponible",
    tone: "from-[#18b6a4] to-[#72e4d2]",
    border: "border-[#18b6a4]/30",
  },
  {
    value: "3",
    label: "modos: planificar, producir y evaluar",
    tone: "from-[#f8d95c] to-[#ff9f4a]",
    border: "border-[#f8d95c]/40",
  },
  {
    value: "6",
    label: "tipos de materiales por clase",
    tone: "from-[#ef5da8] to-[#7c6cff]",
    border: "border-[#ef5da8]/30",
  },
];

const features = [
  {
    icon: MessageCircle,
    title: "Asistente docente multicanal",
    description:
      "Ayuda a ordenar clases, responder dudas frecuentes, organizar consignas y convertir ideas en materiales concretos.",
    accent: "bg-[#18b6a4]",
    iconTone: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    icon: BookOpenCheck,
    title: "Planificación más simple",
    description:
      "Transformá grado, tema, objetivos y tiempo disponible en una base editable para revisar, adaptar y usar.",
    accent: "bg-[#f8d95c]",
    iconTone: "bg-[#fff6c9] text-[#876100]",
  },
  {
    icon: BarChart3,
    title: "Visibilidad institucional",
    description:
      "Muestra progreso, alertas tempranas y brechas curriculares para coordinar decisiones con evidencia.",
    accent: "bg-[#7c6cff]",
    iconTone: "bg-[#efedff] text-[#4f3ee2]",
  },
  {
    icon: ShieldCheck,
    title: "Trabajo seguro con datos escolares",
    description:
      "Diseñado con privacidad, trazabilidad y control docente para trabajar con información educativa sensible.",
    accent: "bg-[#ef5da8]",
    iconTone: "bg-[#fdeaf4] text-[#b82170]",
  },
];

const journeys = [
  {
    label: "Docentes",
    title: "Una ayuda concreta para preparar clases, recursos y consignas en menos tiempo.",
    image: familyImage,
    color: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    label: "Equipos",
    title: "Coordinación pedagógica con evidencias, reportes y seguimiento semanal.",
    image: teacherImage,
    color: "bg-[#fff6c9] text-[#876100]",
  },
  {
    label: "Estudiantes",
    title: "Actividades claras, feedback útil y prácticas mejor orientadas.",
    image: studentImage,
    color: "bg-[#fdeaf4] text-[#b82170]",
  },
];

const safeguards = [
  "Espacios separados para escuelas, equipos docentes e instituciones.",
  "Guías pedagógicas orientadas a planificación, evaluación y producción de recursos.",
  "Control docente sobre consignas, rúbricas, feedback y mensajes antes de compartir.",
  "Información organizada para acompañar decisiones pedagógicas con responsabilidad.",
];

const teacherPains = [
  {
    label: "Antes",
    title: "Horas preparando planificaciones",
    description:
      "Objetivos, actividades, recursos, rúbricas y adaptaciones terminan ocupando noches y fines de semana.",
  },
  {
    label: "Con EducAI",
    title: "Una base clara para revisar y adaptar",
    description:
      "Partís de una propuesta ordenada, editable y alineada a tu clase. Vos ajustás con tu criterio.",
  },
  {
    label: "Resultado",
    title: "Más tiempo para enseñar",
    description:
      "Menos carga repetitiva, más foco en el aula y mejor seguimiento de lo que cada estudiante necesita.",
  },
];

const heroTags = ["Asistente docente", "Menos carga", "Planificación", "Datos cuidados"];

const heroMetrics = [
  { label: "Planificación semanal", value: "12 min", helper: "base lista para revisar" },
  { label: "Recursos generados", value: "5", helper: "actividades + rúbrica" },
  { label: "Control docente", value: "100%", helper: "nada se comparte sin revisión" },
];

const heroTagStyles = [
  "border-[#18b6a4]/45 bg-[#18b6a4]/22",
  "border-[#f8d95c]/45 bg-[#f8d95c]/18",
  "border-[#ef5da8]/45 bg-[#ef5da8]/20",
  "border-white/25 bg-white/12",
];

const educatorRegisterUrl = "/registro?producto=educai&plan=free";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-slate-950">
      <section className="relative min-h-[92vh] px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src={heroImage}
          alt="Docente acompañando a estudiantes en un aula luminosa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,23,0.94)_0%,rgba(8,13,23,0.82)_48%,rgba(8,13,23,0.36)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,182,164,0.24)_0%,transparent_34%),linear-gradient(18deg,transparent_0%,rgba(239,93,168,0.16)_72%,rgba(248,217,92,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f7f8f3] to-transparent" />
        <div className="absolute left-0 top-28 hidden h-44 w-1 bg-gradient-to-b from-[#18b6a4] via-[#f8d95c] to-[#ef5da8] md:block" />

        <header className="fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-slate-950/78 px-4 py-3 text-white shadow-float backdrop-blur-xl sm:left-6 sm:right-6 lg:left-8 lg:right-8">
          <Link href="/" className="flex items-center gap-3" aria-label="EducAI inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none tracking-tight">
                EducAI
              </span>
              <span className="block text-sm leading-5 text-white/82">Asistente docente</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <Link href="#plataforma" className="transition hover:text-white">
              Plataforma
            </Link>
            <Link href="#seguridad" className="transition hover:text-white">
              Seguridad
            </Link>
            <Link href="#ecosistema" className="transition hover:text-white">
              Ecosistema
            </Link>
            <Link href="/precios" className="transition hover:text-white">
              Planes
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="hidden bg-[#ff7a1a] text-white shadow-[0_12px_28px_rgba(255,122,26,0.28)] hover:bg-[#ea6508] sm:inline-flex"
            >
              <Link href={educatorRegisterUrl}>Registrarse</Link>
            </Button>
            <Button
              asChild
              size="sm"
              pill
              className="bg-white text-slate-950 shadow-none hover:bg-white/90"
            >
              <Link href="/login">
                Ingresar <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(92vh-96px)] max-w-7xl items-center gap-12 py-20 lg:grid-cols-[0.92fr_0.78fr] lg:py-16">
          <div className="max-w-3xl">
            <Badge
              className="border-white/30 bg-[#18b6a4]/22 text-white backdrop-blur-md"
              variant="outline"
            >
              Herramientas para docentes, equipos y escuelas
            </Badge>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Planificar no debería llevarte horas.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-xl">
              EducAI te ayuda a preparar clases, actividades y recursos en menos tiempo, con tu
              criterio docente siempre al centro.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {heroTags.map((item, index) => (
                <span
                  key={item}
                  className={[
                    "rounded-full border px-3 py-1 text-sm font-semibold text-white shadow-float backdrop-blur-md",
                    heroTagStyles[index],
                  ].join(" ")}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                pill
                className="bg-[#f8d95c] text-slate-950 shadow-float hover:bg-[#f3ce36]"
              >
                <Link href={educatorRegisterUrl}>
                  Sumarme al piloto docente <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                pill
                variant="outline"
                className="border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              >
                <Link href="#plataforma">
                  <Play className="h-5 w-5" aria-hidden="true" />
                  Ver cómo funciona
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-[#18b6a4]/30 blur-3xl" />
            <div className="absolute -right-8 bottom-12 h-52 w-52 rounded-full bg-[#ef5da8]/24 blur-3xl" />
            <div className="hero-orbit relative ml-auto max-w-[520px] rounded-[2rem] border border-white/15 bg-white/12 p-4 text-white shadow-[0_34px_110px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/12 bg-slate-950/82">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/66">
                      EducAI Workspace
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold">
                      Clase lista para mañana
                    </p>
                  </div>
                  <span className="rounded-full bg-[#18b6a4]/18 px-3 py-1 text-sm font-semibold text-[#b8fff4]">
                    Revisable
                  </span>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8d95c] text-slate-950">
                        <BookOpenCheck className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm text-white/70">Objetivo de la clase</p>
                        <p className="font-semibold">
                          Fracciones equivalentes con ejemplos cotidianos
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {["Inicio", "Práctica", "Cierre"].map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white/10 px-3 py-2 text-center text-sm text-white/82"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {heroMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{metric.label}</p>
                          <p className="text-xs text-white/62">{metric.helper}</p>
                        </div>
                        <p className="font-display text-2xl font-bold text-[#f8d95c]">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
        {proofPoints.map((point) => (
          <div
            key={point.label}
            className={[
              "overflow-hidden rounded-lg border bg-white p-5 shadow-float",
              point.border,
            ].join(" ")}
          >
            <span
              className={["block h-1 w-20 rounded-full bg-gradient-to-r", point.tone].join(" ")}
            />
            <p className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950">
              {point.value}
            </p>
            <p className="mt-1 text-sm text-slate-600">{point.label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-float md:grid-cols-[0.92fr_1.08fr] md:p-8 lg:p-10">
          <div className="flex flex-col justify-center">
            <Badge
              variant="outline"
              className="w-fit border-[#ff7a1a]/30 bg-[#fff3e9] text-[#9a4300]"
            >
              Para docentes reales
            </Badge>
            <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Ser docente no debería significar llevarte la escuela a casa todos los días.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              EducAI está pensado para aliviar la preparación diaria sin quitarte control: te da una
              base de trabajo, vos la revisás, la adaptás y decidís qué llega al aula.
            </p>
          </div>
          <div className="grid gap-3">
            {teacherPains.map((item, index) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-[#f7f8f3] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#18b6a4]/35 hover:bg-white hover:shadow-whisper"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 font-display text-lg font-bold text-white transition duration-300 group-hover:bg-[#18b6a4]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#087968]">
                      {item.label}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ImmersiveShowcase />

      <section
        id="plataforma"
        className="mx-auto grid scroll-mt-28 max-w-7xl grid-cols-1 gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8"
      >
        <div className="flex flex-col justify-center">
          <Badge
            variant="outline"
            className="w-fit border-[#18b6a4]/35 bg-[#e7fbf7] text-[#087968]"
          >
            Trabajo docente más claro
          </Badge>
          <h2 className="mt-5 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Menos tiempo empezando de cero. Más tiempo para enseñar.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            EducAI conecta planificación, aula y seguimiento para que cada docente pueda preparar
            mejor, revisar con claridad y sostener la semana con menos carga operativa.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-whisper transition duration-300 hover:-translate-y-1 hover:border-[#18b6a4]/35 hover:shadow-float"
              >
                <span
                  className={[
                    "block h-1 w-full transition duration-300 group-hover:h-1.5",
                    feature.accent,
                  ].join(" ")}
                />
                <div className="p-5">
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105",
                      feature.iconTone,
                    ].join(" ")}
                  >
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden rounded-lg bg-slate-950 p-4 shadow-float sm:p-6">
          <Image
            src={teacherImage}
            alt="Docente usando tecnologia educativa con estudiantes"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(15,23,42,0.94)_0%,rgba(15,23,42,0.70)_48%,rgba(15,23,42,0.28)_100%)]" />
          <div className="relative z-10 grid h-full min-h-[572px] content-between gap-4">
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.08em] text-white/82">Panel docente</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    7A - Matemática
                  </h3>
                </div>
                <Badge className="bg-emerald-400/20 text-emerald-100">En progreso</Badge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["Comprensión", "Confianza", "Ritmo"].map((item, index) => (
                  <div key={item} className="rounded-lg bg-white/10 p-3">
                    <p className="text-sm text-white/82">{item}</p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {[82, 74, 91][index]}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-white/15 bg-white p-4 shadow-float">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                  Asistente docente
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Convertí este objetivo en una actividad de 35 minutos con inicio, práctica,
                  cierre, criterios de éxito y una pregunta de salida.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#4f3ee2]">
                  <Brain className="h-4 w-4" aria-hidden="true" />
                  Base editable lista
                </div>
              </div>
              <div className="rounded-lg border border-white/15 bg-[#f8d95c] p-4 text-slate-950 shadow-float">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
                  Alerta útil
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">
                  5 recursos listos para revisar antes de la clase.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  La plataforma prepara una base; la docente revisa, adapta y decide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ecosistema" className="scroll-mt-28 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="border-[#7c6cff]/35 bg-[#efedff] text-[#4f3ee2]">
              Ecosistema EducAI
            </Badge>
            <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Una plataforma para cada persona que sostiene el aprendizaje.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {journeys.map((journey) => (
              <Card
                key={journey.label}
                className="overflow-hidden rounded-lg border-slate-200 shadow-whisper"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={journey.image}
                    alt={journey.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition duration-700 hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <Badge variant="muted" className={["w-fit", journey.color].join(" ")}>
                    {journey.label}
                  </Badge>
                  <CardTitle className="text-2xl">{journey.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="seguridad"
        className="mx-auto grid scroll-mt-28 max-w-7xl grid-cols-1 gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
      >
        <div>
          <Badge variant="outline" className="border-[#ef5da8]/35 bg-[#fdeaf4] text-[#b82170]">
            Confianza primero
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            La tecnología acompaña. El docente conduce.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            El diseño no tapa lo esencial: privacidad, trazabilidad, límites pedagógicos y revisión
            docente antes de publicar o compartir materiales.
          </p>
        </div>
        <div className="grid gap-3">
          {safeguards.map((item) => (
            <div
              key={item}
              className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-whisper"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]" aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#62dcca] px-4 py-24 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Badge className="border-[#087968]/25 bg-white/72 text-[#075f53]" variant="outline">
              Pilotos 2026
            </Badge>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Listo para convertirse en un producto que docentes y escuelas quieran abrir todos los
              días.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Una experiencia pensada para que el trabajo docente sea más claro, más liviano y más
              fácil de sostener todos los días.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" pill className="bg-slate-950 text-white hover:bg-slate-800">
                <Link href={educatorRegisterUrl}>
                  Sumarme al piloto <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                pill
                variant="outline"
                className="border-[#075f53]/25 bg-white/72 text-[#075f53] hover:bg-white hover:text-[#064c43]"
              >
                <Link href="/colegios">
                  Ver para colegios <UsersRound className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/55 bg-white/76 p-5 shadow-float backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-[#087968]/16 pb-4">
              <LockKeyhole className="h-5 w-5 text-[#075f53]" aria-hidden="true" />
              <p className="font-display text-lg font-semibold">Lo que cuida EducAI</p>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "Acceso por rol",
                "Datos cuidados",
                "Planes editables",
                "Seguimiento claro",
                "Acompañamiento docente",
                "Mejora continua",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg bg-[#e4fffb] px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{item}</span>
                  <span className="h-2 w-16 overflow-hidden rounded-full bg-[#087968]/18">
                    <span className="block h-full w-2/3 rounded-full bg-[#087968]" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-4 pb-8 text-white/60 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>2026 Nativos Consultora Digital. Hecho en Argentina para LATAM.</p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
            <Link href="/seguridad" className="hover:text-white">
              Seguridad
            </Link>
            <Link href="/contacto" className="hover:text-white">
              Contacto
            </Link>
            <Link href="/precios" className="hover:text-white">
              Planes
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
