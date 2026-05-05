import { Global, Module } from "@nestjs/common";
import {
  AnthropicLlmClient,
  DeterministicLlmClient,
  DiagnosticService,
  type LlmClient,
} from "@educai/ai";

export const DIAGNOSTIC_LLM_CLIENT = Symbol.for("EducAI.DiagnosticLlmClient");

/**
 * Provee un DiagnosticService con LLM real (Claude) cuando hay
 * ANTHROPIC_API_KEY, o un cliente determinístico para tests/CI.
 */
@Global()
@Module({
  providers: [
    {
      provide: DIAGNOSTIC_LLM_CLIENT,
      useFactory: (): LlmClient => {
        if (process.env.ANTHROPIC_API_KEY) {
          return new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY });
        }
        return new DeterministicLlmClient();
      },
    },
    {
      provide: DiagnosticService,
      useFactory: (llm: LlmClient) => new DiagnosticService({ llm }),
      inject: [DIAGNOSTIC_LLM_CLIENT],
    },
  ],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
