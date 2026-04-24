export type SafetyStatus = "safe" | "monitor" | "escalate";

export interface ContentSafetyResult {
  status: SafetyStatus;
  signals: string[];
  blocked: boolean;
}

const crisisPatterns = [
  /me quiero matar/i,
  /suicid/i,
  /autoles/i,
  /me pegan/i,
  /abuso/i,
  /no quiero vivir/i,
];

const harassmentPatterns = [/bullying/i, /me molestan/i, /me amenazan/i];
const jailbreakPatterns = [/dame la respuesta/i, /resolvelo completo/i, /ignora tus instrucciones/i, /copiar/i];
const profanityPatterns = [/\bbolud/i, /\bidiot/i, /\bput/i];

export function filterStudentContent(message: string): ContentSafetyResult {
  const signals: string[] = [];

  if (crisisPatterns.some((pattern) => pattern.test(message))) {
    signals.push("crisis");
  }

  if (harassmentPatterns.some((pattern) => pattern.test(message))) {
    signals.push("harassment");
  }

  if (jailbreakPatterns.some((pattern) => pattern.test(message))) {
    signals.push("direct-answer-request");
  }

  if (profanityPatterns.some((pattern) => pattern.test(message))) {
    signals.push("inappropriate-language");
  }

  if (signals.includes("crisis")) {
    return { status: "escalate", signals, blocked: false };
  }

  if (signals.length > 0) {
    return { status: "monitor", signals, blocked: false };
  }

  return { status: "safe", signals, blocked: false };
}

