const REQUIRED_PRODUCTION_ENV = ["DATABASE_URL", "ALLOWED_ORIGINS", "SUPABASE_URL"] as const;

export function requireApiProductionEnv(env: NodeJS.ProcessEnv): void {
  requireProductionEnv("api", REQUIRED_PRODUCTION_ENV, env);

  if (env.NODE_ENV !== "production") {
    return;
  }

  if (env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return;
  }

  throw new Error(
    "[api] faltan variables de entorno obligatorias para produccion: SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY",
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
