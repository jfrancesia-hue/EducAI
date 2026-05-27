export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCachedTextBlock {
  type: "text";
  text: string;
  cacheable?: boolean;
}

export type LlmSystemPrompt = string | LlmCachedTextBlock[];

export interface LlmGenerateInput {
  model: string;
  messages: LlmMessage[];
  system?: LlmSystemPrompt;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  tools?: LlmToolDefinition[];
  toolChoice?: string;
}

export interface LlmCacheUsage {
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export interface LlmGenerateOutput {
  content: string;
  tokensUsed: number;
  modelUsed: string;
  inputTokens?: number;
  outputTokens?: number;
  cache?: LlmCacheUsage;
  stopReason?: string;
  toolUse?: LlmToolUse;
}

export interface LlmClient {
  generate(input: LlmGenerateInput): Promise<LlmGenerateOutput>;
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LlmToolUse {
  name: string;
  input: unknown;
}

export class DeterministicLlmClient implements LlmClient {
  generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    const lastUserMessage = [...input.messages]
      .reverse()
      .find((message) => message.role === "user");
    const content =
      input.responseFormat === "json"
        ? JSON.stringify({ summary: "Análisis generado en modo local", items: [] })
        : `Te acompaño paso a paso. Para empezar, contame qué intentaste y cuál fue el primer punto donde te trabaste. ${lastUserMessage?.content ?? ""}`;

    return Promise.resolve({
      content,
      tokensUsed: Math.ceil(content.length / 4),
      modelUsed: input.model,
      inputTokens: 0,
      outputTokens: Math.ceil(content.length / 4),
    });
  }
}
