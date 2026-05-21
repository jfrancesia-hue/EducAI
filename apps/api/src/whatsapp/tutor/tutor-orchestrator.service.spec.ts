import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TutorOrchestratorService } from "./tutor-orchestrator.service.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

const STUDENT: ResolvedStudent = {
  studentId: "stu_1",
  studentName: "Mateo",
  grade: 5,
  studentProfileId: "prof_1",
  whatsappPhone: "+5493815550202",
  preferredChannel: "whatsapp",
  learningStyle: "visual",
  diagnosticCompleted: true,
  familyId: "fam_1",
  tenantId: "tnt_1",
  subscription: {
    id: "sub_1",
    plan: "PREMIUM",
    status: "ACTIVE",
    currentPeriodEnd: new Date(),
  },
};

interface Mocks {
  resolver: { resolveByWhatsapp: ReturnType<typeof vi.fn> };
  rateLimiter: { assertCanReceive: ReturnType<typeof vi.fn> };
  commands: {
    detect: ReturnType<typeof vi.fn>;
    handle: ReturnType<typeof vi.fn>;
  };
  conversation: {
    appendInboundMessage: ReturnType<typeof vi.fn>;
    appendOutboundMessage: ReturnType<typeof vi.fn>;
    closeConversation: ReturnType<typeof vi.fn>;
  };
  sender: { send: ReturnType<typeof vi.fn> };
  ocr: { extractTextFromImage: ReturnType<typeof vi.fn> };
  audio: { transcribe: ReturnType<typeof vi.fn> };
  llm: { generate: ReturnType<typeof vi.fn> };
  diagnosticHandler: {
    isInProgress: ReturnType<typeof vi.fn>;
    startOrResume: ReturnType<typeof vi.fn>;
    handleAnswer: ReturnType<typeof vi.fn>;
    formatStartMessage: ReturnType<typeof vi.fn>;
    formatNextMessage: ReturnType<typeof vi.fn>;
    formatCantUnderstandMessage: ReturnType<typeof vi.fn>;
    formatCompletedMessage: ReturnType<typeof vi.fn>;
    formatAlreadyCompletedMessage: ReturnType<typeof vi.fn>;
  };
  prisma: {
    studentProfile: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  institutionalIntent: { detect: ReturnType<typeof vi.fn> };
  institutionalAgent: { respond: ReturnType<typeof vi.fn> };
  institutionalAudit: { record: ReturnType<typeof vi.fn> };
  humanHandoff: { create: ReturnType<typeof vi.fn> };
}

function buildMocks(): Mocks {
  return {
    resolver: { resolveByWhatsapp: vi.fn().mockResolvedValue(STUDENT) },
    rateLimiter: {
      assertCanReceive: vi.fn().mockResolvedValue({
        allowed: true,
        plan: "PREMIUM",
        dailyLimit: null,
        used: 0,
        remaining: null,
      }),
    },
    commands: { detect: vi.fn().mockReturnValue(null), handle: vi.fn() },
    conversation: {
      appendInboundMessage: vi
        .fn()
        .mockResolvedValue({ conversationId: "conv_1", messageId: "msg_1" }),
      appendOutboundMessage: vi.fn().mockResolvedValue("msg_2"),
      closeConversation: vi.fn().mockResolvedValue(undefined),
    },
    sender: {
      send: vi.fn().mockResolvedValue({ messageSid: "SM123", status: "queued" }),
    },
    ocr: {
      extractTextFromImage: vi.fn().mockResolvedValue({
        text: "ejercicio leído",
        confidence: 0.9,
        modelUsed: "claude-sonnet-4-6",
        tokensUsed: 100,
      }),
    },
    audio: {
      transcribe: vi.fn().mockResolvedValue({
        text: "no entiendo las restas",
        language: "es",
        modelUsed: "whisper-1",
      }),
    },
    llm: {
      generate: vi.fn().mockResolvedValue({
        content: "Buena pregunta. ¿Qué intentaste hasta ahora?",
        tokensUsed: 100,
        modelUsed: "claude-sonnet-4-6",
        cache: { cacheCreationInputTokens: 0, cacheReadInputTokens: 4500 },
      }),
    },
    diagnosticHandler: {
      isInProgress: vi.fn().mockReturnValue(false),
      startOrResume: vi.fn(),
      handleAnswer: vi.fn(),
      formatStartMessage: vi.fn().mockReturnValue("Hola Mateo, vamos con el diagnóstico..."),
      formatNextMessage: vi.fn().mockReturnValue("Buena. Próxima pregunta..."),
      formatCantUnderstandMessage: vi.fn().mockReturnValue("No entendí, mandá A/B/C/D"),
      formatCompletedMessage: vi.fn().mockReturnValue("¡Genial Mateo! Terminamos el diagnóstico."),
      formatAlreadyCompletedMessage: vi.fn().mockReturnValue("Mateo, ya hicimos el diagnóstico."),
    },
    prisma: {
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ diagnosticState: null }),
      },
    },
    institutionalIntent: {
      detect: vi.fn().mockReturnValue({
        channel: "academic",
        confidence: "low",
        reasons: ["default_academic"],
      }),
    },
    institutionalAgent: {
      respond: vi.fn().mockResolvedValue({
        replyText: "Respuesta institucional",
        modelUsed: "gpt-4o-mini",
        tokensUsed: 32,
        shouldEscalate: false,
        toolEvents: [{ tool: "student_summary", ok: true, summary: "ok" }],
      }),
    },
    institutionalAudit: {
      record: vi.fn().mockResolvedValue(undefined),
    },
    humanHandoff: {
      create: vi.fn().mockResolvedValue({ id: "log_1" }),
    },
  };
}

