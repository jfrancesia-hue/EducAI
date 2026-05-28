"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageCircle,
  Route,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";

const scenarios = [
  {
    id: "lesson-design",
    title: "Plan de clase en 35 minutos",
    context:
      "Curso 7A. El docente necesita trabajar proporcionalidad con inicio claro, práctica guiada y cierre evaluable.",
    objective:
      "Crear una secuencia didáctica concreta con tiempos, consignas y criterios de éxito.",
    guardrail:
      "Mantener control docente sobre contenido, tono y nivel de dificultad antes de usarlo.",
    outputs: [
      "Plan de clase con tiempos y objetivos",
      "Consigna lista para proyectar",
      "Práctica con solucionario docente",
      "Ticket de salida para evaluar comprensión",
    ],
  },
  {
    id: "assessment-feedback",
    title: "Feedback y rúbrica rápida",
    context:
      "Grupo 6B. Hay producciones escritas heterogéneas y el docente necesita corregir con criterios consistentes.",
    objective:
      "Generar una rúbrica breve, comentarios modelo y sugerencias de mejora por nivel de desempeño.",
    guardrail:
      "Evitar juicios personales; evaluar evidencias de aprendizaje y dejar espacio para revisión docente.",
    outputs: [
      "Rúbrica de 4 criterios",
      "Comentarios de feedback editables",
      "Ejemplos de mejora por nivel",
      "Resumen para seguimiento semanal",
    ],
  },
  {
    id: "resource-pack",
    title: "Kit de recursos para una unidad",
    context:
      "La escuela prepara una unidad de ciencias y necesita actividades, preguntas disparadoras y evaluación corta.",
    objective:
      "Producir materiales editables para una semana de clases sin perder coherencia curricular.",
    guardrail:
      "No prometer resultados automáticos; cada salida queda como borrador profesional revisable.",
    outputs: [
      "Guía de clase por día",
      "Preguntas para debate",
      "Actividad práctica",
      "Evaluación corta con criterios",
    ],
  },
];

const steps = [
  { label: "Definir", icon: Target, detail: "Objetivo, curso, tiempo y evidencia esperada" },
  { label: "Producir", icon: FileText, detail: "Plan, consignas, recursos y rúbricas" },
  { label: "Ordenar", icon: Route, detail: "Secuencia aplicable para aula real" },
  { label: "Comunicar", icon: MessageCircle, detail: "Resumen docente o institucional" },
  { label: "Evaluar", icon: ClipboardList, detail: "Criterios, feedback y próximo paso" },
];

export function AgentWorkspace() {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  if (!scenario) {
    return null;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="grid content-start gap-4">
        <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                Entrada del agente
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                Necesidad docente
              </h2>
            </div>
            <Badge className="bg-[#f8d95c] text-[#11231f]">Ejemplo de uso</Badge>
          </div>

          <div className="mt-5 grid gap-3">
            {scenarios.map((item) => (
              <button
                key={item.id}
                className={[
                  "rounded-lg border p-4 text-left transition",
                  item.id === scenario.id
                    ? "border-[#11231f] bg-[#eef5f3]"
                    : "border-[#e3ebe7] bg-white hover:border-[#18b6a4]/45",
                ].join(" ")}
                onClick={() => setScenarioId(item.id)}
                type="button"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">{item.context}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d5e1dc] bg-[#11231f] p-5 text-white shadow-whisper">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold tracking-tight">Memoria de trabajo</h2>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-[13px] uppercase tracking-[0.12em] text-white/64">Objetivo</p>
              <p className="mt-2 text-[15px] leading-6 text-white/80">{scenario.objective}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-[13px] uppercase tracking-[0.12em] text-white/64">
                Criterio de uso
              </p>
              <p className="mt-2 text-[15px] leading-6 text-white/80">{scenario.guardrail}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid content-start gap-4">
        <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                Agente IA docente
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
                Producción pedagógica revisable
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                El agente no solo responde: organiza el pedido, produce borradores docentes,
                estructura la clase y deja cada salida lista para editar antes de usar.
              </p>
            </div>
            <Button
              asChild
              className="min-h-12 bg-[#ff7a1a] px-6 font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]"
            >
              <Link href="/login?next=/app/planificar">
                Ingresar para crear clase
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step.label} className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4">
                <div className="flex items-center justify-between gap-2">
                  <step.icon className="h-5 w-5 text-[#087968]" aria-hidden="true" />
                  <span className="font-display text-xl font-bold text-[#7c6cff]">{index + 1}</span>
                </div>
                <p className="mt-4 font-semibold">{step.label}</p>
                <p className="mt-2 text-[14px] leading-5 text-[#4f5f58]">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h3 className="font-display text-2xl font-bold tracking-tight">Entregables</h3>
            </div>
            <div className="mt-5 grid gap-3">
              {scenario.outputs.map((output) => (
                <div
                  key={output}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#eef5f3] p-4"
                >
                  <div className="flex gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                      aria-hidden="true"
                    />
                    <p className="text-[15px] leading-6 text-[#4f5f58]">{output}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#67746d]" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#f8d95c]/40 bg-[#fff8d7] p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <UsersRound className="h-6 w-6 text-[#11231f]" aria-hidden="true" />
              <h3 className="font-display text-2xl font-bold tracking-tight">Control docente</h3>
            </div>
            <p className="mt-4 text-[15px] leading-6 text-[#4f5f58]">
              Cada material sale como borrador editable. El docente decide qué usar, qué cambiar,
              qué descartar y cuándo compartirlo con estudiantes o equipo escolar.
            </p>
            <div className="mt-5 rounded-lg bg-white/75 p-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                Estado
              </p>
              <p className="mt-2 font-semibold text-[#11231f]">Listo para revision docente</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
