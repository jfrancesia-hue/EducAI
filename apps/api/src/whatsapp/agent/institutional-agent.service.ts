import { Inject, Injectable } from "@nestjs/common";
import type { LlmClient } from "@educai/ai";
import { AppLogger } from "../common/logger/app-logger.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";
import { WHATSAPP_AGENT_LLM } from "./agent-llm.token.js";
import { InstitutionalResponsePolicyService } from "./institutional-response-policy.service.js";
import {
  InstitutionalToolsService,
  type InstitutionalToolResult,
} from "./institutional-tools.service.js";

export interface InstitutionalAgentResponse {
  replyText: string;
  modelUsed: string;
  tokensUsed: number;
  shouldEscalate: boolean;
  toolEvents: Array<{ tool: string; ok: boolean; summary: string }>;
}

const DEFAULT_MODEL = "educai-whatsapp-agent";
const ESCALATION_PATTERN = /\b(humano|asesor|persona|urgente|reclamo|denuncia|problema legal)\b/i;

@Injectable()
export class InstitutionalAgentService {
  constructor(
    private readonly tools: InstitutionalToolsService,
    private readonly responsePolicy: InstitutionalResponsePolicyService,
    @Inject(WHATSAPP_AGENT_LLM) private readonly llm: LlmClient,
    private readonly logger: AppLogger,
  ) {}

  async respond(student: ResolvedStudent, message: string): Promise<InstitutionalAgentResponse> {
    if (ESCALATION_PATTERN.test(message)) {
      return this.responsePolicy.finalize({
        replyText: [
          `Puedo ayudarte con la información registrada de ${student.studentName}, pero este caso conviene derivarlo a una persona del equipo.`,
          "Si querés, respondé con el detalle del problema y lo dejamos listo para seguimiento humano.",
        ].join("\n\n"),
        modelUsed: "policy-escalation",
        tokensUsed: 0,
        shouldEscalate: true,
        toolEvents: [
          { tool: "human_handoff", ok: true, summary: "Se activó derivación a humano." },
        ],
      });
    }

    const toolResults = await this.tools.collectForMessage(student, message);
    const completion = await this.llm.generate({
      model: process.env.EDUCAI_AGENT_MODEL ?? DEFAULT_MODEL,
      temperature: 0.2,
      maxTokens: 450,
      messages: [
        {
          role: "user",
          content: this.buildUserPrompt(student, message, toolResults),
        },
      ],
      system: this.buildSystemPrompt(),
    });

    this.logger.info(
      {
        studentId: student.studentId,
        modelUsed: completion.modelUsed,
        tokensUsed: completion.tokensUsed,
        tools: toolResults.map((tool) => tool.tool),
      },
      "institutional_agent.responded",
    );

    return this.responsePolicy.finalize({
      replyText: completion.content.trim(),
      modelUsed: completion.modelUsed,
      tokensUsed: completion.tokensUsed,
      shouldEscalate: false,
      toolEvents: toolResults.map((tool) => ({ tool: tool.tool, ok: true, summary: tool.summary })),
    });
  }

  private buildSystemPrompt(): string {
    return [
      "Sos el asistente institucional de EducAI por WhatsApp.",
      "Respondé en español rioplatense, de forma clara, breve y profesional.",
      "Solo podés responder con la información del contexto y de las tools entregadas.",
      "No inventes pagos, fechas, docentes, horarios ni estados administrativos.",
      "Si falta un dato, decilo explícitamente y ofrecé derivación humana.",
      "No hagas promesas de gestión humana no confirmadas.",
      "Mantené respuestas de menos de 6 líneas salvo que el usuario pida detalle.",
    ].join("\n");
  }

  private buildUserPrompt(
    student: ResolvedStudent,
    message: string,
    toolResults: InstitutionalToolResult[],
  ): string {
    return [
      `Consulta recibida: ${message}`,
      "",
      "Contexto base:",
      JSON.stringify(
        {
          tenantId: student.tenantId,
          studentName: student.studentName,
          familyId: student.familyId,
          grade: student.grade,
        },
        null,
        2,
      ),
      "",
      "Resultados de tools:",
      JSON.stringify(toolResults, null, 2),
      "",
      "Redactá una respuesta lista para WhatsApp. Si la información no alcanza, indicá qué falta y sugerí derivación humana.",
    ].join("\n");
  }
}
