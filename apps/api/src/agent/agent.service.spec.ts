import type { ConfigService } from "@nestjs/config";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import type { LlmClient } from "@educai/ai";
import type { AppLogger } from "../common/logger/app-logger.service.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { AgentService } from "./agent.service.js";

const SILENT = pino({ enabled: false });

function loggerStub(): AppLogger {
  return {
    child: () => SILENT,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  } as unknown as AppLogger;
}

function configStub(values: Record<string, string | undefined> = {}): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

const ACTOR: AuthenticatedUser = {
  sub: "usr_1",
  tenantId: "tnt_1",
  role: "TEACHER",
};

describe("AgentService", () => {
  it("sin topic ni prompt devuelve plantilla local en modo review", async () => {
    const service = new AgentService(configStub(), loggerStub());

    const result = await service.run({}, ACTOR);

    expect(result.mode).toBe("review");
    expect(result.modelUsed).toBe("local-template");
    expect(result.tokensUsed).toBe(0);
    expect(result.output).toContain("Objetivo docente");
    expect(typeof result.latencyMs).toBe("number");
    expect(typeof result.createdAt).toBe("string");
  });

  it("sin LLM configurado y con topic devuelve plantilla local", async () => {
    const service = new AgentService(configStub({ ANTHROPIC_API_KEY: undefined }), loggerStub());

    const result = await service.run({ topic: "fracciones" }, ACTOR);

    expect(result.mode).toBe("review");
    expect(result.output).toContain("fracciones");
  });

  it("con LLM inyectado llama generate y devuelve mode=live", async () => {
    const generate = vi.fn().mockResolvedValue({
      content: "Plan generado por Claude",
      modelUsed: "claude-test",
      tokensUsed: 320,
      inputTokens: 100,
      outputTokens: 220,
    });
    const llm: LlmClient = { generate };
    const service = new AgentService(configStub(), loggerStub(), llm);

    const result = await service.run({ topic: "ecuaciones" }, ACTOR);

    expect(result.mode).toBe("live");
    expect(result.modelUsed).toBe("claude-test");
    expect(result.tokensUsed).toBe(320);
    expect(result.output).toBe("Plan generado por Claude");
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("ante error del LLM cae en fallback_error_modelo con plantilla local", async () => {
    const generate = vi.fn().mockRejectedValue(new Error("anthropic 502"));
    const llm: LlmClient = { generate };
    const service = new AgentService(configStub(), loggerStub(), llm);

    const result = await service.run({ topic: "energia" }, ACTOR);

    expect(result.mode).toBe("fallback_error_modelo");
    expect(result.modelUsed).toBe("local-template");
    expect(result.output).toContain("energia");
  });

  it("normaliza valores por defecto cuando faltan campos", async () => {
    const generate = vi.fn().mockResolvedValue({
      content: "ok",
      modelUsed: "claude-test",
      tokensUsed: 10,
      inputTokens: 5,
      outputTokens: 5,
    });
    const llm: LlmClient = { generate };
    const service = new AgentService(configStub(), loggerStub(), llm);

    await service.run({ topic: "fotosintesis" }, ACTOR);

    const args = generate.mock.calls[0]![0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const userPrompt = args.messages[0]!.content;
    expect(userPrompt).toContain("Modo: planificacion");
    expect(userPrompt).toContain("Curso: 7A");
    expect(userPrompt).toContain("Materia: Matematica");
    expect(userPrompt).toContain("Duracion: 40 minutos");
    expect(userPrompt).toContain("fotosintesis");
  });
});
