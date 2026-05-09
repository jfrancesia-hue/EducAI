import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AnthropicLlmClient, DeterministicLlmClient, type LlmClient } from "@educai/ai";
import type { Logger } from "pino";
import { AppLogger } from "../common/logger/app-logger.service.js";
import type { AuthenticatedUser } from "../auth/types.js";
import type { RunAgentDto } from "./dto/run-agent.dto.js";

const SYSTEM_PROMPT =
  "Sos el agente docente general de EducAI. Ayudas a docentes de aula, equipos pedagogicos y escuelas a planificar clases, producir recursos, ajustar actividades para distintos ritmos, evaluar y dar feedback. No sos un agente solo para educacion especial: trabajas para todos los estudiantes con apoyos universales y sin etiquetar personas. No reemplazas al docente. No inventes datos. Devolve texto estructurado, breve, seguro y revisable.";

const DEFAULT_MODE = "planificacion";
const DEFAULT_GRADE = "7A";
const DEFAULT_SUBJECT = "Matematica";
const DEFAULT_DURATION = "40 minutos";
const FALLBACK_MAX_TOKENS = 1400;
const FALLBACK_TEMPERATURE = 0.2;

export interface NormalizedAgentInput {
  mode: string;
  grade: string;
  subject: string;
  topic: string;
  duration: string;
  prompt: string;
}

export interface AgentRunResult {
  mode: "live" | "review" | "fallback_error_modelo";
  modelUsed: string;
  tokensUsed: number;
  output: string;
  latencyMs: number;
  createdAt: string;
}

export const AGENT_LLM_CLIENT = "AGENT_LLM_CLIENT";

@Injectable()
export class AgentService {
  private readonly log: Logger;

  constructor(
    private readonly config: ConfigService,
    logger: AppLogger,
    @Optional() @Inject(AGENT_LLM_CLIENT) private readonly llm?: LlmClient,
  ) {
    this.log = logger.child({ component: "AgentService" });
  }

  async run(dto: RunAgentDto, actor: AuthenticatedUser): Promise<AgentRunResult> {
    const input = this.normalize(dto);
    const startedAt = Date.now();

    if (!input.topic && !input.prompt) {
      const empty = this.buildLocalOutput(input, "review");
      return this.finalize(empty, startedAt);
    }

    const client = this.resolveLlm();
    if (!client) {
      const offline = this.buildLocalOutput(input, "review");
      this.log.info(
        { tenantId: actor.tenantId, actor: actor.sub, reason: "no_llm_configured" },
        "agent.run.offline",
      );
      return this.finalize(offline, startedAt);
    }

    try {
      const response = await client.generate({
        model: this.config.get<string>("ANTHROPIC_MODEL") ?? "claude-opus-4-7",
        maxTokens: FALLBACK_MAX_TOKENS,
        temperature: FALLBACK_TEMPERATURE,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: this.buildUserPrompt(input),
          },
        ],
      });

      this.log.info(
        {
          tenantId: actor.tenantId,
          actor: actor.sub,
          mode: input.mode,
          tokensUsed: response.tokensUsed,
          modelUsed: response.modelUsed,
        },
        "agent.run.live",
      );

      return this.finalize(
        {
          mode: "live",
          modelUsed: response.modelUsed,
          tokensUsed: response.tokensUsed,
          output: response.content?.trim() || this.buildLocalOutput(input, "review").output,
        },
        startedAt,
      );
    } catch (error) {
      this.log.error(
        {
          tenantId: actor.tenantId,
          actor: actor.sub,
          err: error instanceof Error ? error.message : String(error),
        },
        "agent.run.error",
      );
      return this.finalize(this.buildLocalOutput(input, "fallback_error_modelo"), startedAt);
    }
  }

  private normalize(dto: RunAgentDto): NormalizedAgentInput {
    return {
      mode: dto.mode?.trim() || DEFAULT_MODE,
      grade: dto.grade?.trim() || DEFAULT_GRADE,
      subject: dto.subject?.trim() || DEFAULT_SUBJECT,
      topic: dto.topic?.trim() || "",
      duration: dto.duration?.trim() || DEFAULT_DURATION,
      prompt: dto.prompt?.trim() || "",
    };
  }

  private buildUserPrompt(input: NormalizedAgentInput): string {
    return [
      `Modo: ${input.mode}`,
      `Curso: ${input.grade}`,
      `Materia: ${input.subject}`,
      `Tema: ${input.topic}`,
      `Duracion: ${input.duration}`,
      `Pedido docente: ${input.prompt}`,
      "",
      "Entrega: objetivo, secuencia por momentos, recursos, ajustes universales, rubrica breve, feedback modelo y ticket de salida.",
    ].join("\n");
  }

  private resolveLlm(): LlmClient | undefined {
    if (this.llm) {
      return this.llm;
    }
    const apiKey = this.config.get<string>("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return undefined;
    }
    return new AnthropicLlmClient({ apiKey });
  }

  private buildLocalOutput(
    input: NormalizedAgentInput,
    mode: "review" | "fallback_error_modelo",
  ): Omit<AgentRunResult, "latencyMs" | "createdAt"> {
    const topic = input.topic || "el tema indicado";
    const promptLine = input.prompt ? `\n\nPedido docente: ${input.prompt}` : "";

    const output = `Objetivo docente
Trabajar ${topic} en ${input.grade} (${input.subject}) durante ${input.duration}, con una produccion clara y evidencia de comprension.${promptLine}

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
Borrador listo para revision docente antes de compartir.`;

    return {
      mode,
      modelUsed: "local-template",
      tokensUsed: 0,
      output,
    };
  }

  private finalize(
    partial: Omit<AgentRunResult, "latencyMs" | "createdAt">,
    startedAt: number,
  ): AgentRunResult {
    return {
      ...partial,
      latencyMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };
  }
}

// Helper para tests: provee un cliente determinista que no requiere ANTHROPIC_API_KEY.
export function deterministicAgentLlmFactory(): LlmClient {
  return new DeterministicLlmClient();
}
