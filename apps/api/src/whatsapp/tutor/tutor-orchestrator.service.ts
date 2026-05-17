import { Inject, Injectable } from "@nestjs/common";
import {
  AudioService,
  getApoyoAIModelForPlan,
  type LlmClient,
  OcrService,
  TutorAgent,
  type TutorAgentResponse,
} from "@educai/ai";
import type { Logger } from "pino";
import { WHATSAPP_AGENT_LLM } from "../agent/agent-llm.token.js";
import { HumanHandoffService } from "../agent/human-handoff.service.js";
import { InstitutionalAgentService } from "../agent/institutional-agent.service.js";
import { InstitutionalIntentService } from "../agent/institutional-intent.service.js";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { CommandHandlerService, type SlashCommand } from "./command-handler.service.js";
import { ConversationStoreService } from "./conversation-store.service.js";
import { DiagnosticHandlerService } from "./diagnostic-handler.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { RateLimiterService } from "./rate-limiter.service.js";
import { StudentResolverService, type ResolvedStudent } from "./student-resolver.service.js";
import { TwilioSenderService } from "./twilio-sender.service.js";
import {
  RateLimitExceededError,
  StudentNotEnrolledError,
  StudentSelectionRequiredError,
  SubscriptionInactiveError,
} from "../webhooks/errors/webhook.errors.js";

export interface InboundMessage {
  messageSid: string;
  fromWhatsappPhone: string;
  toWhatsappPhone: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface OrchestratorOutcome {
  status:
    | "answered"
    | "rate_limited"
    | "not_enrolled"
    | "selection_required"
    | "subscription_inactive"
    | "error"
    | "diagnostic";
  conversationId?: string;
  outboundSid?: string;
  bypassedLlm?: boolean;
  safetyStatus?: string;
  reply?: string;
  diagnosticAction?: string;
  channel?: "academic" | "institutional";
}

const DEFAULT_SUBJECT = "general";

/**
 * Orquesta el flujo completo de un mensaje WhatsApp entrante:
 *
 *   1. Identifica al alumno por whatsappPhone
 *   2. Verifica suscripción activa + rate limit por plan
 *   3. Si es comando slash → respuesta determinística
 *   4. Si trae imagen → OCR (Claude Vision)
 *   5. Si trae audio → Whisper
 *   6. Llama al TutorAgent con system prompt cacheado
 *   7. Persiste Conversation + Message inbound y outbound
 *   8. Envía la respuesta vía Twilio Messages API
 *
 * Cualquier error de orquestación se loggea y se manda un mensaje genérico
 * al alumno para que no se quede sin respuesta.
 */
@Injectable()
export class TutorOrchestratorService {
  private readonly log: Logger;

