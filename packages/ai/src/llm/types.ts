export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmGenerateInput {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface LlmGenerateOutput {
  content: string;
  tokensUsed: number;
  modelUsed: string;
}

export interface LlmClient {
  generate(input: LlmGenerateInput): Promise<LlmGenerateOutput>;
}

export class DeterministicLlmClient implements LlmClient {
  async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    const lastUserMessage = [...input.messages].reverse().find((message) => message.role === "user");
    const content =
      input.responseFormat === "json"
        ? JSON.stringify({ summary: "Analisis generado en modo local", items: [] })
        : `Te acompano paso a paso. Para empezar, contame que intentaste y cual fue el primer punto donde te trabaste. ${lastUserMessage?.content ?? ""}`;

    return {
      content,
      tokensUsed: Math.ceil(content.length / 4),
      modelUsed: input.model,
    };
  }
}