const loggerStub = {
  child: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
} as unknown as ConstructorParameters<typeof TutorOrchestratorService>[13];

function buildOrchestrator(m: Mocks): TutorOrchestratorService {
  const resolver = m.resolver as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[0];
  const rateLimiter = m.rateLimiter as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[1];
  const commands = m.commands as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[2];
  const conversation = m.conversation as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[3];
  const sender = m.sender as unknown as ConstructorParameters<typeof TutorOrchestratorService>[4];
  const ocr = m.ocr as unknown as ConstructorParameters<typeof TutorOrchestratorService>[5];
  const audio = m.audio as unknown as ConstructorParameters<typeof TutorOrchestratorService>[6];
  const llm = m.llm as unknown as ConstructorParameters<typeof TutorOrchestratorService>[7];
  const diagnosticHandler = m.diagnosticHandler as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[8];
  const prisma = m.prisma as unknown as ConstructorParameters<typeof TutorOrchestratorService>[9];
  const institutionalIntent = m.institutionalIntent as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[10];
  const institutionalAgent = m.institutionalAgent as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[11];
  const institutionalAudit = m.institutionalAudit as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[12];
  const humanHandoff = m.humanHandoff as unknown as ConstructorParameters<
    typeof TutorOrchestratorService
  >[13];

  return new TutorOrchestratorService(
    resolver,
    rateLimiter,
    commands,
    conversation,
    sender,
    ocr,
    audio,
    llm,
    diagnosticHandler,
    prisma,
    institutionalIntent,
    institutionalAgent,
    institutionalAudit,
    humanHandoff,
    loggerStub,
  );
}

