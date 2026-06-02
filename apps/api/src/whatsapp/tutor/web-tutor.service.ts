import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { getApoyoAIModelForPlan, TutorAgent, type LlmClient } from "@educai/ai";
import { WHATSAPP_AGENT_LLM } from "../agent/agent-llm.token.js";
import { CrisisAlertService } from "../agent/crisis-alert.service.js";
import { HumanHandoffService } from "../agent/human-handoff.service.js";
import { RateLimitExceededError } from "../webhooks/errors/webhook.errors.js";
import { ConversationStoreService } from "./conversation-store.service.js";
import { RateLimiterService } from "./rate-limiter.service.js";
import { StudentResolverService } from "./student-resolver.service.js";

const ACCEPTED_STATUSES = new Set(["ACTIVE", "IN_GRACE_PERIOD"]);

export type WebTutorResponse = {
  data: {
    reply: string;
    conversationId: string;
    studentId: string;
    modelUsed: string;
    tokensUsed: number;
    safetyStatus: string;
    channel: "web";
  };
};

@Injectable()
export class WebTutorService {
  constructor(
    private readonly resolver: StudentResolverService,
    private readonly conversation: ConversationStoreService,
    private readonly humanHandoff: HumanHandoffService,
    private readonly crisisAlert: CrisisAlertService,
    private readonly rateLimiter: RateLimiterService,
    @Inject(WHATSAPP_AGENT_LLM) private readonly llm: LlmClient,
  ) {}

  async ask(input: {
    studentId: string;
    tenantId: string;
    familyId: string;
    message: string;
    subject?: string;
  }): Promise<WebTutorResponse> {
    const student = await this.resolver.resolveByStudentForFamily({
      studentId: input.studentId,
      tenantId: input.tenantId,
      familyId: input.familyId,
    });

    if (!ACCEPTED_STATUSES.has(student.subscription.status)) {
      return {
        data: {
          reply:
            "La suscripción familiar todavía no está activa. Cuando el pago quede confirmado, ApoyoAI va a responder desde este panel.",
          conversationId: "",
          studentId: student.studentId,
          modelUsed: "subscription-policy",
          tokensUsed: 0,
          safetyStatus: "blocked",
          channel: "web",
        },
      };
    }

    try {
      await this.rateLimiter.assertCanUseApp(student);
    } catch (error) {
      if (!(error instanceof RateLimitExceededError)) {
        throw error;
      }

      return {
        data: {
          reply:
            "Llegaste al límite de consultas por app de tu plan. Si necesitás más uso, podés subir de plan.",
          conversationId: "",
          studentId: student.studentId,
          modelUsed: "app-usage-policy",
          tokensUsed: 0,
          safetyStatus: "blocked",
          channel: "web",
        },
      };
    }

    const subject = input.subject?.trim() || this.inferSubject(input.message);
    const tutor = new TutorAgent(this.llm, {
      model: getApoyoAIModelForPlan(student.subscription.planCode ?? student.subscription.plan),
    });
    const response = await tutor.respond({
      studentName: student.studentName,
      grade: student.grade,
      subject,
      message: input.message,
      learningStyle: student.learningStyle ?? undefined,
    });

    const stored = await this.conversation.appendInboundMessage({
      student,
      subject,
      body: input.message,
      twilioMessageSid: `web:${randomUUID()}`,
      safetyStatus: response.safety.status,
      channel: "web",
    });

    await this.conversation.appendOutboundMessage({
      conversationId: stored.conversationId,
      tenantId: student.tenantId,
      body: response.content,
      modelUsed: response.modelUsed,
      tokensUsed: response.tokensUsed,
      safetyStatus: response.safety.status,
    });

    if (response.safety.status === "escalate") {
      const crisis = response.safety.crisisAlert;

      // Alerta en tiempo real al EQUIPO de crisis (nunca a la familia). Best-effort:
      // si falla, el alumno ya recibió contención y el handoff queda registrado.
      let alertResult: Awaited<ReturnType<CrisisAlertService["notifyCrisis"]>> | undefined;
      try {
        alertResult = await this.crisisAlert.notifyCrisis({
          student,
          conversationId: stored.conversationId,
          severity: crisis?.severity ?? "high",
          signals: response.safety.signals,
          inboundMessage: input.message,
          helplines: crisis?.helplines ?? [],
        });
      } catch {
        // Se registra igual en el handoff de abajo.
      }

      await this.humanHandoff.create({
        student,
        conversationId: stored.conversationId,
        source: "academic",
        reason: response.recommendedAction ?? "safety_escalation",
        inboundMessage: input.message,
        outboundMessage: response.content,
        metadata: {
          safetyStatus: response.safety.status,
          safetySignals: response.safety.signals,
          crisisSeverity: crisis?.severity,
          crisisAlertDelivered: alertResult?.delivered ?? false,
          crisisAlertRecipient: alertResult?.recipientMasked,
          channel: "web",
        },
      });
    }

    return {
      data: {
        reply: response.content,
        conversationId: stored.conversationId,
        studentId: student.studentId,
        modelUsed: response.modelUsed,
        tokensUsed: response.tokensUsed,
        safetyStatus: response.safety.status,
        channel: "web",
      },
    };
  }

  private inferSubject(message: string): string {
    const lower = message.toLowerCase();
    if (/\b(matematica|fracci|geometr|algebra|sumar|restar|multipl|divid|ecuaci)/i.test(lower)) {
      return "matematica";
    }
    if (/\b(lengua|cuento|texto|verbo|sujeto|predicado|literatura|poesia)/i.test(lower)) {
      return "lengua";
    }
    if (/\b(ciencia|biolog|fisica|quimica|celula|atomo|fotosintesis|fuerza)/i.test(lower)) {
      return "ciencias naturales";
    }
    return "general";
  }
}
