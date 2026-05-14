import type { LlmClient, LlmGenerateInput, LlmGenerateOutput, LlmSystemPrompt } from "@educai/ai";

export interface OpenAiLlmClientOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAiLlmClient implements LlmClient {
  private readonly apiKey?: string;
  private readonly defaultModel: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAiLlmClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.defaultModel = options.model ?? DEFAULT_MODEL;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY no está configurada para el proveedor OpenAI.");
    }

    const response = await this.fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model || this.defaultModel,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        response_format: input.responseFormat === "json" ? { type: "json_object" } : undefined,
        messages: this.toMessages(input),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI chat completion falló (${response.status}): ${body}`);
    }

    const completion = (await response.json()) as OpenAiChatCompletionResponse;
    const content = completion.choices[0]?.message?.content?.trim() ?? "";

    return {
      content,
      modelUsed: completion.model,
      tokensUsed: completion.usage?.total_tokens ?? Math.ceil(content.length / 4),
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
      stopReason: completion.choices[0]?.finish_reason,
    };
  }

  private toMessages(input: LlmGenerateInput): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    const system = this.systemToText(input.system);

    if (system) {
      messages.push({ role: "system", content: system });
    }

    for (const message of input.messages) {
      messages.push({
        role: message.role,
        content: message.content,
      });
    }

    return messages;
  }

  private systemToText(system: LlmSystemPrompt | undefined): string {
    if (!system) {
      return "";
    }

    if (typeof system === "string") {
      return system;
    }

    return system
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n")
      .trim();
  }
}

interface OpenAiChatCompletionResponse {
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  choices: Array<{
    finish_reason?: string;
    message?: {
      content?: string;
    };
  }>;
}
