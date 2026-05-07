import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "../../../../lib/server-session";

type AgentRunRequest = {
  mode?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  duration?: string;
  prompt?: string;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { code: "AGENT_SESSION_REQUIRED", message: "Sesion requerida" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as AgentRunRequest;
  const input = normalizeInput(body);

  if (!input.topic && !input.prompt) {
    return NextResponse.json(
      { code: "AGENT_INPUT_REQUIRED", message: "Falta tema o pedido docente" },
      { status: 400 },
    );
  }

  const startedAt = Date.now();
  const generated = process.env.ANTHROPIC_API_KEY
    ? await runClaude(input)
    : buildLocalAgentOutput(input);

  return NextResponse.json({
    ...generated,
    latencyMs: Date.now() - startedAt,
    createdAt: new Date().toISOString(),
  });
}

function normalizeInput(body: AgentRunRequest) {
  return {
    mode: body.mode?.trim() || "planificacion",
    grade: body.grade?.trim() || "7A",
    subject: body.subject?.trim() || "Matematica",
    topic: body.topic?.trim() || "",
    duration: body.duration?.trim() || "40 minutos",
    prompt: body.prompt?.trim() || "",
  };
}

async function runClaude(input: ReturnType<typeof normalizeInput>) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 1400,
      temperature: 0.2,
      system:
        "Sos el agente docente general de EducAI. Ayudas a docentes de aula, equipos pedagogicos y escuelas a planificar clases, producir recursos, ajustar actividades para distintos ritmos, evaluar y dar feedback. No sos un agente solo para educacion especial: trabajas para todos los estudiantes con apoyos universales y sin etiquetar personas. No reemplazas al docente. No inventes datos. Devolve texto estructurado, breve, seguro y revisable.",
      messages: [
        {
          role: "user",
          content: `Modo: ${input.mode}
Curso: ${input.grade}
Materia: ${input.subject}
Tema: ${input.topic}
Duracion: ${input.duration}
Pedido docente: ${input.prompt}

Entrega: objetivo, secuencia por momentos, recursos, ajustes universales, rubrica breve, feedback modelo y ticket de salida.`,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return buildLocalAgentOutput(input, "fallback_error_modelo");
  }

  const payload = (await response.json()) as {
    model?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
    content?: Array<{ type: string; text?: string }>;
  };
  const content = payload.content?.find((block) => block.type === "text")?.text;

  return {
    mode: "live",
    modelUsed: payload.model ?? "claude",
    tokensUsed: (payload.usage?.input_tokens ?? 0) + (payload.usage?.output_tokens ?? 0),
    output: content ?? buildLocalAgentOutput(input).output,
  };
}

function buildLocalAgentOutput(
  input: ReturnType<typeof normalizeInput>,
  mode: "review" | "fallback_error_modelo" = "review",
) {
  const topic = input.topic || "el tema indicado";
  const prompt = input.prompt ? `\n\nPedido docente: ${input.prompt}` : "";

  return {
    mode,
    modelUsed: "local-template",
    tokensUsed: 0,
    output: `Objetivo docente
Trabajar ${topic} en ${input.grade} (${input.subject}) durante ${input.duration}, con una produccion clara y evidencia de comprension.${prompt}

Secuencia sugerida
1. Inicio (5-8 min): recuperar saberes previos con una pregunta breve y visible.
2. Modelado (10 min): resolver un ejemplo junto al grupo, explicitando decisiones.
3. Practica guiada (15-20 min): proponer dos consignas graduadas y circular para detectar trabas.
4. Cierre (5 min): pedir una explicacion corta del procedimiento usado.

Recursos
- Pizarron o proyector.
- Consigna editable.
- Dos ejercicios graduados.
- Ticket de salida.

Ajustes universales
- Apoyo inicial: dar pasos incompletos para completar.
- Trabajo autonomo: resolver con una variable nueva.
- Desafio extra: crear un ejemplo propio y justificarlo.
- Accesibilidad pedagogica: ofrecer consigna oral y escrita, ejemplo visible y tiempo de revision.

Rubrica breve
- Identifica el concepto.
- Explica el procedimiento.
- Aplica en una situacion nueva.
- Comunica con claridad.

Feedback modelo
- Lograste identificar el procedimiento principal. Revisa el paso donde justificas tu decision.
- Si te trabaste, volve al ejemplo guiado y marca que dato usaste primero.

Ticket de salida
Escribi en dos frases que hiciste primero, que hiciste despues y que duda te queda.

Estado
Borrador listo para revision docente antes de compartir.`,
  };
}
