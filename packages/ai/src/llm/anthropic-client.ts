import Anthropic from "@anthropic-ai/sdk";
import type {
  PromptCachingBetaMessageParam,
  PromptCachingBetaTextBlockParam,
  PromptCachingBetaTool,
} from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import type {
  LlmCachedTextBlock,
  LlmClient,
  LlmGenerateInput,
  LlmGenerateOutput,
  LlmSystemPrompt,
} from "./types.js";
import { getApoyoAIModelForPlan } from "../plans.js";

export interface AnthropicLlmClientOptions {
  apiKey?: string;
  defaultModel?: string;
  defaultMaxTokens?: number;
  baseURL?: string;
  timeoutMs?: number;
  maxRetries?: number;
  anthropic?: Anthropic;
}

const DEFAULT_MODEL = getApoyoAIModelForPlan("plus");
const DEFAULT_MAX_TOKENS = 1024;

/**
 * Cliente Claude para EducAI/ApoyoAI con prompt caching.
 *
 * Usa el endpoint beta `client.beta.promptCaching.messages.create()` para que
 * el system prompt estático del tutor (reglas + few-shot) se cachee con
 * cache_control ephemeral. La parte dinámica (alumno/grado/historial) va
 * en un segundo bloque sin cache_control.
 *
 * Modelo por defecto: Sonnet. Opus queda reservado para informes institucionales
 * explicitamente habilitados por llamada.
 */
export class AnthropicLlmClient implements LlmClient {
  private readonly anthropic: Anthropic;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;

  constructor(options: AnthropicLlmClientOptions = {}) {
    this.anthropic =
      options.anthropic ??
      new Anthropic({
        apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY,
        baseURL: options.baseURL,
        timeout: options.timeoutMs,
        maxRetries: options.maxRetries ?? 2,
      });
    this.defaultModel = options.defaultModel ?? DEFAULT_MODEL;
    this.defaultMaxTokens = options.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    const systemBlocks = this.buildSystemBlocks(input.system);
    const messages = this.toAnthropicMessages(input);

    const request: Parameters<Anthropic["beta"]["promptCaching"]["messages"]["create"]>[0] = {
      model: input.model || this.defaultModel,
      max_tokens: input.maxTokens ?? this.defaultMaxTokens,
      stream: false,
      system: systemBlocks,
      messages,
      tools: input.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as PromptCachingBetaTool["input_schema"],
      })),
      tool_choice: input.toolChoice ? { type: "tool", name: input.toolChoice } : undefined,
    };

    const response = await this.anthropic.beta.promptCaching.messages.create(request);
    if (!("content" in response)) {
      throw new Error("Anthropic streaming responses are not supported by AnthropicLlmClient");
    }

    const textBlock = response.content.find((block) => block.type === "text");
    const content = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const toolBlock = response.content.find((block) => block.type === "tool_use");

    return {
      content,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      modelUsed: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cache: {
        cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      },
      stopReason: response.stop_reason ?? undefined,
      toolUse:
        toolBlock && toolBlock.type === "tool_use"
          ? { name: toolBlock.name, input: toolBlock.input }
          : undefined,
    };
  }

  private buildSystemBlocks(
    system: LlmSystemPrompt | undefined,
  ): PromptCachingBetaTextBlockParam[] | undefined {
    if (!system) {
      return undefined;
    }

    if (typeof system === "string") {
      return [{ type: "text", text: system }];
    }

    return system.map((block) => this.toTextBlock(block));
  }

  private toTextBlock(block: LlmCachedTextBlock): PromptCachingBetaTextBlockParam {
    if (block.cacheable) {
      return {
        type: "text",
        text: block.text,
        cache_control: { type: "ephemeral" },
      };
    }
    return { type: "text", text: block.text };
  }

  private toAnthropicMessages(input: LlmGenerateInput): PromptCachingBetaMessageParam[] {
    return input.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      }));
  }
}
