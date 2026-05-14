const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_WHATSAPP_FROM",
] as const;

export function requireWhatsappProductionEnv(env: NodeJS.ProcessEnv): void {
  requireProductionEnv("whatsapp-agent", REQUIRED_PRODUCTION_ENV, env);

  if (env.NODE_ENV !== "production") {
    return;
  }

  if (env.ANTHROPIC_API_KEY?.trim() || env.OPENAI_API_KEY?.trim()) {
    return;
  }

  throw new Error(
    "[whatsapp-agent] faltan variables de entorno obligatorias para produccion: ANTHROPIC_API_KEY o OPENAI_API_KEY",
  );
}

function requireProductionEnv(
  service: string,
  keys: readonly string[],
  env: NodeJS.ProcessEnv,
): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  const missing = keys.filter((key) => !env[key]?.trim());
  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `[${service}] faltan variables de entorno obligatorias para produccion: ${missing.join(", ")}`,
  );
}
