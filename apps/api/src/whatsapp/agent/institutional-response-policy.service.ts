import { Injectable } from "@nestjs/common";

import type { InstitutionalAgentResponse } from "./institutional-agent.service.js";

const MAX_LINES = 6;
const MAX_CHARS = 700;
const MISSING_INFO_PATTERN =
  /\b(no tengo|no cuento con|no encuentro|falta informacion|falta información|no veo datos suficientes)\b/i;

@Injectable()
export class InstitutionalResponsePolicyService {
  finalize(response: InstitutionalAgentResponse): InstitutionalAgentResponse {
    const normalized = this.normalize(response.replyText);

    if (!normalized) {
      return {
        ...response,
        replyText:
          "No tengo información suficiente para responder eso con seguridad. Si querés, lo derivo para seguimiento humano.",
        shouldEscalate: true,
      };
    }

    const trimmed = this.trimForWhatsapp(normalized);
    const shouldEscalate = response.shouldEscalate || MISSING_INFO_PATTERN.test(trimmed);

    return {
      ...response,
      replyText: shouldEscalate ? this.ensureHumanFollowup(trimmed) : trimmed,
      shouldEscalate,
    };
  }

  private normalize(text: string): string {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  private trimForWhatsapp(text: string): string {
    const lines = text.split("\n").slice(0, MAX_LINES);
    const joined = lines.join("\n");
    return joined.length <= MAX_CHARS ? joined : `${joined.slice(0, MAX_CHARS - 1).trim()}…`;
  }

  private ensureHumanFollowup(text: string): string {
    if (/seguimiento humano|deriv/i.test(text)) {
      return text;
    }

    return `${text}\n\nSi querés, lo dejo listo para seguimiento humano.`;
  }
}
