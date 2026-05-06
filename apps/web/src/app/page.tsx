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
import { VisualImage } from "./_components/visual-image";

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
    title: "Agente docente multicanal",
    description:
      "Ayuda a preparar clases, responder dudas frecuentes, organizar consignas y convertir ideas en materiales concretos.",
    accent: "bg-[#18b6a4]",
    iconTone: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    icon: BookOpenCheck,
    title: "Planificacion docente asistida",
    description:
      "Convierte grado, tema, objetivos y tiempo disponible en secuencias didacticas listas para revisar y usar.",
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
      "Disenado con privacidad, trazabilidad y control docente para trabajar con informacion educativa sensible.",
    accent: "bg-[#ef5da8]",
    iconTone: "bg-[#fdeaf4] text-[#b82170]",
  },
];

const journeys = [
  {
    label: "Docentes",
    title: "Un copiloto para preparar clases, recursos y consignas en menos tiempo.",
    image: familyImage,
    color: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    label: "Equipos",
    title: "Coordinacion pedagogica con evidencias, reportes y seguimiento semanal.",
    image: teacherImage,
    color: "bg-[#fff6c9] text-[#876100]",
  },
  {
    label: "Estudiantes",
    title: "Actividades claras, feedback util y practicas mejor orientadas.",
    image: studentImage,
    color: "bg-[#fdeaf4] text-[#b82170]",
  },
];

const safeguards = [
  "Aislamiento multi-tenant preparado para escuelas, equipos docentes e instituciones.",
  "Prompts pedagogicos orientados a planificacion, evaluacion y produccion de recursos.",
  "Control docente sobre consignas, rubricas, feedback y mensajes antes de compartir.",
  "Auditoria y datos estructurados para evolucionar hacia cumplimiento institucional.",
];

const heroTags = ["Agente docente", "Docentes", "Planificacion", "Datos cuidados"];