describe("TutorOrchestratorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("flujo feliz: mensaje normal de matemática llama al LLM, persiste y envía respuesta", async () => {
    const m = buildMocks();
    const orchestrator = buildOrchestrator(m);

    const outcome = await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_1",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "¿cómo sumo 1/2 + 1/4?",
    });

    expect(outcome.status).toBe("answered");
    expect(outcome.outboundSid).toBe("SM123");
    expect(m.resolver.resolveByWhatsapp).toHaveBeenCalledWith(
      "whatsapp:+5493815550202",
      expect.stringContaining("1/2 + 1/4"),
    );
    expect(m.rateLimiter.assertCanReceive).toHaveBeenCalled();
    expect(m.llm.generate).toHaveBeenCalledTimes(1);
    expect(m.conversation.appendInboundMessage).toHaveBeenCalled();
    expect(m.conversation.appendOutboundMessage).toHaveBeenCalled();
    expect(m.sender.send).toHaveBeenCalledWith(
      expect.objectContaining({ toWhatsappPhone: "+5493815550202" }),
    );
    expect(outcome.channel).toBe("academic");
  });

  it("consulta institucional deriva al agente institucional", async () => {
    const m = buildMocks();
    m.institutionalIntent.detect.mockReturnValue({
      channel: "institutional",
      confidence: "high",
      reasons: ["institutional_pattern_1"],
    });
    const orchestrator = buildOrchestrator(m);

    const outcome = await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_inst_1",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "Quiero saber si la cuota está al día",
    });

    expect(outcome.status).toBe("answered");
    expect(outcome.channel).toBe("institutional");
    expect(m.institutionalAgent.respond).toHaveBeenCalledTimes(1);
    expect(m.institutionalAudit.record).toHaveBeenCalledTimes(1);
    expect(m.llm.generate).not.toHaveBeenCalled();
    expect(m.humanHandoff.create).not.toHaveBeenCalled();
    const inboundArg = m.conversation.appendInboundMessage.mock.calls[0]?.[0] as {
      subject: string;
    };
    expect(inboundArg.subject).toBe("institucional");
  });

  it("crisis: bypassea LLM y envía template de derivación", async () => {
    const m = buildMocks();
    const orchestrator = buildOrchestrator(m);

    const outcome = await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_2",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "a veces me quiero matar, no aguanto más",
    });

    expect(outcome.status).toBe("answered");
    expect(outcome.bypassedLlm).toBe(true);
    expect(outcome.safetyStatus).toBe("escalate");
    expect(m.llm.generate).not.toHaveBeenCalled();
    expect(m.sender.send).toHaveBeenCalled();
    expect(m.humanHandoff.create).toHaveBeenCalledTimes(1);
    const sendArg = m.sender.send.mock.calls[0]?.[0] as { body: string };
    expect(sendArg.body).toContain("102");
    expect(sendArg.body).toContain("Mateo");
  });

  it("consulta institucional sensible crea handoff humano", async () => {
    const m = buildMocks();
    m.institutionalIntent.detect.mockReturnValue({
      channel: "institutional",
      confidence: "high",
      reasons: ["institutional_pattern_5"],
    });
    m.institutionalAgent.respond.mockResolvedValue({
      replyText: "Lo dejo listo para seguimiento humano.",
      modelUsed: "policy-escalation",
      tokensUsed: 0,
      shouldEscalate: true,
      toolEvents: [{ tool: "human_handoff", ok: true, summary: "Se activó derivación a humano." }],
    });
    const orchestrator = buildOrchestrator(m);

    await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_inst_2",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "Necesito hablar urgente con una persona",
    });

    expect(m.humanHandoff.create).toHaveBeenCalledTimes(1);
  });

  it("comando /ayuda se maneja sin llamar al LLM", async () => {
    const m = buildMocks();
    m.commands.detect.mockReturnValue("ayuda");
    m.commands.handle.mockReturnValue({ command: "ayuda", reply: "Hola Mateo, soy Mica..." });
    const orchestrator = buildOrchestrator(m);

    const outcome = await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_3",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "/ayuda",
    });

    expect(outcome.status).toBe("answered");
    expect(m.llm.generate).not.toHaveBeenCalled();
    expect(m.commands.handle).toHaveBeenCalledWith("ayuda", STUDENT);
    expect(m.conversation.closeConversation).not.toHaveBeenCalled();
  });

  it("comando /pausar cierra la conversación", async () => {
    const m = buildMocks();
    m.commands.detect.mockReturnValue("pausar");
    m.commands.handle.mockReturnValue({
      command: "pausar",
      reply: "Listo Mateo, paramos por hoy.",
      closeConversation: true,
    });
    const orchestrator = buildOrchestrator(m);

    await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_4",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "/pausar",
    });

    expect(m.conversation.closeConversation).toHaveBeenCalledWith("conv_1", "Cerrada por /pausar");
  });

  it("imagen: corre OCR y pasa el texto al TutorAgent", async () => {
    const m = buildMocks();
    const orchestrator = buildOrchestrator(m);

    await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_5",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "",
      mediaUrl: "https://api.twilio.com/photo.jpg",
      mediaType: "image/jpeg",
    });

    expect(m.ocr.extractTextFromImage).toHaveBeenCalledWith("https://api.twilio.com/photo.jpg");
    expect(m.llm.generate).toHaveBeenCalled();
    const llmArg = m.llm.generate.mock.calls[0]?.[0] as { messages: Array<{ content: string }> };
    expect(llmArg.messages[0]?.content).toContain("ejercicio leído");
  });

  it("audio: corre Whisper y pasa la transcripción al TutorAgent", async () => {
    const m = buildMocks();
    const orchestrator = buildOrchestrator(m);

    await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_6",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "",
      mediaUrl: "https://api.twilio.com/audio.mp3",
      mediaType: "audio/mpeg",
    });

    expect(m.audio.transcribe).toHaveBeenCalledWith("https://api.twilio.com/audio.mp3");
    expect(m.llm.generate).toHaveBeenCalled();
    const llmArg = m.llm.generate.mock.calls[0]?.[0] as { messages: Array<{ content: string }> };
    expect(llmArg.messages[0]?.content).toContain("no entiendo las restas");
  });

  it("OCR ilegible devuelve mensaje pidiendo reenvío", async () => {
    const m = buildMocks();
    m.ocr.extractTextFromImage.mockResolvedValue({
      text: "",
      confidence: 0.1,
      unreadable: true,
      blurry: true,
      modelUsed: "claude-sonnet-4-6",
      tokensUsed: 50,
    });
    const orchestrator = buildOrchestrator(m);

    await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_7",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "",
      mediaUrl: "https://api.twilio.com/blurry.jpg",
      mediaType: "image/jpeg",
    });

    const llmArg = m.llm.generate.mock.calls[0]?.[0] as { messages: Array<{ content: string }> };
    expect(llmArg.messages[0]?.content).toContain("reenvíe la foto");
  });

  it("error de orquestación responde fallback genérico al alumno", async () => {
    const m = buildMocks();
    m.resolver.resolveByWhatsapp.mockRejectedValue(new Error("DB caída"));
    const orchestrator = buildOrchestrator(m);

    const outcome = await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_8",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "hola",
    });

    expect(outcome.status).toBe("error");
    expect(m.sender.send).toHaveBeenCalled();
    const sendArg = m.sender.send.mock.calls[0]?.[0] as { body: string };
    expect(sendArg.body).toContain("problema técnico");
  });

  it("infiere subject 'matematica' por keywords", async () => {
    const m = buildMocks();
    const orchestrator = buildOrchestrator(m);

    await orchestrator.enqueueInboundMessage({
      messageSid: "SM_in_9",
      fromWhatsappPhone: "whatsapp:+5493815550202",
      toWhatsappPhone: "whatsapp:+1415555",
      body: "no entiendo las fracciones equivalentes",
    });

    const inboundArg = m.conversation.appendInboundMessage.mock.calls[0]?.[0] as {
      subject: string;
    };
    expect(inboundArg.subject).toBe("matematica");
  });
});
