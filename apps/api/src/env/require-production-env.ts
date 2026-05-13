const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "ALLOWED_ORIGINS",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function requireApiProductionEnv(env: NodeJS.ProcessEnv): void {
  requireProductionEnv("api", REQUIRED_PRODUCTION_ENV, env);
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
