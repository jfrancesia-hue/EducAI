const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "ALLOWED_ORIGINS",
  "PUBLIC_APP_URL",
  "SUPABASE_URL",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_PUBLIC_WEBHOOK_URL",
  "TWILIO_FORCE_PROTOCOL",
  "MERCADOPAGO_ACCESS_TOKEN",
  "MERCADOPAGO_WEBHOOK_SECRET",
  // Destino de las alertas de crisis del tutor. El manejo de crisis es bloqueante
  // de release (RELEASE_CHECKLIST), así que sin destinatario no se arranca en prod.
  "CRISIS_ALERT_WHATSAPP_TO",
] as const;

export function requireApiProductionEnv(env: NodeJS.ProcessEnv): void {
  requireProductionEnv("api", REQUIRED_PRODUCTION_ENV, env);

  if (env.NODE_ENV !== "production") {
    return;
  }

  assertNoLocalhostOrigins(env.ALLOWED_ORIGINS);
  assertNoLocalhostUrl("PUBLIC_APP_URL", env.PUBLIC_APP_URL);
  assertNoLocalhostUrl("TWILIO_PUBLIC_WEBHOOK_URL", env.TWILIO_PUBLIC_WEBHOOK_URL);
  assertDatabaseUrlDoesNotBypassRls(env.DATABASE_URL);
  assertDatabaseUrlUsesEducaiSchema(env.DATABASE_URL);
  assertProductionFlag("TWILIO_SKIP_SIGNATURE_VALIDATION", env.TWILIO_SKIP_SIGNATURE_VALIDATION);
  assertProductionFlag("TWILIO_DRY_RUN", env.TWILIO_DRY_RUN);
  // Activar suscripciones pagas sin pago real no puede quedar habilitado en produccion.
  assertProductionFlag(
    "APOYOAI_AUTO_ACTIVATE_PAID_SIGNUPS",
    env.APOYOAI_AUTO_ACTIVATE_PAID_SIGNUPS,
  );

  if (env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return;
  }

  throw new Error(
    "[api] faltan variables de entorno obligatorias para produccion: SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY",
  );
}

function assertNoLocalhostOrigins(allowedOrigins: string | undefined): void {
  const hasLocalOrigin = (allowedOrigins ?? "")
    .split(",")
    .map((origin) => origin.trim().toLowerCase())
    .some((origin) => origin.includes("localhost") || origin.includes("127.0.0.1"));

  if (hasLocalOrigin) {
    throw new Error("[api] ALLOWED_ORIGINS de produccion no puede incluir localhost");
  }
}

function assertNoLocalhostUrl(key: string, value: string | undefined): void {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized.includes("localhost") || normalized.includes("127.0.0.1")) {
    throw new Error(`[api] ${key} de produccion no puede incluir localhost`);
  }
}

function assertProductionFlag(key: string, value: string | undefined): void {
  if ((value ?? "").trim().toLowerCase() === "true") {
    throw new Error(`[api] ${key} no puede ser true en produccion`);
  }
}

function assertDatabaseUrlUsesEducaiSchema(databaseUrl: string | undefined): void {
  let schema = "";

  try {
    schema = new URL(databaseUrl ?? "").searchParams.get("schema")?.toLowerCase() ?? "";
  } catch {
    throw new Error("[api] DATABASE_URL de produccion no es una URL valida");
  }

  if (schema !== "educai") {
    throw new Error(
      "[api] DATABASE_URL de produccion debe incluir schema=educai para no usar public/IncluAI",
    );
  }
}

function assertDatabaseUrlDoesNotBypassRls(databaseUrl: string | undefined): void {
  let username = "";

  try {
    username = new URL(databaseUrl ?? "").username.toLowerCase();
  } catch {
    throw new Error("[api] DATABASE_URL de produccion no es una URL valida");
  }

  if (
    username === "postgres" ||
    username.startsWith("postgres.") ||
    username === "supabase_admin"
  ) {
    throw new Error(
      "[api] DATABASE_URL de produccion no debe usar un rol con BYPASSRLS; usa un rol app NOBYPASSRLS como educai_app",
    );
  }
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
