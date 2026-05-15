import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MessageCircle,
  Route,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";

const workflow = [
  {
    code: "D",
    name: "Definir",
    title: "Objetivo, curso y tiempo real",
    detail:
      "El docente indica tema, grado, duracion de la clase, conocimientos previos y evidencia esperada. EducAI ordena el pedido sin pedir datos personales.",
    icon: Target,
  },
  {
    code: "P",
    name: "Producir",
    title: "Clase, consignas y recursos",
    detail:
      "El agente genera plan de clase, actividad central, ejemplo resuelto, variantes de practica y material listo para editar.",
    icon: FileText,
  },
  {
    code: "O",
    name: "Ordenar",
    title: "Secuencia aplicable",
    detail:
      "La propuesta se organiza por momentos: inicio, modelado, practica, cierre y proximo paso docente.",
    icon: Route,
  },
  {
    code: "C",
    name: "Comunicar",
    title: "Resumen claro para compartir",
    detail:
      "EducAI prepara mensajes, instrucciones o resumenes para estudiantes, equipo directivo o comunicacion institucional.",
    icon: MessageCircle,
  },
  {
    code: "E",
    name: "Evaluar",
    title: "Rubrica y evidencia",
    detail:
      "Se proponen criterios de evaluacion, ticket de salida, feedback modelo y seguimiento para la siguiente clase.",
    icon: ClipboardCheck,
  },
];

const outputs = [
  "Plan de clase con tiempos, objetivos y actividades",
  "Consigna lista para proyectar o imprimir",
  "Rubrica breve con criterios de correccion",
  "Solucionario docente y errores frecuentes",
  "Ticket de salida y seguimiento semanal",
];

const comparison = [
  [
    "Planificacion manual",
    "Mucho tiempo copiando, ordenando recursos y ajustando consignas desde cero.",
  ],
  [
    "EducAI Docente",
    "Flujo completo: objetivo, clase, recursos, rubrica, feedback y seguimiento en un mismo lugar.",
  ],
];

export default function ProtocolPage() {
  return (
    <main className="min-h-screen bg-[#eef5f3] p-3 text-[15px] text-[#14120f] [text-rendering:optimizeLegibility] sm:p-5">
      <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-lg border border-[#d5e1dc] bg-[#f8fbf7] shadow-float">
        <header className="flex flex-col gap-4 border-b border-[#d5e1dc] bg-white/75 px-5 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#11231f] text-white"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                Motor de produccion docente
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Flujo EducAI Docente
              </h1>
            </div>
          </div>
          <Button asChild className="bg-[#11231f] text-white hover:bg-[#1b342e]">
            <Link href="/app/planificar">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Generar clase
            </Link>
          </Button>
        </header>

        <section className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-6 text-white shadow-whisper">
            <Badge className="bg-[#f8d95c] text-[#11231f]">Para docentes de cualquier area</Badge>
            <h2 className="mt-6 max-w-2xl font-display text-5xl font-bold leading-tight tracking-tight">
              De una idea suelta a una clase lista para revisar.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
              EducAI transforma objetivos, contenidos y tiempos reales en recursos concretos: plan
              de clase, consignas, ejemplos, rubricas, feedback y seguimiento.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["5", "momentos de trabajo"],
                ["6", "salidas editables"],
                ["15 min", "primer borrador docente"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/12 bg-white/8 p-4">
                  <p className="font-display text-3xl font-bold">{value}</p>
                  <p className="mt-1 text-sm leading-5 text-white/68">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {workflow.map((step) => (
              <article
                key={`${step.code}-${step.name}`}
                className="grid gap-4 rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper md:grid-cols-[76px_1fr]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#f8d95c] font-display text-3xl font-bold text-[#11231f]">
                  {step.code}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <step.icon className="h-5 w-5 text-[#087968]" aria-hidden="true" />
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                      {step.name}
                    </p>
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{step.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 px-5 pb-7 sm:px-7 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-6 shadow-whisper">
            <div className="flex items-center gap-3">
              <BookMarked className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Salidas del flujo</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {outputs.map((output) => (
                <div key={output} className="flex gap-3 rounded-lg bg-[#eef5f3] p-4">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                    aria-hidden="true"
                  />
                  <p className="text-[15px] leading-6 text-[#4f5f58]">{output}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#f8d95c]/40 bg-[#fff8d7] p-6 shadow-whisper">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-[#11231f]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Que mejora EducAI</h2>
            </div>
            <div className="mt-5 space-y-3">
              {comparison.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/75 p-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                    {label}
                  </p>
                  <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#d5e1dc] bg-[#11231f] px-5 py-6 text-white sm:px-7">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <Target className="mt-1 h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
              <p className="text-sm leading-6 text-white/76">
                El docente define objetivo, nivel, tiempo y criterio de logro.
              </p>
            </div>
            <div className="flex gap-3">
              <UsersRound className="mt-1 h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
              <p className="text-sm leading-6 text-white/76">
                Cada salida queda como borrador editable antes de usar o compartir.
              </p>
            </div>
            <div className="flex gap-3">
              <GraduationCap className="mt-1 h-5 w-5 text-[#f8d95c]" aria-hidden="true" />
              <p className="text-sm leading-6 text-white/76">
                El objetivo es menos carga operativa y mas calidad pedagogica.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
