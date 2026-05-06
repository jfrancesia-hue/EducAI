import Link from "next/link";
import {
  BarChart3,
  Brain,
  CheckCircle2,
  Download,
  LineChart,
  PieChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { getServerSession, isAdminSession } from "../../../lib/server-session";

const reportCards = [
  {
    label: "Comprension promedio",
    value: "82%",
    note: "+9 pts en 14 dias",
    icon: Brain,
    color: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    label: "Clases producidas",
    value: "18",
    note: "6 listas para revisar",
    icon: BarChart3,
    color: "bg-[#fff8d7] text-[#876100]",
  },
  {
    label: "Tickets corregidos",
    value: "124",
    note: "31 esta semana",
    icon: CheckCircle2,
    color: "bg-[#efedff] text-[#4f3ee2]",
  },
];

const insights = [
  "7A mejora cuando la clase incluye ejemplo modelado antes de practica autonoma.",
  "6B necesita consignas mas breves y cierre con pregunta unica.",
  "Los tickets de salida muestran avance sostenido en proporcionalidad.",
];

const rows = [
  ["Matematica 7A", "82%", "Alto", "Revisar rubrica"],
  ["Lengua 6B", "76%", "Medio", "Generar practica"],
  ["Ciencias 5C", "88%", "Alto", "Compartir reporte"],
];

export default async function ReportsModulePage() {
  const showAdmin = isAdminSession(await getServerSession());

  return (
    <AppShell title="Modulo de reportes" showAdmin={showAdmin}>
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_0.82fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge className="bg-[#efedff] text-[#4f3ee2]">Analitica pedagogica</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Lectura de aula y decisiones
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                  Reportes para ver progreso, recursos generados, tickets corregidos y proximo paso
                  sugerido.
                </p>
              </div>
              <Button className="bg-[#11231f] text-white hover:bg-[#1b342e]">
                <Download className="h-4 w-4" aria-hidden="true" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {reportCards.map((card) => (
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
              <LineChart className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Vista por curso</h2>
            </div>
            <div className="mt-5 overflow-hidden rounded-lg border border-[#e3ebe7]">
              {rows.map(([course, score, confidence, action]) => (
                <div
                  key={course}
                  className="grid gap-2 border-b border-[#e3ebe7] bg-white p-4 last:border-b-0 md:grid-cols-[1fr_auto_auto_1fr] md:items-center"
                >
                  <p className="font-semibold">{course}</p>
                  <p className="font-display text-2xl font-bold">{score}</p>
                  <Badge className="w-fit bg-[#eef5f3] text-[#33423c]">{confidence}</Badge>
                  <p className="text-[15px] text-[#4f5f58] md:text-right">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Insights del agente
              </h2>
            </div>
            <div className="mt-5 grid gap-3">
              {insights.map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-4">
                  <p className="text-[15px] leading-6 text-white/80">{item}</p>
                </div>
              ))}
            </div>
            <Button
              asChild
              className="mt-5 min-h-12 w-full bg-[#ff7a1a] font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] hover:bg-[#ea6508]"
            >
              <Link href="/app/agente">
                Pedir analisis al agente
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <PieChart className="h-6 w-6 text-[#4f3ee2]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Proximo reporte</h2>
            </div>
            <p className="mt-3 text-[15px] leading-6 text-[#4f5f58]">
              Resumen semanal para equipo docente con progreso, recursos usados y decisiones
              sugeridas.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
