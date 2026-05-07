const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ANTHROPIC_API_KEY",
  "ALLOWED_ORIGINS",
] as const;

export function validateRuntimeEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables requeridas para produccion: ${missing.join(", ")}`);
  }

  if (process.env.ALLOWED_ORIGINS?.includes("localhost")) {
    throw new Error("ALLOWED_ORIGINS de produccion no puede incluir localhost");
  }

  if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres en produccion");
  }

  assertDatabaseUrlDoesNotBypassRls(process.env.DATABASE_URL);
}

export function getAllowedOrigins(): string[] {
  const raw =
    process.env.ALLOWED_ORIGINS ??
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000,http://localhost:3100");

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function assertDatabaseUrlDoesNotBypassRls(databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    return;
  }

  let username = "";
  try {
    username = new URL(databaseUrl).username;
  } catch {
    throw new Error("DATABASE_URL de produccion no es una URL valida");
  }

  if (["postgres", "supabase_admin"].includes(username)) {
    throw new Error(
      "DATABASE_URL de produccion no debe usar un rol con BYPASSRLS; usa un rol app NOBYPASSRLS como educai_app",
    );
  }
}
