const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_WHATSAPP_FROM",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

export function requireWhatsappProductionEnv(env: NodeJS.ProcessEnv): void {
  requireProductionEnv("whatsapp-agent", REQUIRED_PRODUCTION_ENV, env);

  if (env.NODE_ENV !== "production") {
    return;
  }

  return;
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
