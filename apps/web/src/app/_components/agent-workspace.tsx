"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
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
      "Curso 7A. El docente necesita trabajar proporcionalidad con inicio claro, practica guiada y cierre evaluable.",
    topic: "Proporcionalidad directa",
    subject: "Matematica",
    grade: "7A",
    duration: "35 minutos",
    prompt: "Crear una secuencia didactica concreta con tiempos, consignas y criterios de exito.",
    guardrail:
      "Mantener control docente sobre contenido, tono y nivel de dificultad antes de usarlo.",
    outputs: [
      "Plan de clase con tiempos y objetivos",
      "Consigna lista para proyectar",
      "Practica con solucionario docente",
      "Ticket de salida para evaluar comprension",
    ],
  },
  {
    id: "assessment-feedback",
    title: "Feedback y rubrica rapida",
    context:
      "Grupo 6B. Hay producciones escritas heterogeneas y el docente necesita corregir con criterios consistentes.",
    topic: "Produccion escrita",
    subject: "Lengua",
    grade: "6B",
    duration: "30 minutos",
    prompt:
      "Generar una rubrica breve, comentarios modelo y sugerencias de mejora por nivel de desempeno.",
    guardrail:
      "Evitar juicios personales; evaluar evidencias de aprendizaje y dejar espacio para revision docente.",
    outputs: [
      "Rubrica de 4 criterios",
      "Comentarios de feedback editables",
      "Ejemplos de mejora por nivel",
      "Resumen para seguimiento semanal",
    ],
  },
  {
    id: "resource-pack",
    title: "Kit de recursos para una unidad",
    context:
      "La escuela prepara una unidad de ciencias y necesita actividades, preguntas disparadoras y evaluacion corta.",
    topic: "Ecosistemas",
    subject: "Ciencias naturales",
    grade: "5A",
    duration: "1 semana",
    prompt:
      "Producir materiales editables para una semana de clases sin perder coherencia curricular.",
    guardrail:
      "No prometer resultados automaticos; cada salida queda como borrador profesional revisable.",
    outputs: [
      "Guia de clase por dia",
      "Preguntas para debate",
      "Actividad practica",
      "Evaluacion corta con criterios",
    ],
  },
];

const steps = [
  { label: "Definir", icon: Target, detail: "Objetivo, curso, tiempo y evidencia esperada" },
  { label: "Producir", icon: FileText, detail: "Plan, consignas, recursos y rubricas" },
  { label: "Ordenar", icon: Route, detail: "Secuencia aplicable para aula real" },
  { label: "Comunicar", icon: MessageCircle, detail: "Resumen docente o institucional" },
  { label: "Evaluar", icon: ClipboardList, detail: "Criterios, feedback y proximo paso" },
];

type AgentResult = {
  mode: string;
  modelUsed: string;
  tokensUsed: number;
  output: string;
  latencyMs: number;
  createdAt: string;
};

export function AgentWorkspace() {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );
  const [topic, setTopic] = useState(scenario?.topic ?? "");
  const [subject, setSubject] = useState(scenario?.subject ?? "");
  const [grade, setGrade] = useState(scenario?.grade ?? "");
  const [duration, setDuration] = useState(scenario?.duration ?? "");
  const [prompt, setPrompt] = useState(scenario?.prompt ?? "");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!scenario) {
    return null;
  }

  function selectScenario(id: string) {
    const nextScenario = scenarios.find((item) => item.id === id);
    if (!nextScenario) {
      return;
    }
    setScenarioId(id);
    setTopic(nextScenario.topic);
    setSubject(nextScenario.subject);
    setGrade(nextScenario.grade);
    setDuration(nextScenario.duration);
    setPrompt(nextScenario.prompt);
    setResult(null);
    setError(null);
  }

  async function runAgent() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: scenarioId,
          grade,
          subject,
          topic,
          duration,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo ejecutar el agente");
      }

      setResult((await response.json()) as AgentResult);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
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
            <Badge className="bg-[#f8d95c] text-[#11231f]">Produccion</Badge>
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
                onClick={() => selectScenario(item.id)}
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
            <input
              className="h-11 rounded-lg border border-white/12 bg-white/10 px-3 text-white outline-none placeholder:text-white/45"
              onChange={(event) => setGrade(event.target.value)}
              placeholder="Curso"
              value={grade}
            />
            <input
              className="h-11 rounded-lg border border-white/12 bg-white/10 px-3 text-white outline-none placeholder:text-white/45"
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Materia"
              value={subject}
            />
            <input
              className="h-11 rounded-lg border border-white/12 bg-white/10 px-3 text-white outline-none placeholder:text-white/45"
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Tema"
              value={topic}
            />
            <input
              className="h-11 rounded-lg border border-white/12 bg-white/10 px-3 text-white outline-none placeholder:text-white/45"
              onChange={(event) => setDuration(event.target.value)}
              placeholder="Duracion"
              value={duration}
            />
            <textarea
              className="min-h-28 rounded-lg border border-white/12 bg-white/10 px-3 py-3 text-white outline-none placeholder:text-white/45"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Pedido docente"
              value={prompt}
            />
          </div>
          <p className="mt-4 text-[13px] leading-5 text-white/64">{scenario.guardrail}</p>
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
                Produccion pedagogica revisable
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                Ahora el agente se ejecuta desde la UI. En local usa template sin costo; en
                produccion usa Claude si `ANTHROPIC_API_KEY` esta configurada.
              </p>
            </div>
            <Button
              className="min-h-12 bg-[#ff7a1a] px-6 font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]"
              disabled={loading}
              onClick={() => {
                void runAgent();
              }}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
              Ejecutar Agente IA
              <Sparkles className="h-5 w-5" aria-hidden="true" />
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

        {error ? (
          <div className="rounded-lg border border-[#ef5da8]/30 bg-[#fdeaf4] p-4 text-sm font-medium text-[#b82170]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h3 className="font-display text-2xl font-bold tracking-tight">Salida generada</h3>
            </div>
            {result ? (
              <div className="mt-5">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge className="bg-[#e7fbf7] text-[#087968]">{result.mode}</Badge>
                  <Badge variant="outline" className="border-slate-200">
                    {result.modelUsed}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200">
                    {result.tokensUsed} tokens
                  </Badge>
                  <Badge variant="outline" className="border-slate-200">
                    {result.latencyMs} ms
                  </Badge>
                </div>
                <pre className="max-h-[560px] whitespace-pre-wrap rounded-lg bg-[#11231f] p-4 text-[14px] leading-6 text-white">
                  {result.output}
                </pre>
              </div>
            ) : (
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
            )}
          </div>

          <div className="rounded-lg border border-[#f8d95c]/40 bg-[#fff8d7] p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <UsersRound className="h-6 w-6 text-[#11231f]" aria-hidden="true" />
              <h3 className="font-display text-2xl font-bold tracking-tight">Control docente</h3>
            </div>
            <p className="mt-4 text-[15px] leading-6 text-[#4f5f58]">
              Cada material sale como borrador editable. El docente decide que usar, que cambiar,
              que descartar y cuando compartirlo con estudiantes o equipo escolar.
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
