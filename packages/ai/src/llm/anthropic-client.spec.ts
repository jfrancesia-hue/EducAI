import { describe, expect, it, vi } from "vitest";
import { AnthropicLlmClient } from "./anthropic-client.js";

function buildMockAnthropic(response: unknown) {
  const create = vi.fn().mockResolvedValue(response);
  return {
    create,
    anthropic: {
      beta: {
        promptCaching: {
          messages: { create },
        },
      },
    } as never,
  };
}

const SAMPLE_RESPONSE = {
  id: "msg_123",
  type: "message",
  role: "assistant",
  model: "claude-opus-4-7",
  content: [{ type: "text", text: "Buena pregunta. ¿Qué intentaste hasta ahora?" }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 120,
    output_tokens: 25,
    cache_creation_input_tokens: 4200,
    cache_read_input_tokens: 0,
  },
};

describe("AnthropicLlmClient", () => {
  it("invoca beta.promptCaching.messages.create con system blocks correctos", async () => {
    const { create, anthropic } = buildMockAnthropic(SAMPLE_RESPONSE);
    const client = new AnthropicLlmClient({ anthropic });

    await client.generate({
      model: "claude-opus-4-7",
      maxTokens: 700,
      system: [
        { type: "text", text: "STATIC PEDAGOGICAL RULES", cacheable: true },
        { type: "text", text: "Alumno: Mateo, grado 5", cacheable: false },
      ],
      messages: [{ role: "user", content: "¿cómo sumo fracciones?" }],
    });

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0]?.[0] as any;
    expect(arg.model).toBe("claude-opus-4-7");
    expect(arg.max_tokens).toBe(700);
    expect(arg.system).toHaveLength(2);
    expect(arg.system[0]).toEqual({
      type: "text",
      text: "STATIC PEDAGOGICAL RULES",
      cache_control: { type: "ephemeral" },
    });
    expect(arg.system[1]).toEqual({
      type: "text",
      text: "Alumno: Mateo, grado 5",
    });
    expect(arg.messages).toEqual([{ role: "user", content: "¿cómo sumo fracciones?" }]);
  });

  it("acepta system como string y lo convierte en text block sin cache", async () => {
    const { create, anthropic } = buildMockAnthropic(SAMPLE_RESPONSE);
    const client = new AnthropicLlmClient({ anthropic });

    await client.generate({
      model: "claude-opus-4-7",
      system: "prompt simple",
      messages: [{ role: "user", content: "hola" }],
    });

    const arg = create.mock.calls[0]?.[0] as any;
    expect(arg.system).toEqual([{ type: "text", text: "prompt simple" }]);
  });

  it("expone métricas de cache en el output", async () => {
    const { anthropic } = buildMockAnthropic(SAMPLE_RESPONSE);
    const client = new AnthropicLlmClient({ anthropic });

    const result = await client.generate({
      model: "claude-opus-4-7",
      messages: [{ role: "user", content: "test" }],
    });

    expect(result.cache).toEqual({
      cacheCreationInputTokens: 4200,
      cacheReadInputTokens: 0,
    });
    expect(result.tokensUsed).toBe(145);
    expect(result.inputTokens).toBe(120);
    expect(result.outputTokens).toBe(25);
    expect(result.modelUsed).toBe("claude-opus-4-7");
    expect(result.stopReason).toBe("end_turn");
  });

  it("filtra mensajes con role=system del array messages", async () => {
    const { create, anthropic } = buildMockAnthropic(SAMPLE_RESPONSE);
    const client = new AnthropicLlmClient({ anthropic });

    await client.generate({
      model: "claude-opus-4-7",
      messages: [
        { role: "system", content: "should be filtered" },
        { role: "user", content: "real user message" },
      ],
    });

    const arg = create.mock.calls[0]?.[0] as any;
    expect(arg.messages).toHaveLength(1);
    expect(arg.messages[0]).toEqual({ role: "user", content: "real user message" });
  });

  it("usa valores por defecto si no se pasa model ni maxTokens", async () => {
    const { create, anthropic } = buildMockAnthropic(SAMPLE_RESPONSE);
    const client = new AnthropicLlmClient({ anthropic });

    await client.generate({
      model: "",
      messages: [{ role: "user", content: "test" }],
    });

    const arg = create.mock.calls[0]?.[0] as any;
    expect(arg.model).toBe("claude-sonnet-4-5");
    expect(arg.max_tokens).toBe(1024);
  });

  it("maneja respuesta sin cache_creation_input_tokens (uncached request)", async () => {
    const responseSinCache = {
      ...SAMPLE_RESPONSE,
      usage: { input_tokens: 50, output_tokens: 10 },
    };
    const { anthropic } = buildMockAnthropic(responseSinCache);
    const client = new AnthropicLlmClient({ anthropic });

    const result = await client.generate({
      model: "claude-opus-4-7",
      messages: [{ role: "user", content: "test" }],
    });

    expect(result.cache).toEqual({
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    });
  });
});