  constructor(
    private readonly resolver: StudentResolverService,
    private readonly rateLimiter: RateLimiterService,
    private readonly commands: CommandHandlerService,
    private readonly conversation: ConversationStoreService,
    private readonly sender: TwilioSenderService,
    private readonly ocr: OcrService,
    private readonly audio: AudioService,
    @Inject(WHATSAPP_AGENT_LLM) private readonly llm: LlmClient,
    private readonly diagnosticHandler: DiagnosticHandlerService,
    private readonly prisma: PrismaService,
    private readonly institutionalIntent: InstitutionalIntentService,
    private readonly institutionalAgent: InstitutionalAgentService,
    private readonly humanHandoff: HumanHandoffService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "TutorOrchestrator" });
  }

  async enqueueInboundMessage(message: InboundMessage): Promise<OrchestratorOutcome> {
    try {
      return await this.handle(message);
    } catch (error) {
      const known = await this.handleKnownOperationalError(error, message);
      if (known) {
        return known;
      }

      this.log.error(
        {
          err: error instanceof Error ? error.message : String(error),
          messageSid: message.messageSid,
        },
        "orchestrator.error",
      );

      await this.safeSendFallback(
        message.fromWhatsappPhone,
        "Tuve un problema técnico recibiendo tu mensaje. ¿Lo intentás de nuevo en un minuto?",
      );

      return { status: "error" };
    }
  }

  private async handle(message: InboundMessage): Promise<OrchestratorOutcome> {
    const student = await this.resolver.resolveByWhatsapp(message.fromWhatsappPhone, message.body);
    await this.rateLimiter.assertCanReceive(student);

    const inboundBody = await this.materializeBody(message);
    const subject = this.inferSubject(inboundBody);

    // Comandos de control siempre tienen prioridad (incluso /pausar durante diagnóstico)
    const command = this.commands.detect(inboundBody);
    if (command && command !== "empezar") {
      return this.handleCommand(student, message, inboundBody, subject, command);
    }

    // /empezar arranca o retoma diagnóstico explícitamente
    if (command === "empezar") {
      return this.handleDiagnosticStart(student, message, inboundBody);
    }

    // Si tiene diagnóstico activo en curso, todas las respuestas van al handler
    const inDiagnostic = await this.isInDiagnostic(student);
    if (inDiagnostic) {
      return this.handleDiagnosticAnswer(student, message, inboundBody);
    }

    const intent = this.institutionalIntent.detect(inboundBody);
    if (intent.channel === "institutional") {
      return this.handleInstitutionalConversation(student, message, inboundBody);
    }

    return this.handleConversation(student, message, inboundBody, subject);
  }

  private async isInDiagnostic(student: ResolvedStudent): Promise<boolean> {
    if (student.diagnosticCompleted) {
      return false;
    }
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: student.studentProfileId },
      select: { diagnosticState: true },
    });
    return this.diagnosticHandler.isInProgress(profile?.diagnosticState ?? null);
  }

  private async handleDiagnosticStart(
    student: ResolvedStudent,
    message: InboundMessage,
    inboundBody: string,
  ): Promise<OrchestratorOutcome> {
    const action = await this.diagnosticHandler.startOrResume(student);

    if (action.kind === "already_completed") {
      const reply = this.diagnosticHandler.formatAlreadyCompletedMessage(student.studentName);
      return this.persistAndSend(
        student,
        message,
        inboundBody,
        "diagnostic",
        reply,
        "already_completed",
      );
    }

    if (action.kind === "completed") {
      const reply = this.diagnosticHandler.formatCompletedMessage(
        student.studentName,
        action.report,
      );
      return this.persistAndSend(student, message, inboundBody, "diagnostic", reply, "completed");
    }

    if (action.kind === "start_or_resume") {
      const reply = this.diagnosticHandler.formatStartMessage(
        student.studentName,
        action.question,
        action.resumed,
      );
      return this.persistAndSend(
        student,
        message,
        inboundBody,
        "diagnostic",
        reply,
        action.resumed ? "resumed" : "started",
      );
    }

    // No debería ocurrir desde startOrResume, pero TypeScript exige exhaustividad
    throw new Error(`Unexpected diagnostic action kind from startOrResume: ${action.kind}`);
  }

  private async handleDiagnosticAnswer(
    student: ResolvedStudent,
    message: InboundMessage,
    inboundBody: string,
  ): Promise<OrchestratorOutcome> {
    const action = await this.diagnosticHandler.handleAnswer(student, inboundBody);
    let reply: string;
    let diagnosticAction: string;

    switch (action.kind) {
      case "completed":
        reply = this.diagnosticHandler.formatCompletedMessage(student.studentName, action.report);
        diagnosticAction = "completed";
        break;
      case "next_question": {
        const profileForCount = await this.prisma.studentProfile.findUnique({
          where: { id: student.studentProfileId },
          select: { diagnosticState: true },
        });
        const state = profileForCount?.diagnosticState as { answers?: unknown[] } | null;
        const answered = Array.isArray(state?.answers) ? state.answers.length : 0;
        reply = this.diagnosticHandler.formatNextMessage(action.question, answered);
        diagnosticAction = "next_question";
        break;
      }
      case "cant_understand": {
        const profileForCount = await this.prisma.studentProfile.findUnique({
          where: { id: student.studentProfileId },
          select: { diagnosticState: true },
        });
        const state = profileForCount?.diagnosticState as { answers?: unknown[] } | null;
        const answered = Array.isArray(state?.answers) ? state.answers.length : 0;
        reply = this.diagnosticHandler.formatCantUnderstandMessage(action.lastQuestion, answered);
        diagnosticAction = "cant_understand";
        break;
      }
      case "start_or_resume":
        reply = this.diagnosticHandler.formatStartMessage(
          student.studentName,
          action.question,
          action.resumed,
        );
        diagnosticAction = "restart";
        break;
      case "already_completed":
        reply = this.diagnosticHandler.formatAlreadyCompletedMessage(student.studentName);
        diagnosticAction = "already_completed";
        break;
    }

    return this.persistAndSend(
      student,
      message,
      inboundBody,
      "diagnostic",
      reply,
      diagnosticAction,
    );
  }

  private async persistAndSend(
    student: ResolvedStudent,
    message: InboundMessage,
    inboundBody: string,
    subject: string,
    reply: string,
    diagnosticAction: string,
  ): Promise<OrchestratorOutcome> {
    const stored = await this.conversation.appendInboundMessage({
      student,
      subject,
      body: inboundBody,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      twilioMessageSid: message.messageSid,
      safetyStatus: "safe",
    });

    await this.conversation.appendOutboundMessage({
      conversationId: stored.conversationId,
      tenantId: student.tenantId,
      body: reply,
      modelUsed: "diagnostic-handler",
      tokensUsed: 0,
      safetyStatus: "safe",
    });

    const send = await this.sender.send({
      toWhatsappPhone: this.replyPhone(student),
      body: reply,
    });

    this.log.info(
      {
        studentId: student.studentId,
        diagnosticAction,
        outboundSid: send.messageSid,
      },
      "orchestrator.diagnostic_handled",
    );

    return {
      status: "diagnostic",
      conversationId: stored.conversationId,
      outboundSid: send.messageSid,
      reply,
      safetyStatus: "safe",
      diagnosticAction,
    };
  }

  private async handleCommand(
    student: ResolvedStudent,
    message: InboundMessage,
    inboundBody: string,
    subject: string,
    command: SlashCommand,
  ): Promise<OrchestratorOutcome> {
    const result = this.commands.handle(command, student);

    const stored = await this.conversation.appendInboundMessage({
      student,
      subject,
      body: inboundBody,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      twilioMessageSid: message.messageSid,
      safetyStatus: "safe",
    });

    await this.conversation.appendOutboundMessage({
      conversationId: stored.conversationId,
      tenantId: student.tenantId,
      body: result.reply,
      modelUsed: "command-handler",
      tokensUsed: 0,
      safetyStatus: "safe",
    });

    if (result.closeConversation) {
      await this.conversation.closeConversation(stored.conversationId, "Cerrada por /pausar");
    }

    const send = await this.sender.send({
      toWhatsappPhone: this.replyPhone(student),
      body: result.reply,
    });

    this.log.info(
      {
        studentId: student.studentId,
        command: result.command,
        outboundSid: send.messageSid,
      },
      "orchestrator.command_handled",
    );

    return {
      status: "answered",
      conversationId: stored.conversationId,
      outboundSid: send.messageSid,
      reply: result.reply,
      safetyStatus: "safe",
    };
  }

  private async handleConversation(
    student: ResolvedStudent,
    message: InboundMessage,
    inboundBody: string,
    subject: string,
  ): Promise<OrchestratorOutcome> {
    const tutor = new TutorAgent(this.llm, {
      model: getApoyoAIModelForPlan(student.subscription.planCode ?? student.subscription.plan),
    });
    const tutorResponse = await tutor.respond({
      studentName: student.studentName,
      grade: student.grade,
      subject,
      message: inboundBody,
      learningStyle: student.learningStyle ?? undefined,
    });

    const stored = await this.conversation.appendInboundMessage({
      student,
      subject,
      body: inboundBody,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      twilioMessageSid: message.messageSid,
      safetyStatus: tutorResponse.safety.status,
    });

    await this.conversation.appendOutboundMessage({
      conversationId: stored.conversationId,
      tenantId: student.tenantId,
      body: tutorResponse.content,
      modelUsed: tutorResponse.modelUsed,
      tokensUsed: tutorResponse.tokensUsed,
      safetyStatus: tutorResponse.safety.status,
    });

    const send = await this.sender.send({
      toWhatsappPhone: this.replyPhone(student),
      body: tutorResponse.content,
    });

    if (tutorResponse.safety.status === "escalate") {
      await this.humanHandoff.create({
        student,
        conversationId: stored.conversationId,
        source: "academic",
        reason: tutorResponse.recommendedAction ?? "safety_escalation",
        inboundMessage: inboundBody,
        outboundMessage: tutorResponse.content,
        metadata: {
          safetyStatus: tutorResponse.safety.status,
          safetySignals: tutorResponse.safety.signals,
          crisisSeverity: tutorResponse.safety.crisisAlert?.severity,
        },
      });
    }

    this.logTutorResponse(student, tutorResponse, send.messageSid);

    return {
      status: "answered",
      conversationId: stored.conversationId,
      outboundSid: send.messageSid,
      bypassedLlm: tutorResponse.bypassedLlm,
      safetyStatus: tutorResponse.safety.status,
      reply: tutorResponse.content,
      channel: "academic",
    };
  }

  private async handleInstitutionalConversation(
    student: ResolvedStudent,
    message: InboundMessage,
    inboundBody: string,
  ): Promise<OrchestratorOutcome> {
    const agentResponse = await this.institutionalAgent.respond(student, inboundBody);

    const stored = await this.conversation.appendInboundMessage({
      student,
      subject: "institucional",
      body: inboundBody,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      twilioMessageSid: message.messageSid,
      safetyStatus: agentResponse.shouldEscalate ? "escalate" : "safe",
    });

    await this.conversation.appendOutboundMessage({
      conversationId: stored.conversationId,
      tenantId: student.tenantId,
      body: agentResponse.replyText,
      modelUsed: agentResponse.modelUsed,
      tokensUsed: agentResponse.tokensUsed,
      safetyStatus: agentResponse.shouldEscalate ? "escalate" : "safe",
    });

    const send = await this.sender.send({
      toWhatsappPhone: this.replyPhone(student),
      body: agentResponse.replyText,
    });

    if (agentResponse.shouldEscalate) {
      await this.humanHandoff.create({
        student,
        conversationId: stored.conversationId,
        source: "institutional",
        reason: "human_request",
        inboundMessage: inboundBody,
        outboundMessage: agentResponse.replyText,
        metadata: {
          toolEvents: agentResponse.toolEvents,
        },
      });
    }

    this.log.info(
      {
        studentId: student.studentId,
        outboundSid: send.messageSid,
        shouldEscalate: agentResponse.shouldEscalate,
        toolEvents: agentResponse.toolEvents,
      },
      "orchestrator.institutional_responded",
    );

    return {
      status: "answered",
      conversationId: stored.conversationId,
      outboundSid: send.messageSid,
      safetyStatus: agentResponse.shouldEscalate ? "escalate" : "safe",
      reply: agentResponse.replyText,
      channel: "institutional",
    };
  }

  private logTutorResponse(
    student: ResolvedStudent,
    tutorResponse: TutorAgentResponse,
    outboundSid: string,
  ): void {
    this.log.info(
      {
        studentId: student.studentId,
        outboundSid,
        bypassedLlm: tutorResponse.bypassedLlm ?? false,
        safetyStatus: tutorResponse.safety.status,
        recommendedAction: tutorResponse.recommendedAction,
        tokensUsed: tutorResponse.tokensUsed,
        cacheRead: tutorResponse.cache?.cacheReadInputTokens,
        signals: tutorResponse.safety.signals,
      },
      "orchestrator.tutor_responded",
    );

    if (tutorResponse.safety.status === "escalate") {
      this.log.warn(
        {
          studentId: student.studentId,
          familyId: student.familyId,
          signals: tutorResponse.safety.signals,
          severity: tutorResponse.safety.crisisAlert?.severity,
        },
        "orchestrator.crisis_alert",
      );
    }
  }

  private async materializeBody(message: InboundMessage): Promise<string> {
    if (!message.mediaUrl) {
      return message.body.trim();
    }

    if (message.mediaType?.startsWith("image/")) {
      const ocr = await this.ocr.extractTextFromImage(message.mediaUrl);
      if (ocr.unreadable) {
        return "[OCR no pudo leer la imagen — pedile al alumno que reenvíe la foto con mejor luz]";
      }
      const caption = message.body.trim();
      return caption
        ? `${caption}\n\n[Foto del ejercicio]\n${ocr.text}`
        : `[Foto del ejercicio]\n${ocr.text}`;
    }

    if (message.mediaType?.startsWith("audio/")) {
      const transcription = await this.audio.transcribe(message.mediaUrl);
      return `[Audio del alumno transcripto]\n${transcription.text}`;
    }

    return message.body.trim();
  }

  private inferSubject(body: string): string {
    const lower = body.toLowerCase();
    if (
      /\b(matemática|matematica|fracci|integral|derivad|geometr|álgebra|algebra|sumar|restar|multipl|divid|ecuaci)/i.test(
        lower,
      )
    ) {
      return "matematica";
    }
    if (
      /\b(lengua|cuento|texto|sintáctico|sintactic|verbo|sujeto|predicado|literatura|poesía|poesia)/i.test(
        lower,
      )
    ) {
      return "lengua";
    }
    if (
      /\b(ciencia|biolog|física|fisica|química|quimica|célula|celula|átomo|atomo|fotosíntesis|densidad|fuerza)/i.test(
        lower,
      )
    ) {
      return "ciencias naturales";
    }
    return DEFAULT_SUBJECT;
  }

  private async safeSendFallback(toWhatsappPhone: string, body: string): Promise<void> {
    try {
      await this.sender.send({ toWhatsappPhone, body });
    } catch (error) {
      this.log.error(
        { err: error instanceof Error ? error.message : String(error) },
        "orchestrator.fallback_send_failed",
      );
    }
  }

  private replyPhone(student: ResolvedStudent): string {
    return student.replyWhatsappPhone ?? student.whatsappPhone;
  }

  private async handleKnownOperationalError(
    error: unknown,
    message: InboundMessage,
  ): Promise<OrchestratorOutcome | null> {
    if (error instanceof StudentNotEnrolledError) {
      const reply =
        "Todavia no encuentro este WhatsApp en ApoyoAI. Para activarlo, el adulto responsable tiene que registrar la familia, cargar el alumno y vincular este numero como telefono del adulto o del hijo.";
      await this.safeSendFallback(message.fromWhatsappPhone, reply);
      return { status: "not_enrolled", reply };
    }

    if (error instanceof StudentSelectionRequiredError) {
      const names = error.studentNames.join(", ");
      const reply = `Este WhatsApp esta vinculado a mas de un alumno: ${names}. Mandame el nombre del alumno en el mensaje, por ejemplo: "Mateo, no entiendo fracciones".`;
      await this.safeSendFallback(message.fromWhatsappPhone, reply);
      return { status: "selection_required", reply };
    }

    if (error instanceof SubscriptionInactiveError) {
      const reply =
        "La suscripcion de esta familia todavia no esta activa. Cuando el pago quede confirmado, ApoyoAI va a responder por este mismo WhatsApp.";
      await this.safeSendFallback(message.fromWhatsappPhone, reply);
      return { status: "subscription_inactive", reply };
    }

    if (error instanceof RateLimitExceededError) {
      const reply =
        "Llegaste al limite de mensajes de tu plan por hoy. Manana se renueva automaticamente; si necesitás mas uso, conviene subir de plan.";
      await this.safeSendFallback(message.fromWhatsappPhone, reply);
      return { status: "rate_limited", reply };
    }

    return null;
  }
}
