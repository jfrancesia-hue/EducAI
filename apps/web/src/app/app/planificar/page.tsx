import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";

const blocks = [
  {
    title: "Objetivo de aprendizaje",
    text: "Definir que deberian poder hacer los estudiantes al final de la clase.",
    icon: Target,
    color: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    title: "Secuencia didactica",
    text: "Ordenar inicio, modelado, practica, cierre y evidencia de comprension.",
    icon: CalendarDays,
    color: "bg-[#efedff] text-[#4f3ee2]",
  },
  {
    title: "Materiales y consignas",
    text: "Generar consigna, ejemplo, practica y rubrica breve para revisar.",
    icon: FileText,
    color: "bg-[#fff8d7] text-[#876100]",
  },
];

const drafts = [
  ["Matematica 7A", "Proporcionalidad directa", "35 min", "Listo para revisar"],
  ["Lengua 6B", "Texto expositivo", "45 min", "Borrador generado"],
  ["Ciencias 5C", "Ecosistemas", "40 min", "Falta objetivo"],
];

export default function PlanningModulePage() {
  return (
    <AppShell title="Modulo de planificacion">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_0.8fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#163f36]/20 bg-[#11231f] p-6 text-white shadow-float">
            <Badge className="bg-[#ff7a1a] text-white">Planificar con agente</Badge>
            <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Converti un tema en una clase lista para editar.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/78">
              Carga curso, tema, duracion y objetivo. EducAI arma una secuencia clara con
              materiales, criterios de evaluacion y proximo paso docente.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              >
                <Link href="/app/protocolo">Ver flujo docente</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {blocks.map((block) => (
              <article
                key={block.title}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    block.color,
                  ].join(" ")}
                >
                  <block.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                  {block.title}
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{block.text}</p>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Borradores recientes
              </h2>
            </div>
            <div className="mt-5 grid gap-3">
              {drafts.map(([course, topic, time, status]) => (
                <div
                  key={`${course}-${topic}`}
                  className="grid gap-3 rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
                >
                  <p className="font-semibold">{course}</p>
                  <p className="text-[15px] text-[#4f5f58]">{topic}</p>
                  <span className="flex items-center gap-2 text-[15px] text-[#5b6962]">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {time}
                  </span>
                  <Badge className="w-fit bg-[#eef5f3] text-[#33423c]">{status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#f8d95c]/40 bg-[#fff8d7] p-5 shadow-whisper">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Que necesita este modulo
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Curso y duracion",
                "Tema o contenido",
                "Objetivo esperado",
                "Tipo de evidencia",
                "Nivel de profundidad",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg bg-white/75 p-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                    aria-hidden="true"
                  />
                  <p className="text-[15px] leading-6 text-[#4f5f58]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