const heroTagStyles = [
  "border-[#18b6a4]/45 bg-[#18b6a4]/22",
  "border-[#f8d95c]/45 bg-[#f8d95c]/18",
  "border-[#ef5da8]/45 bg-[#ef5da8]/20",
  "border-white/25 bg-white/12",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-slate-950">
      <section className="relative min-h-[92vh] px-4 pb-4 pt-24 sm:px-6 lg:px-8">
        <VisualImage
          src={heroImage}
          alt="Docente acompanando a estudiantes en un aula luminosa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,23,0.94)_0%,rgba(8,13,23,0.82)_48%,rgba(8,13,23,0.36)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,182,164,0.24)_0%,transparent_34%),linear-gradient(18deg,transparent_0%,rgba(239,93,168,0.16)_72%,rgba(248,217,92,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f7f8f3] to-transparent" />
        <div className="absolute left-0 top-28 hidden h-44 w-1 bg-gradient-to-b from-[#18b6a4] via-[#f8d95c] to-[#ef5da8] md:block" />

        <header className="fixed left-4 right-4 top-3 z-50 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/18 bg-slate-950/82 px-4 py-3 text-white shadow-float backdrop-blur-xl sm:left-6 sm:right-6 lg:left-8 lg:right-8">
          <Link href="/" className="flex items-center gap-3" aria-label="EducAI inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none tracking-tight">
                EducAI
              </span>
              <span className="block text-sm leading-5 text-white/82">Agente IA para docentes</span>
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
            <Link href="/planes" className="transition hover:text-white">
              Planes
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="hidden bg-[#ff7a1a] text-white shadow-[0_12px_28px_rgba(255,122,26,0.28)] hover:bg-[#ea6508] sm:inline-flex"
            >
              <Link href="/login?next=/app/agente">Agente IA</Link>
            </Button>
            <Button
              asChild
              size="sm"
              pill
              className="bg-white text-slate-950 shadow-none hover:bg-white/90"
            >
              <Link href="/login?next=/app">
                Empezar <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-176px)] max-w-7xl items-center py-16">
          <div className="max-w-3xl">
            <Badge
              className="border-white/30 bg-[#18b6a4]/22 text-white backdrop-blur-md"
              variant="outline"
            >
              IA educativa para docentes, equipos y escuelas
            </Badge>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              La plataforma que hace que aprender vuelva a sentirse posible.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-xl">
              Planificacion, produccion de materiales, feedback y analitica pedagogica en un solo
              sistema. Hermoso para usar, serio con los datos y pensado para docentes reales.
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
                <Link href="/planes">
                  Ver planes <Sparkles className="h-5 w-5" aria-hidden="true" />
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
                  Ver plataforma
                </Link>
              </Button>
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

      <ImmersiveShowcase />

      <section
        id="plataforma"
        className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8"
      >
        <div className="flex flex-col justify-center">
          <Badge
            variant="outline"
            className="w-fit border-[#18b6a4]/35 bg-[#e7fbf7] text-[#087968]"
          >
            Plataforma viva
          </Badge>
          <h2 className="mt-5 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            No es una landing bonita: es una experiencia de trabajo diario.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            EducAI conecta planificacion, aula y seguimiento. Cada interaccion deja contexto util
            para preparar mejor, evaluar con claridad y reducir carga operativa docente.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-whisper"
              >
                <span className={["block h-1 w-full", feature.accent].join(" ")} />
                <div className="p-5">
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-lg",
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
          <VisualImage
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
                    7A - Matematica
                  </h3>
                </div>
                <Badge className="bg-emerald-400/20 text-emerald-100">En progreso</Badge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["Comprension", "Confianza", "Ritmo"].map((item, index) => (
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
                  Tutor IA
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Converti este objetivo en una actividad de 35 minutos con inicio, practica,
                  cierre, criterios de exito y una pregunta de salida.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#4f3ee2]">
                  <Brain className="h-4 w-4" aria-hidden="true" />
                  Planificacion activa
                </div>
              </div>
              <div className="rounded-lg border border-white/15 bg-[#f8d95c] p-4 text-slate-950 shadow-float">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
                  Alerta util
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">
                  5 recursos listos para revisar antes de la clase.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  La plataforma sugiere consigna, ejemplo, rubrica breve y ticket de salida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ecosistema" className="bg-white py-24">
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
                  <VisualImage
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
        className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
      >
        <div>
          <Badge variant="outline" className="border-[#ef5da8]/35 bg-[#fdeaf4] text-[#b82170]">
            Confianza primero
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            La belleza importa. La seguridad importa mas.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            El diseno no tapa lo esencial: privacidad, trazabilidad, limites pedagogicos y revision
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

      <section className="bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Badge className="border-white/20 bg-[#7c6cff]/20 text-white" variant="outline">
              Pilotos 2026
            </Badge>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Listo para convertirse en un producto que docentes y escuelas quieran abrir todos los
              dias.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/74">
              EducAI combina auth, CI, deploy y observabilidad con una experiencia de trabajo
              diario: aprendizaje posible, datos cuidados y apoyo real para equipos docentes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" pill className="bg-white text-slate-950 hover:bg-white/90">
                <Link href="/planes">
                  Elegir plan <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                pill
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/colegios">
                  Ver para colegios <UsersRound className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <LockKeyhole className="h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
              <p className="font-display text-lg font-semibold">Checklist operativo</p>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "Auth + roles",
                "CI automatizada",
                "Deploy productivo",
                "Rate limiting",
                "Sentry/PostHog",
                "Tests de negocio",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3"
                >
                  <span className="text-sm text-white/80">{item}</span>
                  <span className="h-2 w-16 overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full w-2/3 rounded-full bg-[#f8d95c]" />
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
            <Link href="/terminos" className="hover:text-white">
              Terminos
            </Link>
            <Link href="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
            <Link href="/seguridad" className="hover:text-white">
              Seguridad
            </Link>
            <Link href="/contacto" className="hover:text-white">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
