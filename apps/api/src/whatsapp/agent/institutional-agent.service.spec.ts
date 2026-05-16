import { describe, expect, it, vi } from "vitest";
import type { LlmClient } from "@educai/ai";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";
import { InstitutionalAgentService } from "./institutional-agent.service.js";

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
    currentPeriodEnd: new Date("2026-05-30T00:00:00.000Z"),
  },
};

describe("InstitutionalAgentService", () => {
  it("arma una respuesta con contexto de tools", async () => {
    const tools = {
      collectForMessage: vi.fn().mockResolvedValue([
        {
          tool: "subscription_status",
          summary: "La familia tiene plan PREMIUM con estado ACTIVE.",
          payload: { plan: "PREMIUM", status: "ACTIVE" },
        },
      ]),
    };
    const llm = {
      generate: vi.fn().mockResolvedValue({
        content: "La familia tiene el plan PREMIUM activo.",
        modelUsed: "gpt-4o-mini",
        tokensUsed: 42,
      }),
    };
    const logger = {
      info: vi.fn(),
      child: vi.fn(),
    };
    const typedLlm: LlmClient = llm;
    const typedTools = tools as unknown as ConstructorParameters<
      typeof InstitutionalAgentService
    >[0];
    const typedLogger = logger as unknown as ConstructorParameters<
      typeof InstitutionalAgentService
    >[2];

    const service = new InstitutionalAgentService(typedTools, typedLlm, typedLogger);
    const result = await service.respond(STUDENT, "Quiero saber el estado de la cuota");

    expect(result.replyText).toContain("PREMIUM");
    expect(result.shouldEscalate).toBe(false);
    expect(llm.generate).toHaveBeenCalledTimes(1);
  });

  it("deriva a humano sin llamar al modelo cuando el caso es sensible", async () => {
    const tools = { collectForMessage: vi.fn() };
    const llm = { generate: vi.fn() };
    const logger = {
      info: vi.fn(),
      child: vi.fn(),
    };
    const typedLlm: LlmClient = llm;
    const typedTools = tools as unknown as ConstructorParameters<
      typeof InstitutionalAgentService
    >[0];
    const typedLogger = logger as unknown as ConstructorParameters<
      typeof InstitutionalAgentService
    >[2];

    const service = new InstitutionalAgentService(typedTools, typedLlm, typedLogger);
    const result = await service.respond(STUDENT, "Necesito hablar urgente con una persona");

    expect(result.shouldEscalate).toBe(true);
    expect(llm.generate).not.toHaveBeenCalled();
  });
});
